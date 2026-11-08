# Publishing the design system packages

Merges to `main` publish alphas; a stable release is the package's manual release workflow.
Never run `npm publish` locally (see AGENTS.md), except the one-time first publish below.

Each published package has its own caller of the reusable `.github/workflows/release-package.yml`:

| Package | Folder | Workflow | Tag prefix | Trusted Publisher workflow |
| --- | --- | --- | --- | --- |
| `@trajectonomics/design-system` | `packages/core` | `release-core.yml` | `core-v` | `release-core.yml` |
| `@trajectonomics/design-system-theme` | `packages/theme` | `release-theme.yml` | `theme-v` | `release-theme.yml` |
| `@trajectonomics/design-system-svelte` | `packages/svelte` | `release-svelte.yml` | `svelte-v` | `release-svelte.yml` |

- A caller triggers only on changes under its own package folder, so a change to one package never
  publishes another.
- `scripts/version.ts` reads the conventional-commit messages that touched the folder since the
  package's last stable tag (`core-vX.Y.Z`, `theme-vX.Y.Z`, `svelte-vX.Y.Z`). The bump is
  `feat:` → minor, `!` / `BREAKING CHANGE` → major (minor while on 0.x), anything else → patch.
  Package `version` is never edited by hand.
- A push to `main` publishes an alpha (dist-tag `alpha`); a manual run from `main` publishes a stable
  version (dist-tag `latest`), creates the `<prefix>X.Y.Z` tag and the GitHub release.
- Workflow filenames are part of the Trusted Publisher contract (see ADR 0002). Do not rename them.

Before publishing, a dry run (Actions → the package's **Release …** workflow → Run workflow → enable
`dry-run`) runs the checks and prints the version the pipeline would publish without publishing or
tagging. You can run the same plan locally:

```bash
bun scripts/version.ts --package-folder packages/core --tag-prefix core-v --channel alpha --dry-run
bun scripts/version.ts --package-folder packages/theme --tag-prefix theme-v --channel alpha --dry-run
bun scripts/version.ts --package-folder packages/svelte --tag-prefix svelte-v --channel alpha --dry-run
```

CI runs the core dry run on every pull request.

Until `trajectonomics/cicd`'s shared multi-package pipeline replaces these workflows, this repo is a
documented special case. See ADR 0002.

## One-time setup

1. **Sign in to npm** on the machine you work from: `npm login --auth-type=web`. Open the printed
   URL within five minutes; on a headless machine run it as `BROWSER=none npm login --auth-type=web`.
   Verify with `npm whoami`.
2. Confirm you belong to the `@trajectonomics` npm org: `npm org ls trajectonomics <your-npm-user>`.
3. **Check the names are free**. Each command should answer 404:
   ```bash
   npm view @trajectonomics/design-system
   npm view @trajectonomics/design-system-theme
   npm view @trajectonomics/design-system-svelte
   ```
4. **Build every package first**, so the published tarballs contain `dist`:
   ```bash
   bun run build
   ```
5. **First publish, in dependency order: core, then theme, then svelte.** npm cannot attach a
   Trusted Publisher to a package that does not exist yet, so the maintainer publishes the first
   version by hand. Ask the version script what the pipeline would publish, bump the working tree
   only (never commit it), publish under the `alpha` tag without provenance (it needs CI), approve
   the 2FA URL npm prints, then discard the bump.

   `core`:
   ```bash
   VERSION=$(bun scripts/version.ts --package-folder packages/core --tag-prefix core-v --channel alpha)
   cd packages/core
   npm version "$VERSION" --no-git-tag-version
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   cd ../..
   ```

   `theme`:
   ```bash
   VERSION=$(bun scripts/version.ts --package-folder packages/theme --tag-prefix theme-v --channel alpha)
   cd packages/theme
   npm version "$VERSION" --no-git-tag-version
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   cd ../..
   ```

   `svelte`:
   ```bash
   VERSION=$(bun scripts/version.ts --package-folder packages/svelte --tag-prefix svelte-v --channel alpha)
   cd packages/svelte
   npm version "$VERSION" --no-git-tag-version
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   cd ../..
   ```

   Confirm each package exists and its `alpha` tag points at the first version:
   ```bash
   npm view @trajectonomics/design-system dist-tags
   npm view @trajectonomics/design-system-theme dist-tags
   npm view @trajectonomics/design-system-svelte dist-tags
   ```
6. **Switch each package to trusted publishing.** On npmjs.com open the package, then Settings,
   then Trusted Publisher, and choose GitHub Actions with repository
   `trajectonomics/design-system` and the workflow filename from the table above. Repeat for all
   three packages. Then set each package's publishing access to require 2FA and disallow tokens.
7. **Check the release workflows**: they publish with OIDC only. There is deliberately no token
   fallback or "skip publish step" guard: a missing or misnamed Trusted Publisher entry fails the
   release loudly instead of exiting green without publishing.
8. **Verify** each workflow with a small `fix:` PR that touches that package's folder and confirm the
   new alpha appears with provenance. A change to one package must not release the other two.
9. **Cut the first stable release** of each package from `main` by running its **Release …** workflow
   with the desired bump. The workflow publishes under `latest` and creates the package's tag and
   GitHub release. Publish `core` first, then `theme`, then `svelte`, so the peer-dependency ranges
   resolve for consumers.
