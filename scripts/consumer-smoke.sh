#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
ARTIFACTS="$WORK/artifacts"
trap 'rm -rf "$WORK"' EXIT

# Fixture app -> the packed packages it installs. Every published package it
# does not list must stay out of its node_modules: the web fixture proves a
# non-Svelte consumer never pulls Svelte in.
FIXTURES=(
	"consumer:core theme svelte"
	"web:core theme assets"
)
PACKAGES=(core theme svelte assets)

package_name() {
	case "$1" in
		core) echo "@trajectonomics/design-system" ;;
		theme) echo "@trajectonomics/design-system-theme" ;;
		svelte) echo "@trajectonomics/design-system-svelte" ;;
		assets) echo "@trajectonomics/design-system-assets" ;;
		*)
			echo "unknown package: $1" >&2
			return 1
			;;
	esac
}

for package in "${PACKAGES[@]}"; do
	(cd "$ROOT/packages/$package" && bun run build)
done

mkdir -p "$ARTIFACTS"
for package in "${PACKAGES[@]}"; do
	(cd "$ROOT/packages/$package" && bun pm pack --filename "$ARTIFACTS/$package.tgz" --quiet)
done

for entry in "${FIXTURES[@]}"; do
	name="${entry%%:*}"
	packages="${entry#*:}"
	fixture="$WORK/$name"

	mkdir -p "$fixture"
	cp -R "$ROOT/fixtures/$name/." "$fixture/"

	tarballs=()
	expected=""
	for package in $packages; do
		tarballs+=("$ARTIFACTS/$package.tgz")
		expected+="$(package_name "$package") "
	done

	forbidden=""
	for package in "${PACKAGES[@]}"; do
		if [[ " $packages " != *" $package "* ]]; then
			forbidden+="$(package_name "$package") "
		fi
	done

	(
		cd "$fixture"
		bun add "${tarballs[@]}"
		FIXTURE="$name" EXPECTED="$expected" FORBIDDEN="$forbidden" bun -e '
const fs = require("node:fs");
const path = require("node:path");
const split = (value) => (value ?? "").split(/\s+/).filter(Boolean);
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));

for (const name of split(process.env.EXPECTED)) {
  const spec = manifest.dependencies?.[name];
  if (typeof spec !== "string" || !spec.endsWith(".tgz")) {
    throw new Error(`${name} was not installed from a packed tarball: ${spec}`);
  }
  const installed = path.join("node_modules", ...name.split("/"));
  if (fs.lstatSync(installed).isSymbolicLink()) {
    throw new Error(`${name} is a workspace symlink, not a packed tarball`);
  }
  const real = fs.realpathSync(installed);
  if (real.includes(`${path.sep}packages${path.sep}`)) {
    throw new Error(`${name} resolved to workspace source: ${real}`);
  }
}

for (const name of split(process.env.FORBIDDEN)) {
  const installed = path.join("node_modules", ...name.split("/"));
  if (fs.existsSync(installed)) {
    throw new Error(`${name} is installed, but the ${process.env.FIXTURE} fixture must not pull it in`);
  }
}

console.log(`Installed ${process.env.EXPECTED}from packed tarballs into the ${process.env.FIXTURE} fixture.`);
'
		bun run check
	)
done
