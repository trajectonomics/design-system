# Publishing @trajectonomics/design-system

Merges to `main` publish alphas; a stable release is the manual **Release core** workflow.
Never run `npm publish` locally (see AGENTS.md), except the one-time first publish below.

Each published package has its own caller of the reusable `.github/workflows/release-package.yml`:

| Package                         | Folder          | Workflow           | Tag prefix |
| ------------------------------- | --------------- | ------------------ | ---------- |
| `@trajectonomics/design-system` | `packages/core` | `release-core.yml` | `core-v`   |

- A caller triggers only on changes under its own package folder, so a change to one package never
  publishes another.
- `scripts/version.ts` reads the conventional-commit messages that touched the folder since the
  package's last stable tag (`core-vX.Y.Z`). The bump is `feat:` → minor, `!` / `BREAKING CHANGE` →
  major (minor while on 0.x), anything else → patch. Package `version` is never edited by hand.
- A push to `main` publishes an alpha (dist-tag `alpha`); a manual run from `main` publishes a stable
  version (dist-tag `latest`), creates the `<prefix>X.Y.Z` tag and the GitHub release.
- Workflow filenames are part of the Trusted Publisher contract (see ADR 0002). Do not rename them.

Before publishing, a dry run (Actions → **Release core** → Run workflow → enable `dry-run`) runs the
checks and prints the version the pipeline would publish without publishing or tagging. CI runs the
same dry run on every pull request.

Until `trajectonomics/cicd`'s shared multi-package pipeline replaces these workflows, this repo is a
documented special case. See ADR 0002.

## One-time setup

1. **Sign in to npm** on the machine you work from: `npm login --auth-type=web`. Open the printed
   URL within five minutes; on a headless machine run it as `BROWSER=none npm login --auth-type=web`.
   Verify with `npm whoami`.
2. Confirm you belong to the `@trajectonomics` npm org: `npm org ls trajectonomics <your-npm-user>`.
3. **Check the name is free**: `npm view @trajectonomics/design-system` should answer 404.
4. **First publish, locally.** npm cannot attach a trusted publisher to a package that does not exist
   yet, so the maintainer publishes the first version by hand. Ask the version script what the
   pipeline would publish, bump the working tree only (never commit it), publish under the `alpha`
   tag without provenance (it needs CI), approve the 2FA URL npm prints, then discard the bump:
   ```bash
   VERSION=$(bun scripts/version.ts --package-dir packages/core --tag-prefix core-v --channel alpha)
   cd packages/core
   npm version "$VERSION" --no-git-tag-version
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   ```
   Confirm with `npm view @trajectonomics/design-system dist-tags`.
5. **Switch to trusted publishing**: on npmjs.com open the package, then Settings, then Trusted
   Publisher, and choose GitHub Actions with repository `trajectonomics/design-system` and workflow
   `release-core.yml`. Then set the package's publishing access to require 2FA and disallow tokens.
6. **Check the release workflow**: it publishes with OIDC only. There is deliberately no token
   fallback or "skip publish step" guard: a missing or misnamed Trusted Publisher entry fails the
   release loudly instead of exiting green without publishing.
7. **Verify**: merge a small `fix:` PR that touches `packages/core` and confirm the new alpha appears
   with provenance.
8. **Cut the first stable release**: from `main`, run **Release core** with the desired bump. The
   workflow publishes under `latest` and creates the `core-vX.Y.Z` tag and GitHub release.
