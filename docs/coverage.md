# Coverage reporting

The `Test coverage` workflow in `.github/workflows/coverage.yml` runs the existing coverage suite
on pull requests, pushes to `master`, and manual dispatches. It preserves the suite's existing
source exclusions and enforced coverage thresholds.

To reproduce its report locally:

```sh
npm run test:coverage -- --coverage.reporter=text --coverage.reporter=lcov
```

The report is written to `coverage/lcov.info`. GitHub Actions preserves it as the `coverage-lcov`
artifact and uploads successful `master` runs to [Coveralls](https://coveralls.io/github/gastonmesseri/form-nodes?branch=master).
Pull requests run the coverage checks and preserve their report without uploading it. This keeps
the README badge tied to the default branch and avoids PR comments from the service.

The [official Coveralls action](https://github.com/coverallsapp/github-action) uses GitHub's
automatic `GITHUB_TOKEN`; no personal token or npm dependency is required. According to its
setup instructions, Coveralls creates the repository on the first upload. An organization policy
may still restrict third-party actions or service access; inspect the upload step if it fails.

After pushing this workflow to `master`, verify that its tests and upload step succeed, the
Coveralls report points to the expected commit, and the README badge displays the reported line
coverage. Until the first successful upload, the badge may display unknown coverage. The badge
is a service-generated measurement, not a fixed percentage maintained in the README.

The report covers the library files selected by `test:coverage`. Browser-only suites are separate
checks and are not merged into this report. The badge's line coverage does not represent branch
coverage; the workflow still enforces both metrics independently.
