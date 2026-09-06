# Documentation website maintenance

For npm publication, version tags, and GitHub Releases, see [Publishing a release](releasing.md).

Edit the documentation in `website/docs/` and its canonical examples in `website/examples/`.
Before pushing, check the examples and preview the production build:

```sh
npm run docs:typecheck
npm run docs:build
npm --workspace website run serve
```

Every push to `master` runs the **Documentation Pages** workflow and publishes the site at
<https://gastonmesseri.github.io/form-nodes/> after validation succeeds. Pull requests validate
and build without publishing. Check **Actions → Documentation Pages** for the deployment result;
use **Run workflow → master** to republish manually. No npm release is needed to update the website.

For the first deployment, select **GitHub Actions** under **Settings → Pages → Source** and
ensure the `github-pages` environment permits deployment from `master`. After deployment,
check a directly opened nested page and search. The hosting URL and base path
are configured in `website/docusaurus.config.ts`.

## Deferred playground

The playground page remains in `website/docs/playground.mdx` with `draft: true`, and its
implementation remains in `website/src/components/FormsPlayground.tsx`. It is excluded from
production builds while unfinished. To publish it later, remove the draft flag, restore its
sidebar, navbar, homepage, and README links, and run the documentation checks.
