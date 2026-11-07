# Publishing @trajectonomics/design-system

Merges to `main` publish alphas; a stable release is the manual **Release** workflow.
Never run `npm publish` locally (see AGENTS.md).

> **Paused while the repo is a workspace.** #13 removed the root release workflow, because the root
package is no longer published. Per-package pipelines are #14; until they land, nothing publishes
automatically. Treat the steps below as the setup to restore then: the package to publish lives in
`packages/core`, and its workflow is `release-core.yml` (per ADR 0002, the filename is part of the
Trusted Publisher contract).

## One-time setup

1. **Sign in to npm** on the machine you work from: `npm login --auth-type=web`. Open the printed
   URL within five minutes; on a headless machine run it as `BROWSER=none npm login --auth-type=web`.
   Verify with `npm whoami`.
2. Confirm you belong to the `@trajectonomics` npm org: `npm org ls trajectonomics <your-npm-user>`.
3. **Check the name is free**: `npm view @trajectonomics/design-system` should answer 404.
4. **First publish, locally.** npm cannot attach a trusted publisher to a package that does not exist
   yet, so the maintainer publishes the first version by hand. Bump the version in the working tree
   only (never commit it), publish under the `alpha` tag without provenance (it needs CI), approve the
   2FA URL npm prints, then discard the bump:
   ```bash
   cd packages/core
   npm version 0.1.0-alpha.0 --no-git-tag-version
   npm publish --access public --tag alpha --provenance=false
   git checkout package.json
   ```
   Confirm with `npm view @trajectonomics/design-system dist-tags`.
5. **Switch to trusted publishing**: on npmjs.com open the package, then Settings, then Trusted
   Publisher, and choose GitHub Actions with repository `trajectonomics/design-system` and workflow `release-core.yml`.
   Then set the package's publishing access to require 2FA and disallow tokens.
6. **Check the release workflow**: it must publish with a token *or* OIDC. A copy that still has the "Skipping
   publish step" guard exits green without publishing when `NPM_TOKEN` is missing, which is exactly
   the situation after step 5.
7. **Verify**: merge a small `fix:` PR and confirm the new alpha appears with provenance.
