# Angular Material integration tests

The Material browser regressions run as part of `npm run test:browser`. They use real Material
controls in Chromium, plus Firefox and WebKit through the isolated UI matrix, including DOM events and overlay options/calendar cells. They do not
replace Material controls with CVA stubs. The generic CVA lifecycle tests remain complementary.

## Coverage

| Control | Scenarios |
| --- | --- |
| `matInput` input and textarea | Initial values against Reactive Forms, edits, synchronous output snapshots, blur debounce, reset, null values, equal-valued rebinding, disabled state, and conditional destruction/recreation |
| `mat-checkbox` | Initial checked state against Reactive Forms, clicks, dirty/touched state, blur debounce, reset, null values, equal-valued rebinding, initial/inherited disabled state, and recreation |
| `mat-radio-group` | The original nested-CVA wizard regression, initial selection against Reactive Forms, clicks, resets, rebinding, blur debounce, disabled state, late/replaced options, and conditional views |
| `mat-select` | Initial selection against Reactive Forms, overlay option clicks, panel-close debounce commits, reset, null values, rebinding, disabled state, late options, object `compareWith`, and multiple selection |
| Native datepicker adapter | Initial formatting against Reactive Forms, typed dates, calendar clicks, output values, parse errors, reset of pending invalid text, disabled state, rebinding, and recreation |
| Moment datepicker adapter | Explicit strict date formats, typed Moment values, parse-error propagation to the form, ancestor reset, restored validity, and no programmatic user emissions |

The shared lifecycle test verifies that events go to the new node after rebinding and that
changing or resetting the previous node cannot overwrite the current control. Outputs assert
that their payload matches the node's committed or control value at the instant of delivery.

The shared controls also run with `equal: () => true`, with and without blur debounce. These
regressions verify that rendering follows the control value, committed snapshots stay current,
public reads can retain their cached value, event payloads honor their respective value views,
and both reset variants and programmatic writes restore the intended control display.

## Material rendering boundary

Material checkbox/radio native inputs can retain a click's checked state when a programmatic
reset occurs before that click is rendered. This was reproduced with both `[formNode]` and
`[formControl]` on the tested Material version. A dedicated test compares both integrations
at that boundary and verifies recovery after a rendered update/reset. The normal lifecycle
tests settle user interactions before performing the next separate application action.
These tests do not claim that every Material DOM property is updated synchronously.

## Versions and references

Browser fixtures currently use Angular 21.0.7 and Material/CDK/Moment adapter 21.0.6, pinned in
the development dependencies. This is regression coverage for that combination, not a claim
that every Angular/Material version, theme, date locale, or third-party adapter is certified.
Vite explicitly prebundles the Material entry points and Moment to avoid dependency discovery
reloading a running browser test and splitting DI token identities between module instances.

Behavioral reference inspected: Angular `22.1.x` at
`da8dac62a79025fa42ae3ee5c64e3e3f1979ce54`, Signal Forms `control_cva.ts` and
`test/web/interop.spec.ts`, including unconditional reset writes and debounce. Material's
`22.1.x` select and datepicker implementation/tests were also consulted; fixture behavior is
asserted against the pinned installed controls.

After `npm run test:browser` has prepared its fixtures, a focused rerun is:

```sh
npx vitest run --config vitest.browser.config.ts src/lib/form-node/material-*.browser.spec.ts
```

## Additional interaction and composition coverage

`material-infrastructure.browser.spec.ts` covers moved/removed array rows with pending edits
and open overlays, two different controls sharing a field, an OnPush date CVA backed by an
inner `FormControl`, and dialog injector ownership with submission/reset state.
`material-input-states.browser.spec.ts` covers partial and invalid date ranges, synthetic IME
composition buffering, and browser-driven textarea fill/clear with pending-value reset.

See [UI library testing](ui-library-testing.md#intermediate-values-and-infrastructure) for
browser commands and the distinction between WebKit testing and real Safari/iOS or OS input.
