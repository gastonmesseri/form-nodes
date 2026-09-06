# Publishing a release

Maintainer procedure for publishing `@ngblocks/form-nodes` to npm and GitHub. Run commands
from the repository root, in the same terminal session. Publish the compiled package in `dist/`.
The first public release, `1.0.0`, was published on 2026-09-07; future releases need a new version.

## 1. Prepare the version and changelogs

Start on `master` with the intended changes committed and a clean working tree:

```sh
git switch master
git pull --ff-only origin master
git status --short
npm view @ngblocks/form-nodes versions --json --registry=https://registry.npmjs.org/
```

Choose a version using the [version policy](../website/docs/project/versioning.md): patch for
compatible fixes, minor for compatible features, and major for incompatible changes. The version
is independent of Angular's version. For example, to prepare a patch after `1.0.0`:

```sh
RELEASE_VERSION=1.0.1
npm version "$RELEASE_VERSION" --no-git-tag-version
```

Set `RELEASE_VERSION` to the actual target before continuing. This updates the root `package.json`
and `package-lock.json` without creating a commit or tag. Keep the private website workspace's
version unchanged. See [npm version](https://docs.npmjs.com/cli/v11/commands/npm-version/).

Move the changes shipping in this release from `Unreleased` into a dated release section in both
`CHANGELOG.md` and `website/docs/project/changelog.md`. Keep an `Unreleased` section for later work
and preserve previously published release entries. Update the root changelog's release and
comparison links. Document incompatible changes in `website/docs/project/migrations.md`.

For the first publication only, an already configured, unpublished initial version needs no bump.
That exception no longer applies to the published `1.0.0`.

## 2. Verify and commit the release

Use the Node.js version in `.nvmrc`, install dependencies with `npm ci`, then run:

```sh
npm run typecheck
npm run test:coverage
npm run test:package
npm run test:browser
npm run docs:typecheck
npm run docs:build
```

`typecheck` includes lint, public type tests, and template checks. `test:package` builds the
package and checks its contents, consumer imports, Angular templates, runtime behavior, and tree
shaking. Browser tests also build the package. If Chromium is missing, run
`npx playwright install chromium` first. Verify nonzero test counts and resolve failures.

If the README example synchronization check fails, reconcile the README with the canonical file
named in its `<!-- example: ... -->` marker. After editing the canonical example, run
`node website/scripts/sync-readme-examples.mjs --write` and repeat the documentation checks.

Review and stage the release files explicitly, including any additional documentation changes:

```sh
git diff --check
git diff
git add package.json package-lock.json CHANGELOG.md website/docs/project/changelog.md
git diff --cached
git commit -m "chore: prepare $RELEASE_VERSION release"
git status --short
RELEASE_COMMIT=$(git rev-parse HEAD)
git push origin master
```

Require a clean working tree and successful GitHub Actions checks, including the Angular
compatibility matrix and Documentation Pages, before publishing. See
[compatibility checks](../tests/compatibility/README.md) and [website maintenance](website.md).

## 3. Authenticate with npm

Your npm account must have publishing permission under the `@ngblocks` scope. For interactive
publishing, enable 2FA in npm's account settings and complete the browser authentication:

```sh
npm login --auth-type=web --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

Follow npm's [2FA setup instructions](https://docs.npmjs.com/configuring-two-factor-authentication/).
Keep credentials and recovery codes outside the repository.

## 4. Preview the exact package

Rebuild from the release commit, especially after version or changelog edits:

```sh
npm run test:package
npm publish ./dist --access public --dry-run
```

Check the package name, version, public access, `latest` tag, file list, and reported checksum.
Expected contents include `package.json`, README, license, changelog, the
`fesm2022/ngblocks-form-nodes.mjs` bundle, public declarations in
`types/ngblocks-form-nodes.d.ts`, and their maps. Manual tests and website source are not shipped.

A successful dry run does not guarantee authorization for the real registry write. Do not edit
release files between this preview and publication; if edits are needed, commit and verify them,
refresh `RELEASE_COMMIT`, push, and rebuild before continuing.

## 5. Publish and verify npm

This command publishes the stable release publicly:

```sh
npm publish ./dist --access public
npm view "@ngblocks/form-nodes@$RELEASE_VERSION" name version dist.shasum --json --registry=https://registry.npmjs.org/
npm view @ngblocks/form-nodes dist-tags --json --registry=https://registry.npmjs.org/
```

Complete the requested 2FA verification. Confirm the version and checksum match the preview and
that `latest` points to this stable release. Check the
[npm package page](https://www.npmjs.com/package/@ngblocks/form-nodes) and its documentation link.
Optionally install the exact version into a separate Angular application for a final smoke test.

Publish `./dist`, not the repository root. npm cannot replace a name/version combination that has
already been published, even after unpublishing it. See
[npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/).

## 6. Tag the published commit

Use the recorded commit that produced the package, even if `master` has moved since publication:

```sh
git tag --list "v$RELEASE_VERSION"
git ls-remote origin "refs/tags/v$RELEASE_VERSION"
```

If the tag does not exist locally or remotely, create and push it:

```sh
git tag -a "v$RELEASE_VERSION" "$RELEASE_COMMIT" -m "Release @ngblocks/form-nodes v$RELEASE_VERSION"
git push origin "refs/tags/v$RELEASE_VERSION"
git ls-remote origin "refs/tags/v$RELEASE_VERSION" "refs/tags/v$RELEASE_VERSION^{}"
```

If a tag already exists, verify that it identifies the published commit; do not force-replace it.
If the terminal session was lost, recover the exact release commit from Git history rather than
assuming the current `HEAD` produced the published package.

## 7. Create the GitHub Release

Open [New release](https://github.com/gastonmesseri/form-nodes/releases/new), select the existing
version tag, and use a title such as `Form Nodes v1.0.1`. Summarize that version's changelog and
include installation instructions plus links to npm, the documentation, and the changelog at
the release tag. Leave **Pre-release** unchecked for a stable version, then publish the release.

GitHub CLI is optional. If installed and authenticated, the equivalent is:

```sh
gh release create "v$RELEASE_VERSION" --repo gastonmesseri/form-nodes --verify-tag --title "Form Nodes v$RELEASE_VERSION" --notes-file /tmp/form-nodes-release-notes.md
```

Write and review the notes file before running that command. Finally verify the GitHub Release is
public, its tag is correct, npm serves the expected version, and the
[documentation site](https://gastonmesseri.github.io/form-nodes/) is reachable.

## Troubleshooting

- **403 requiring 2FA:** enable account 2FA, renew the session with `npm login --auth-type=web`, and
  retry. If it persists, check whether an environment variable or `.npmrc` supplies a different
  token. npm also supports granular publishing tokens with bypass 2FA enabled; see its
  [authentication requirements](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/).
- **403 for scope access:** confirm the logged-in account has permission to publish in `@ngblocks`.
- **Version already exists:** inspect the registry first. If the intended artifact is already
  published, finish tagging and release notes. If a different artifact needs publishing, prepare
  a new version; do not try to overwrite the existing release.
- **Uncertain outcome after a network failure:** query the exact version and checksum before
  retrying. A successful upload may have completed even when the client lost its connection.
- **A rejected authentication attempt:** if the exact version is still unpublished, retry it after
  fixing authentication; that failure alone does not require increasing the version.
- **Tag or GitHub Release creation fails after npm succeeds:** resume the missing GitHub steps.
  The npm package is already published; do not republish or bump merely to create release notes.
- **Website-only updates:** follow [website maintenance](website.md); no npm release is required.
