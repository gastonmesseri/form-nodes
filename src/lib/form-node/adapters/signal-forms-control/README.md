# Signal Forms control adapter

This folder connects `[formNode]` to custom components compatible with Angular Signal Forms'
**`FormValueControl`** (`value = model(...)`) and **`FormCheckboxControl`** (`checked = model(...)`) contracts.
See Angular's [custom controls guide](https://angular.dev/guide/forms/signals/custom-controls).

Controls are discovered by their inputs and outputs; an explicit `implements` declaration is
not required. `model-transport.ts` connects values through public model operations.

This adapter also supports paired `value`/`valueChange` or `checked`/`checkedChange` inputs and
outputs through `paired-transport.ts`. That compatibility requires experimental `syncInputs`
to be enabled. Optional state and constraint input writes use the shared
[`sync-control-inputs.ts`](../sync-control-inputs.ts) and are also gated by `syncInputs`.
Model value connections remain available with `syncInputs: false`.

ControlValueAccessor and native DOM controls have separate adapters in
[`control-value-accessor/`](../control-value-accessor/) and [`native-control/`](../native-control/).
