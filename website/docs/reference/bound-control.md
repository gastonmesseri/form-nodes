---
title: Bound control API
---

import CodeBlock from '@theme/CodeBlock';
import boundControlComponentSource from '!!raw-loader!../../examples/bound-control-component.typecheck.ts';
import formNodeSource from '!!raw-loader!../../examples/bound-control-form-node.typecheck.ts';
import formFieldSource from '!!raw-loader!../../examples/bound-control-form-field.typecheck.ts';
import formControlSource from '!!raw-loader!../../examples/bound-control-form-control.typecheck.ts';
import formControlNameSource from '!!raw-loader!../../examples/bound-control-form-control-name.typecheck.ts';
import ngModelSource from '!!raw-loader!../../examples/bound-control-ng-model.typecheck.ts';

# injectBoundControl()

`injectBoundControl<TValue>()` gives a custom-control component one stable, signal-based view of the
form binding attached to its host. The component can consume the same interface whether its caller
uses `[formNode]`, `[formField]`, `[formControl]`, `formControlName`, or `ngModel`.

Call it in the component's injection context. This custom input derives its required mark, native
state, accessibility attributes, and error list from whichever supported form API binds it:

<CodeBlock language="ts" metastring="{10,18-21,23,26,28,38}">{boundControlComponentSource}</CodeBlock>

No provider or adapter selection is required.

## Component integration styles

A signal custom control declares a `model()` and can optionally implement Angular's
`FormValueControl` interface. This is the natural shape for `formNode` and required by
`formField`:

```ts
export class DatePicker implements FormValueControl<string | null> {
  value = model<string | null>(null);

  boundControl = injectBoundControl<string | null>();
}
```

A `ControlValueAccessor` continues to own its normal value callbacks. `injectBoundControl()` adds
the source-neutral state signals; it does not replace `writeValue()` or the registered callbacks:

```ts {2}
export class DatePicker implements ControlValueAccessor {
  boundControl = injectBoundControl<string | null>();

  writeValue(value: string | null) { /* update the view */ }
  registerOnChange(callback: (value: string | null) => void) { /* retain callback */ }
  registerOnTouched(callback: () => void) { /* retain callback */ }
}
```

## Bind with formNode

`formNode` supports signal controls and CVAs. This reusable text input reads `required()` to show an
asterisk in its label and mirrors the same state to the native input. The component does not need a
separate `required` input:

<CodeBlock language="ts" metastring="{12,17-18,20,30}">{formNodeSource}</CodeBlock>

The adapter supplies the complete Gem node state, including disabled reasons, visibility,
readonly state, constraints, and normalized errors.

## Bind with formField

Angular's `formField` binding expects a Signal Forms-compatible control such as
`FormValueControl`. This date control waits until it is touched, then reads `invalid()` and
`errors()` to render its own accessible error list. A Gem node supplies its opaque `$field`
adapter:

<CodeBlock language="ts" metastring="{13,15,17,19,29}">{formFieldSource}</CodeBlock>

This source supplies Angular Signal Forms state, including constraints and disabled reasons,
through the same `BoundControl` signals.

## Practical state patterns

Use the state signals to make the component adapt to whichever form owns it:

```html {1,6-9}
@if (boundControl.required()) {
  <span aria-hidden="true">*</span>
}

<input
  [disabled]="boundControl.disabled()"
  [readonly]="boundControl.readonly()"
  [attr.aria-invalid]="boundControl.invalid()"
  (blur)="boundControl.markAsTouched()"
/>
```

Render validation feedback after interaction rather than coupling the component to one validation
engine:

```html {1,3}
@if (boundControl.touched() && boundControl.invalid()) {
  <ul aria-live="polite">
    @for (error of boundControl.errors(); track $index) {
      <li>{{ errorMessage(error) }}</li>
    }
  </ul>
}
```

Applications remain responsible for translating a normalized error `kind` into their preferred
copy. The component can use a local mapper, an injected message service, or a translated message
already present on the error.

## Bind with formControl

Reactive Forms custom controls use `ControlValueAccessor`. The hook observes the same-host
`FormControlDirective` without changing the CVA value protocol:

<CodeBlock language="ts" metastring="{11,14,23,33}">{formControlSource}</CodeBlock>

## Bind with formControlName

Inside a reactive `FormGroup`, the component remains a normal CVA. The adapter additionally exposes
`name()` as `'birthDate'`:

