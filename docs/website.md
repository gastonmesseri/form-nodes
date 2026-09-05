# Documentation website maintenance

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
check a directly opened nested page, search, and the playground. The hosting URL and base path
are configured in `website/docusaurus.config.ts`.
