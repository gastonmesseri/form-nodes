# Angular package compatibility consumers

These consumers install a real Form Nodes tarball into temporary directories. Each Angular version
has its own exact dependency versions and committed npm lockfile. They do not link the repository's
Angular packages or resolve Form Nodes through source paths.

| Consumer | Angular | TypeScript | Policy |
| --- | --- | --- | --- |
| `angular-22` | 22.1.5 | 6.0.3 | Required |
| `angular-21` | 21.2.22 | 5.9.3 | Experimental; expected to fail while the current Signal Forms integration remains incompatible |

Use Node.js 22.22.3 for the same environment as CI. The versions above are selected test points,
not proof of compatibility with every earlier minor or patch in either major.

## Run locally

Build the current package, then run either consumer:

```bash
npm run build
npm run test:compatibility -- 22
npm run test:compatibility -- 21
```

Without a tarball argument, the command packs `dist/`. Rebuild after source changes so the checks
use the intended implementation. To compare the exact same archive locally, pack it once:

```bash
mkdir -p /tmp/form-nodes-compatibility-artifacts
npm pack ./dist --pack-destination /tmp/form-nodes-compatibility-artifacts --ignore-scripts
npm run test:compatibility -- 22 /tmp/form-nodes-compatibility-artifacts/form-nodes-0.1.0.tgz
npm run test:compatibility -- 21 /tmp/form-nodes-compatibility-artifacts/form-nodes-0.1.0.tgz
```

Use the actual filename printed by `npm pack` if the package version changes. A consumer run:

1. Creates a temporary directory and copies that consumer's manifest and lockfile.
2. Uses `npm ci` to install its locked toolchain, then installs the supplied tarball without
   rewriting the lockfile. Install scripts are disabled.
3. Checks that all direct toolchain dependencies still have their pinned versions.
4. Runs the consumer's Angular compiler against `tests/integration/package-consumer.ts`, with strict
   public declaration and template checks, no source path mapping, and `skipLibCheck: false`.
5. Runs three Node test-runner smoke tests from `runtime.mjs`, covering field validation/reset,
   form aggregation, and independent array-template children outside dependency injection.
6. Removes the temporary directory. Compiler/runtime failures produce a nonzero exit; both are
   attempted so logs expose separate declaration and runtime blockers.

Angular 22 installs with strict peer checks. The Angular 21 diagnostic intentionally uses
`--legacy-peer-deps` only inside its temporary directory, because the current package declares
Angular 22 peers. This makes underlying compiler/runtime failures observable instead of stopping
at npm's peer conflict. It is not a supported application installation method. This probe can never
prove peer compatibility until that bypass is removed.

## CI and promotion to supported status

`.github/workflows/angular-compatibility.yml` builds one package with the current Angular 22
repository toolchain, uploads its tarball, and passes the identical artifact to both jobs.
Angular 22 failures fail the workflow. The Angular 21 check uses `continue-on-error`; its actual
outcome is written to the workflow summary, including failures. It is not an expected-failure
assertion and will report success if the probe begins passing.

This workflow is compatibility infrastructure, not the full release test suite. It does not run
browser interaction, production linking, hydration, the complete behavioral suite, or inference
performance tests. The Node runtime loads Angular's JIT compiler for partially compiled package
code; strict Angular template checking runs separately with `ngc` and `noEmit`.

Before promoting Angular 21:

- Resolve the blockers in `docs/angular-21-compatibility.md`. `$field` is retained by this change.
- Build the distributed artifact with the oldest supported Angular compiler and TypeScript 5.9.
- Verify the claimed minimum Angular versions, supported Node versions, and both majors' complete
  release checks, including real applications consuming the linked package in production.
- Update peer ranges, use strict peer installation in both consumers, and remove the experimental
  workflow policy together. Keep lockfiles aligned with the selected version matrix.

To refresh a consumer lockfile after deliberately updating its pinned dependencies:

```bash
npm install --prefix tests/compatibility/angular-21 --package-lock-only --ignore-scripts --workspaces=false
npm install --prefix tests/compatibility/angular-22 --package-lock-only --ignore-scripts --workspaces=false
```

Review the dependency changes and rerun both consumers before committing the locks.
