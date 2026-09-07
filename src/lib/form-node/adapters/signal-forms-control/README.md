# Signal Forms control adapter

This folder connects `[formNode]` to components compatible with Angular's **FormValueControl**
(`value = model(...)`) and **FormCheckboxControl** (`checked = model(...)`) contracts. Detection
requires a declared signal input and matching change output pointing to the same model property,
plus public callable/set/subscribe operations. Aliases are resolved through metadata; internal
signals are not selected. An explicit implements declaration is not required.
See Angular's [custom controls guide](https://angular.dev/guide/forms/signals/custom-controls).

`model-transport.ts` connects models through public operations. Model value, node reference,
touch, focus, and reset connections work without experimental options.

`paired-transport.ts` handles separate value/valueChange and checked/checkedChange pairs.
`bindInputOutputPairs` gates their complete connection: values, interaction hooks, node reference, and
any optional input writes. False/null leaves pairs recognized but inactive. Rebinding can pause
and resume the connection; existing component input values remain unchanged while inactive.

`syncInputs` independently selects additional state/constraint writes through the shared
[`sync-control-inputs.ts`](../sync-control-inputs.ts). It never enables values. Signal-controls
selects all inputs on model controls; `{ inputs, target }` can restrict a selection. Active pairs
match only target all. Both experimental features use [`ng-internals`](../../ng-internals/).

CVA and native controls have separate adapters. CVA takes precedence even on a component with a
model, so it matches target cva rather than signal-controls.
