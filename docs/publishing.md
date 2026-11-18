# Publishing the design system packages

Merges to `main` publish alphas; a stable release is the package's manual release workflow.
Never run `npm publish` locally (see AGENTS.md), except the one-time first publish below.

Each published package has its own caller of the reusable `.github/workflows/release-package.yml`:

| Package | Folder | Workflow | Tag prefix | Trusted Publisher workflow |
| --- | --- | --- | --- | --- |
| `@trajectonomics/design-system` | `packages/core` | `release-core.yml` | `core-v` | `release-core.yml` |
| `@trajectonomics/design-system-theme` | `packages/theme` | `release-theme.yml` | `theme-v` | `release-theme.yml` |
| `@trajectonomics/design-system-svelte` | `packages/svelte` | `release-svelte.yml` | `svelte-v` | `release-svelte.yml` |
| `@trajectonomics/design-system-assets` | `packages/assets` | `release-assets.yml` | `assets-v` | `release-assets.yml` |

- A caller triggers only on changes under its own package folder, so a change to one package never
  publishes another.
- The assets package ships art copied from `brand-source/`, so its caller also triggers on
  `brand-source/**` and passes `extra-paths: brand-source`, which `scripts/version.ts` takes as
  `--extra-path`. A commit that only changes the art therefore publishes a new version.
- `scripts/version.ts` reads the conventional-commit messages that touched the folder since the
  package's last stable tag (`core-vX.Y.Z`, `theme-vX.Y.Z`, `svelte-vX.Y.Z`). The bump is
  `feat:` → minor, `!` / `BREAKING CHANGE` → major (minor while on 0.x), anything else → patch.
  Package `version` is never edited by hand.
- A push to `main` publishes an alpha (dist-tag `alpha`); a manual run from `main` publishes a stable
  version (dist-tag `latest`), creates the `<prefix>X.Y.Z` tag and the GitHub release.
- npm creates the `latest` dist-tag on a package's first publish, whatever `--tag` the publish
  passes, and only a stable release moves it. So all four packages carry `latest` today, at the
  hand-run first publish `0.1.0-alpha.0`, while their `alpha` tags are far ahead: `core`
  `0.1.0-alpha.4`, `theme` `0.1.0-alpha.5`, `svelte` `0.1.0-alpha.2` and `assets` `0.1.0-alpha.5`.
  That is why the READMEs install `@alpha`: a bare package name resolves `latest`, which still ships
  the first alpha. The first stable release moves `latest` to the stable version, and a bare name
  becomes the install line the documentation wants.
- Workflow filenames are part of the Trusted Publisher contract (see ADR 0002). Do not rename them.

Before publishing, a dry run (Actions → the package's **Release …** workflow → Run workflow → enable
`dry-run`) runs the checks, applies the version it would publish to the checkout, asserts the packed
manifest carries no `workspace:` range in `dependencies` or `peerDependencies`, and prints the
tarball's file list, all without publishing or tagging. You can run the same plan locally:

```bash
bun scripts/version.ts --package-folder packages/core --tag-prefix core-v --channel alpha --dry-run
bun scripts/version.ts --package-folder packages/theme --tag-prefix theme-v --channel alpha --dry-run
bun scripts/version.ts --package-folder packages/svelte --tag-prefix svelte-v --channel alpha --dry-run
bun scripts/version.ts --package-folder packages/assets --tag-prefix assets-v --channel alpha --dry-run
```

CI runs every package's dry run on every pull request.

Until `trajectonomics/cicd`'s shared multi-package pipeline replaces these workflows, this repo is a
documented special case. See ADR 0002.

## One-time setup

The first publish is done for all four packages: every name exists on npm, and every package has
published alphas from its release workflow since its hand-run first alpha. Steps 1 to 5 stay here as
the record of how a new package starts. Steps 6 to 9 are still live: the Trusted Publisher entries
and the first stable release are the parts the owner still runs. The first publish of `assets` is
done too, so `trajectonomics/infra#26` no longer gates anything.

1. **Sign in to npm** on the machine you work from: `npm login --auth-type=web`. Open the printed
   URL within five minutes; on a headless machine run it as `BROWSER=none npm login --auth-type=web`.
   Verify with `npm whoami`.
2. Confirm you belong to the `@trajectonomics` npm org: `npm org ls trajectonomics <your-npm-user>`.
3. **Check which names exist.** Done: all four packages exist on npm, so no name needs a first
   publish. A new package starts with the same check and must answer 404 before its first publish;
   these were the three that needed it:
   ```bash
   npm view @trajectonomics/design-system-theme
   npm view @trajectonomics/design-system-svelte
   npm view @trajectonomics/design-system-assets
   ```
4. **Build every package first**, so the published tarballs contain `dist`:
   ```bash
   bun run build
   ```
5. **First publish.** Done: `core` published `0.1.0-alpha.0` by hand, then `theme`, `svelte` and
   `assets` published their first alpha the same way, and each has released from its workflow since.
   npm cannot attach a Trusted Publisher to a package that does not exist yet, so a new package
   still follows the hand publish. `npm pkg set` is used instead of `npm version` because
   `npm version` fails on the `workspace:*` devDependencies. Ask the version script what the
   pipeline would publish, bump the working tree only (never commit it), publish under the `alpha`
   tag without provenance (it needs CI), approve the 2FA URL npm prints, then discard the bump:

   ```bash
   VERSION=$(bun scripts/version.ts --package-folder packages/<folder> --tag-prefix <prefix> --channel alpha)
   cd packages/<folder>
   npm pkg set version="$VERSION"
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   cd ../..
   ```

   Confirm the package exists and its `alpha` tag points at the first version:
   ```bash
   npm view @trajectonomics/<package> dist-tags
   ```
6. **Switch each package to trusted publishing.** On npmjs.com open the package, then Settings,
   then Trusted Publisher, and choose GitHub Actions with repository
   `trajectonomics/design-system` and the workflow filename from the table above. Repeat for all
   four published packages. Then set each package's publishing access to require 2FA and disallow tokens.
7. **Check the release workflows**: they publish with OIDC only. There is deliberately no token
   fallback or "skip publish step" guard: a missing or misnamed Trusted Publisher entry fails the
   release loudly instead of exiting green without publishing.
8. **Verify** each workflow with a small `fix:` PR that touches that package's folder and confirm the
   new alpha appears with provenance. A change to one package must not release the others.
9. **Cut the first stable release** of each package from `main` by running its **Release …** workflow
   with the desired bump. The workflow publishes under `latest` and creates the package's tag and
   GitHub release. Publish `core` first, then `theme`, then `svelte`, so the peer-dependency ranges
   resolve for consumers; `assets` has no peers, so it can go at any point.
