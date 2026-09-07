# Optional Angular input internals

**The library is fully usable without this optional input-writing integration.** Native controls,
standard ControlValueAccessor connections, actual value/checked models, validation, submission,
and node state operations remain available with both experimental options disabled.

This directory isolates writes to existing component inputs that rely on Angular's private
component definition or input-signal node. There are two independent opt-ins:

- `syncInputs`: copies selected state and constraint inputs from the node to an active custom
  control. Defaults to false. Presets are declared, all, and signal-controls; lists select exact
  inputs, and `{ inputs, target }` separates selection from adapter filtering. Declared excludes
  validators. Empty lists write nothing and never enable values.
- `bindInputOutputPairs`: enables separate value/valueChange or checked/checkedChange input/output pairs.
  Defaults to false. Controls value and state writes, change/touch processing, optional focus/reset
  hooks, and the writable node reference. SyncInputs separately selects an active pair's state inputs.

Both options exist on nodes, factory defaults, providers, and global configuration and inherit
independently. Null/false disables an option. Ordinary CVA methods and model operations do not use
these input writers. A component implementing FormValueControl or FormCheckboxControl can combine
its model with useFormNodeState() to render state without populating component input properties.
Node operations such as markAsTouched() continue working regardless of input synchronization.

Supported optional input names are disabled, disabledReasons, readonly, hidden, dirty, touched,
invalid, pending, errors, name, required, min, max, minLength, maxLength, and pattern. Selecting these
may overwrite authored input values. Targets filter the selected adapter: a model-bearing CVA
still matches cva, while paired controls only match all. Native DOM state is unaffected.

Keep this boundary small, structural, and covered by JIT, AOT, SSR, hydration, OnPush, and browser
tests. Re-check against the latest Angular maintenance release when upgrading. Prefer a public
Angular API if one becomes available for writing inputs on an existing host component from a directive.

Private lookup/write failures return false without interrupting the rest of the binding. Warn once
per control and input when a recognized write fails, explaining the possibly stale value. Recommend
useFormNodeState() for state reads unless already in use; CVA is an alternative for value/disabled
interoperability. Consumer-authored input transform exceptions are not suppressed.