<CodeBlock language="ts" metastring="{14,23,32}">{formControlNameSource}</CodeBlock>

## Bind with ngModel

Template-driven forms also use the CVA protocol. A named `ngModel` binding makes its declared name
available through `name()`:

<CodeBlock language="ts" metastring="{11,14,23}">{ngModelSource}</CodeBlock>

## State signals

Every state member is a signal and is safe to read while disconnected.

| Signal | Disconnected default | Meaning |
| --- | --- | --- |
| `connected()` | `false` | Whether a supported binding is attached. |
| `source()` | `null` | Active binding API. |
| `value()` | `undefined` | Current committed bound value. |
| `disabled()` | `false` | Whether interaction is disabled. |
| `disabledReasons()` | `[]` | Source-neutral `{ message?: string }` reasons. |
| `dirty()` | `false` | Whether the bound control has been changed by interaction. |
| `errors()` | `[]` | Source-neutral `{ kind: string; ... }` errors. |
| `hidden()` | `false` | Whether form state hides the control. |
| `invalid()` | `false` | Whether validation currently fails. |
| `pending()` | `false` | Whether asynchronous validation is pending. |
| `touched()` | `false` | Whether the user has interacted with and left the control. |
| `readonly()` | `false` | Whether editing is disallowed without disabling interaction. |
| `required()` | `false` | Whether a non-empty value is required. |
| `min()`, `max()` | `undefined` | Effective numeric or date limits. |
| `minLength()`, `maxLength()` | `undefined` | Effective length limits. |
| `pattern()` | `[]` | Effective regular-expression constraints. |
| `name()` | `undefined` | Generated or declared control name when available. |

`formNode` and `formField` can supply their richer state models. `formControl`, `formControlName`,
and `ngModel` supply the state available from `AbstractControl`; unsupported properties retain the
defaults above. `formControlName` and named `ngModel` bindings expose their directive name.

## Normalized errors and disabled reasons

Errors always contain a `kind`, independently of their source:

```ts
boundControl.errors();
// [{ kind: 'required' }, { kind: 'server', message: 'Unavailable' }]
```

Angular Reactive Forms object payloads are spread alongside their key. Boolean `true` becomes only
`{ kind }`, while a primitive payload is available as `value`. Source-owned references such as a
Gem node or Angular `FieldTree` are not exposed.

Disabled reasons use `{ message?: string }`. An unnamed active reason is preserved as `{}` rather
than filtered out, so only `[]` means that no reason is known. APIs based on `AbstractControl` do
not expose individual reasons and therefore use `[]` even when `disabled()` is true.

## Report a blur interaction

Call `markAsTouched()` when the custom control loses focus:

```ts
markAsTouched() {
  this.boundControl.markAsTouched();
}
```

It delegates to the active forms API and is a safe no-op while disconnected.

## Ownership boundary

The facade reads bound state and reports the touched interaction; it is not a second form-control
API. Send user-authored values through `model()`, `FormValueControl`, or `ControlValueAccessor`.
Programmatic writes, reset, availability, and validation remain owned by the forms API that created
the binding. `BoundControl` intentionally has no `setValue()`, `reset()`, `disable()`, or `enable()`.

## Selection and lifecycle

If more than one supported source can be observed, selection is deterministic:

1. `formNode`
2. `formField`
3. `formControl`
4. `formControlName`
5. `ngModel`

Reactive Forms and `ngModel` changes normally arrive through `AbstractControl.events`. A replaced
control is detected after rendering, with the old subscription removed. Changes made with
`{ emitEvent: false }` become visible on the next render.

During server rendering, render-discovered Angular adapters safely expose disconnected defaults
and connect during the first browser render. `formNode` can connect synchronously through its host
registry. Always use `connected()` when behavior depends on an active source.

## Public types

| Type | Purpose |
| --- | --- |
| `BoundControl<TValue>` | Complete facade returned by `injectBoundControl<TValue>()`. |
| `BoundControlSource` | Union of supported source names. |
| `BoundControlError` | Normalized error with a required `kind`. |
| `BoundControlDisabledReason` | Normalized disabled reason with an optional `message`. |

## Related guides and reference

- [Custom controls](../guides/custom-controls.md)
- [`FormNode` binding API](./form-node-binding.md)
- [Control binding](../guides/control-binding.md)
- [API overview](./api-overview.md)
