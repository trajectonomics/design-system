#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
ARTIFACTS="$WORK/artifacts"
FIXTURE="$WORK/fixture"
trap 'rm -rf "$WORK"' EXIT

for package in core theme svelte; do
	(cd "$ROOT/packages/$package" && bun run build)
done

mkdir -p "$ARTIFACTS"
for package in core theme svelte; do
	(cd "$ROOT/packages/$package" && bun pm pack --filename "$ARTIFACTS/$package.tgz" --quiet)
done

mkdir -p "$FIXTURE"
cp -R "$ROOT/fixtures/consumer/." "$FIXTURE/"
cd "$FIXTURE"

bun add "$ARTIFACTS/core.tgz" "$ARTIFACTS/theme.tgz" "$ARTIFACTS/svelte.tgz"

bun -e '
const fs = require("node:fs");
const path = require("node:path");
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const name of [
  "@trajectonomics/design-system",
  "@trajectonomics/design-system-theme",
  "@trajectonomics/design-system-svelte",
]) {
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
console.log("Installed the three packed tarballs into the fixture app.");
'

bun run check
