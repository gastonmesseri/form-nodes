# Documentation website maintenance

For npm publication, version tags, and GitHub Releases, see [Publishing a release](releasing.md).

Follow the [website documentation authoring guide](WEBSITE_DOCS_GUIDE.md) for content,
examples, naming, formatting, and documentation verification conventions.

Edit the documentation in `website/docs/` and its canonical examples in `website/examples/`.
Before pushing, check the examples and preview the production build:

```sh
npm run docs:typecheck
npm run docs:build
npm --workspace website run serve
```

Every push to `master` runs the **Documentation Pages** workflow and publishes the site at
<https://form-nodes.js.org/> after validation succeeds. Pull requests validate
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

## Custom domain

The production domain is `form-nodes.js.org`, served from the root path `/`.
Set **Settings → Pages → Custom domain** to `form-nodes.js.org`; this project publishes
through GitHub Actions, so a `CNAME` file alone does not configure the domain.
The DNS record is maintained in [js-org/js.org](https://github.com/js-org/js.org),
with `form-nodes` pointing to `gastonmesseri.github.io/form-nodes` in `cnames_active.js`.
After the domain request is approved and DNS propagates, verify HTTPS, a directly opened
nested page, assets, and search. Enable **Enforce HTTPS** when the certificate is ready.

For an alternative deployment, set `DOCS_URL` and `DOCS_BASE_URL` together at build time.
The original GitHub Pages configuration uses `DOCS_URL=https://gastonmesseri.github.io`
and `DOCS_BASE_URL=/form-nodes/`.
