# UI library integration testing

The browser suite exercises real controls from five popular UI libraries with `[formNode]`.
The dependencies are development-only and pinned. They are not bundled into Form Nodes or
required from consumers. This is a regression matrix, not certification of every control,
version, theme, browser, mobile platform, or application combination.

## Selection

GitHub repository stars were checked through the GitHub API on September 10, 2026. The five
highest counts in the reviewed shortlist determined this first matrix:

| Suite | Repository stars | Tested package |
| --- | ---: | --- |
| [Ionic](https://github.com/ionic-team/ionic-framework) | 52,655 | `@ionic/angular@9.0.3` |
| [Angular Material](https://github.com/angular/components) | 25,047 | `@angular/material@21.0.6` |
| [PrimeNG](https://github.com/primefaces/primeng) | 12,491 | `primeng@21.1.10` |
| [NG-ZORRO](https://github.com/NG-ZORRO/ng-zorro-antd) | 9,169 | `ng-zorro-antd@21.3.3` |
| [ng-bootstrap](https://github.com/ng-bootstrap/ng-bootstrap) | 8,228 | `@ng-bootstrap/ng-bootstrap@20.0.0` |

Other reviewed candidates: Nebular (8,121), ngx-bootstrap (5,515), Taiga UI (4,053),
Spartan (2,890), and ng-clarity (429). These are repository snapshots, not an exhaustive
Angular ecosystem ranking. Stars do not measure Angular installations or compatibility.
Ionic's repository includes React and Vue integrations, Material's includes CDK, and a
project split across repositories can be underrepresented.

Angular is pinned to 21.0.7 in these fixtures. ng-bootstrap 20 is the compatible Angular 21
line; its newer 21 line requires Angular 22. Upgrade the matrix deliberately and rerun the
full browser suite when changing these versions.

## Coverage

| Suite | Real controls | Scenarios |
| --- | --- | --- |
| Material | Inputs, textarea, checkbox, radio, select, native/Moment datepickers | See the detailed [Material matrix](material-testing.md) |
| PrimeNG | Checkbox (binary), ToggleSwitch | Initial values compared with Reactive Forms, edits, output snapshots, parent reset, same-value reset, equal-value rebinding, detached-node isolation, recreation, initial/inherited disabled state, blur debounce and cancellation |
| NG-ZORRO | Checkbox, Switch | The same lifecycle and interaction matrix |
| ng-bootstrap | Rating, Timepicker | The same lifecycle and interaction matrix; rating commits blur-debounced input during selection because it calls `onTouched` then |
| Ionic | Input, Checkbox | The same matrix through real custom elements, native input/click events, and their Angular CVAs |
| PrimeNG and NG-ZORRO | Select | Late/replaced options, initial selection compared with Reactive Forms, programmatic updates, real overlay option selection, output freshness, parent reset and dirty state |

`ui-libraries.browser.spec.ts` asserts committed/control values *inside* output handlers,
not only after change detection. Programmatic updates and resets must not emit user changes.
Equality regressions deliberately use `equal: () => true` on the bound field across all eight
shared controls, with and without blur debounce. They seed the public read first, then assert
that real rendered values and raw committed parent snapshots still update while the public
field/parent values remain cached. They distinguish immediate and public-value event payloads,
and cover programmatic writes, same-value reset, and reset to the declared initial value.
Material has the same matrix across its six shared control kinds. This comparator is a test
stress case, not a recommended application configuration.

Pending-input reset checks exclude rating because its selection itself reports touched and
therefore commits pending input; a separate parameterized test asserts that behavior.

The tests use actual DOM interactions rather than calling CVA callbacks directly. Ionic
custom-element rendering and CDK virtual scrolling use animation-frame scheduling, so tests
wait for rendering before checking DOM. Themes and visual appearance are outside this matrix.

## Regression found by this matrix

ng-bootstrap rating and timepicker assign disabled state without requesting a view check.
The Form Nodes adapter now requests one after model and disabled-state writes. Without that
refresh, the enable/disable tests fail with `ExpressionChangedAfterItHasBeenCheckedError`.
The tests exercise Angular's development-mode checks and do not suppress that error.

## Behavioral references

Angular `22.1.x` at `da8dac62a79025fa42ae3ee5c64e3e3f1979ce54`:

- `packages/forms/signals/src/directive/control_cva.ts`: view synchronization, avoiding CVA
  loopback, disabled writes, and unconditional reset writes.
- `packages/forms/signals/test/web/interop.spec.ts`: debounce, touched/dirty, disabled and reset.
- `packages/forms/src/directives/shared.ts`: Reactive Forms initial value/disabled writes and
  callback registration order, used by the comparison fixtures.

The installed implementations were also inspected: PrimeNG Checkbox/Select, NG-ZORRO
Checkbox/Switch/Select, ng-bootstrap Rating/Timepicker, and Ionic Input/Checkbox/ValueAccessor.
In particular, rating's `update()` calls both change and touched, and Ionic Input forwards
`ionInput` through its accessor. The tests preserve these control-specific contracts.

## Running

```sh
npm run test:browser
```

After that command prepares the shared browser fixtures, focused reruns are:

```sh
npx vitest run --config vitest.browser.config.ts src/lib/form-node/ui-libraries.browser.spec.ts src/lib/form-node/ui-selects.browser.spec.ts
```

The browser Vite configuration prebundles all imported UI entry points to avoid dependency
rediscovery reloading tests and creating mismatched Angular DI token identities.
