# Angular internals compatibility boundary

**Form Nodes is fully usable without the Angular-internal adapters in this directory.**
The optional state and constraint synchronization supports Angular Signal Forms' custom-control
input contract, as used by components implementing `FormValueControl<T>` or
`FormCheckboxControl`. It copies node state and constraints into the component's matching
inputs; it does not implement the control's `model()` value binding or the form's state logic.

An explicit `implements FormValueControl<T>` declaration is not required: TypeScript interfaces
do not exist at runtime, and Form Nodes discovers the supported inputs structurally. This
optional synchronization can also apply to a ControlValueAccessor component that declares those
same inputs. Ordinary native controls and standard ControlValueAccessor callbacks do not need it.

The matching custom-component inputs are:

- State: `disabled`, `disabledReasons`, `dirty`, `errors`, `hidden`, `invalid`, `pending`,
  `readonly`, and `touched`.
- Constraints: `required`, `min`, `max`, `minLength`, `maxLength`, and `pattern`.
- Control name: `name`.

Set `provideFormNodeConfig({ syncControlInputs: false })` to disable this optional synchronization.
This does not disable the state itself or the following functionality:

- Two-way value binding through `value = model<T>()` and checkbox binding through
  `checked = model<boolean>()` continue using the model's public `set()` and `subscribe()` APIs.
- Node operations such as `markAsTouched()`, `markAsDirty()`, and `reset()` continue updating
  state and propagating it through the form tree according to their normal rules.
- Native blur events and a custom control's `touch` output still mark the node touched.
  Control-originated value changes still mark it dirty.
- Validation, submission, native-control binding, and ControlValueAccessor value and
  disabled-state integration remain available.

For example, `node.markAsTouched()` still updates `node.touched()`. With synchronization disabled,
that state is simply not copied automatically into a custom component's `touched` input.
Custom controls can observe state through `useFormNodeState()` or receive explicit template
bindings; the application or component then owns the inputs listed above.

Separate `value`/`valueChange` or `checked`/`checkedChange` input-output pairs are a different
integration path: their model-to-control writes also use `writeComponentInput` from this
directory. `syncControlInputs: false` does not disable those value writes or remove their
dependency on this adapter. Use actual `model()` controls, native controls, or a
ControlValueAccessor for value binding that does not depend on this internal input writer.

Files in this directory isolate behavior that depends on Angular implementation details rather
than its supported public API. Keep this boundary small, structural, and covered by JIT, AOT,
server-rendering, hydration, OnPush, and browser tests.

Re-check these adapters against the latest Angular maintenance release whenever Angular is
upgraded. Prefer a public Angular input-writing API as soon as one can target an existing host
component from a directive.

Every private lookup and write must fail closed: return `false` and leave the rest of the
`[formNode]` binding operational. A changed Angular internal may disable synchronization of an
optional state input, but must not prevent value/event binding or node behavior. Do not suppress
exceptions thrown by consumer-authored input transforms.

When a recognized input cannot be written, warn once per control instance and input name. The
warning must state that the control remains connected, identify the potentially stale state, and
recommend `useFormNodeState()` as the stable state channel unless that component already uses
it. Mention `ControlValueAccessor` only as an alternative for value and disabled interoperability;
it does not represent every optional state.
