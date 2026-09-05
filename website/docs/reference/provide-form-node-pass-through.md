---
title: provideFormNodePassThrough()
---

# provideFormNodePassThrough()

Marks a directive or host directive that consumes and delegates `formNode`, keeping the outer
`[formNode]` binding passive while an inner control performs synchronization.

## Signature

```ts
provideFormNodePassThrough(): Provider;
```

## Example

```ts
@Directive({
  selector: '[delegatesFormNode]',
  providers: [provideFormNodePassThrough()],
})
export class DelegatesFormNode {
  formNode = input.required<Node>();
}
```

Use the delegated node on the inner control:

```html
<input [formNode]="formNode()" />
```

Wrapper components with a public `formNode` input are detected automatically and do not need this
provider. Directives and host directives require it because Angular does not expose equivalent
public runtime input reflection for them.

Without the provider, the outer directive host may be treated as the control and fail because it is
not a native control, recognized signal-control component, or `ControlValueAccessor`.

See [`[formNode]`](./form-node-binding.md#pass-through-wrappers) and [Wrapper components](../guides/custom-controls-advanced.md#wrapper-components).
