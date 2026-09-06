# Build size audit

Run `npm ci` after cloning, then:

```sh
npm run test:size
```

The command builds the publishable library into `dist/`, compiles four standalone Angular applications with AOT, links partial Angular declarations, and bundles each application with esbuild. All scenarios use the installed Angular version, ES2022, minification, tree shaking, and disabled Angular development and JIT modes. Angular and RxJS dependencies are bundled, not externalized.

| Scenario | Included features |
| --- | --- |
| `baseline` | Angular bootstrap and a rendered string, without Form Nodes |
| `model` | `form()` and `field()`, with a rendered field value |
| `binding` | The model plus a native input bound with `[formNode]` |
| `validators-array` | Native bindings, `required`, a dynamic object array, and rendered validity |

The audit fails on compilation or bundling errors, missing library code in a consumer scenario, unexpected library code in the baseline, retained JIT compiler code, or unlinked Angular declarations. It reports sizes without imposing a regression budget yet.

## Reports

Generated artifacts live in `node_modules/.cache/form-nodes/build-size/` and are replaced on each run:

- `report.md`: readable totals and differences against the baseline.
- `report.json`: the same measurements in bytes, with tool versions.
- `<scenario>/main.js`: the minified application bundle.
- `<scenario>/meta.json`: esbuild metadata for inspecting retained imports and module contributions.
- `<scenario>/retained-modules.json`: modules sorted by their uncompressed contribution to the output.

Raw sizes measure JavaScript bytes. Gzip uses level 9; Brotli uses quality 11. Compressed differences compare two complete compressed applications, so they include compression interactions with Angular and the application code. They are not independently compressed library sizes. Scenario differences also include each example's additional template and application code.

This controlled AOT/linker/esbuild benchmark does not reproduce every Angular CLI optimization. Measure a real consuming application's production build as well before making claims about its download size. Source maps, declaration files, documentation, HTML, and CSS are excluded. The npm archive size measures package distribution and is not a browser download estimate.

The library is published as a flattened ES module, so esbuild attributes retained library code to that module rather than individual original source files. The metadata identifies retained modules, not per-function or per-validator sizes.

## Comparing changes

Run the audit before and after a change, saving `report.json` outside the generated directory between runs. Keep the Node version, lockfile, fixture code, and build options the same. Review both absolute totals and baseline differences; Angular or tooling updates can change either. Establish reviewed budgets from representative results before turning these measurements into CI thresholds.

The Babel linker uses the Babel dependency owned by `@angular/compiler-cli` so its version follows the installed Angular compiler. No additional tool installation or registry request is needed during the audit after dependencies are installed.
