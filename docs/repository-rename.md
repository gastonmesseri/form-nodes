# Repository rename to Form Nodes

The npm package and local folder are already named `form-nodes`. The remaining migration
renames the existing GitHub repository from `gastonmesseri/ng-forms` to
`gastonmesseri/form-nodes` and deploys documentation at the matching project-site URL.
Local links and Docusaurus configuration are prepared; the GitHub rename is not yet verified.

## 1. Rename the existing GitHub repository

Open the repository on GitHub, then **Settings → General → Repository name**. Enter
`form-nodes` and choose **Rename**. This requires repository administrator permissions.
Rename the existing repository to retain its history, issues, pull requests, and stars.

Verify the new repository URL while signed in:
`https://github.com/gastonmesseri/form-nodes`.
Also verify anonymous access before advertising public source and issue links on npm.
Renaming a private repository does not change its visibility.

GitHub redirects old repository URLs and Git operations, but not GitHub Pages project-site
URLs. Do not reuse the old repository name if those redirects should remain available.
See [GitHub's rename instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).

## 2. Update local clones after the GitHub rename

In this checkout, run:

```sh
git remote set-url origin git@github.com:gastonmesseri/form-nodes.git
git remote -v
git ls-remote origin HEAD
```

The local directory is already `/Users/gmeseri/ws/form-nodes`. The `master` branch and npm
package name do not need renaming. Repeat the remote update in other clones, if any.
Commit and push the prepared metadata and documentation changes after verifying the remote.

## 3. Deploy the documentation at its new path

Docusaurus now defaults to:

- `url`: `https://gastonmesseri.github.io`
- `baseUrl`: `/form-nodes/`
- `projectName`: `form-nodes`

Review external deployment settings for overrides of `DOCS_URL` and `DOCS_BASE_URL`.
The checked-in workflow currently tests Angular compatibility; it does not deploy Pages.
Configure the intended Pages deployment under **Settings → Pages** and deploy `website/build`
using the project's chosen deployment process.

```sh
npm run docs:typecheck
npm run docs:build
```

Verify the homepage, navigation, static assets, and a directly opened nested route such as
`https://gastonmesseri.github.io/form-nodes/reference/api-overview` after deployment.
GitHub does not automatically redirect the former `/ng-forms/` Pages path.

## 4. Verify npm metadata before publication

The source manifest now points to the new repository, README homepage, and issue tracker.
The package name remains `form-nodes` and the prepared version remains `1.0.0`.
Once the documentation is live, its URL can replace the repository README in `homepage`.

```sh
npm run test:package
npm pack ./dist --dry-run
```

Publish the newly built `dist` package or its archive. An archive generated before the rename
still contains the old links, so rebuild and repack before publishing.

Review the GitHub repository's About description, website URL, and topics, plus any external
badges, integrations, deployment settings, and npm trusted-publisher configuration that may
reference the old repository name. These account settings are not stored in this checkout.
