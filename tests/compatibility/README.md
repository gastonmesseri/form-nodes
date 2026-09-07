# Angular package compatibility consumers

These consumers install a real Form Nodes tarball into temporary directories. Each Angular version
has its own exact dependency versions and committed npm lockfile. They do not link the repository's
Angular packages or resolve Form Nodes through source paths.

| Consumer | Angular | TypeScript | Policy |
| --- | --- | --- | --- |
| `angular-22` | 22.1.5 | 6.0.3 | Required |
| `angular-21` | 21.2.22 | 5.9.3 | Required |

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

Both consumers install with strict peer checks. A failure in either consumer fails the CI workflow.
The library is built once using Angular 21.2.22 and TypeScript 5.9.3; that identical tarball is then
checked with both Angular versions. Node.js 22.22.3 is the development baseline (`.nvmrc`).

## CI and release verification

`.github/workflows/angular-compatibility.yml` uploads the shared archive and checks both consumers.
This supplements the full type, runtime coverage, browser, production AOT, SSR/hydration, and
executable-documentation checks. The Node runtime smoke tests load Angular's JIT compiler for
partially compiled package code; strict Angular template checking runs separately with `ngc` and
`noEmit`. They do not replace production linking or browser tests.

The former `$field` adapter has been removed. Bind Form Nodes through `[formNode]`.
`useControlState()` continues to observe independently created Angular Signal Forms controls.

To refresh a consumer lockfile after deliberately updating its pinned dependencies:

```bash
npm install --prefix tests/compatibility/angular-21 --package-lock-only --ignore-scripts --workspaces=false
npm install --prefix tests/compatibility/angular-22 --package-lock-only --ignore-scripts --workspaces=false
```

Review the dependency changes and rerun both consumers before committing the locks.
