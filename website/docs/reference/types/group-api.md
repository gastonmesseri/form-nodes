---
title: GroupApi
---

# GroupApi

State and operations for a structural group, including its typed children.

## Import

```ts
import type { GroupApi } from '@ngblocks/form-nodes';
```

## When to use it

Use for structural-group API operations. A group's `$api` combines this contract with a callable signal; child nodes are available through `children`.

## Declaration

```ts
type GroupApi<TNodes extends Nodes, TParent extends AnyNode = AnyNode> = Omit<FormApi<TNodes, TParent>, 'setValidators' | 'children' | 'forEachChild' | 'errors' | 'allErrors' | 'form' | 'root' | 'getError' | 'add' | 'remove' | 'nodeType' | 'submit' | 'submitted' | 'submitting' | 'validationStatus'> & {
    nodeType(): 'group';
    setValidators(validators: ValidatorSource<GroupValue<TNodes>, GroupNode<TNodes, TParent>>): void;
    readonly children: GroupChildren<TNodes, TParent> & Readonly<Record<string, DynamicNode>>;
    forEachChild(callback: (child: keyof TNodes extends never ? DynamicNode : GroupChildren<TNodes, TParent>[keyof TNodes], key: string) => void, options?: {
        includeDynamic?: false;
    }): void;
    forEachChild(callback: (child: DynamicNode, key: string) => void, options: {
        includeDynamic?: boolean;
    }): void;
    add<TKey extends string, TDefinition>(key: TKey extends keyof TNodes | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): AddedNode<TDefinition, GroupNode<TNodes, TParent>>;
    add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
        readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], GroupNode<TNodes, TParent>>;
    };
    remove(key: string): DynamicNode | undefined;
    form: Signal<NearestForm<TParent> | null>;
    root: Signal<GroupRoot<TNodes, TParent>>;
    errors: NodeErrorsSignal<GroupNode<TNodes, TParent>>;
    allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<GroupNode<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
    getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<GroupNode<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
    validationStatus: Signal<ValidationStatus>;
    submitting: Signal<boolean>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNodes` | `Nodes` | Required |
| `TParent` | `AnyNode` | `AnyNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `nodeType` | Returns the concrete primitive represented by this node. |
| `setValidators` | Replaces this group's validators while preserving its node type in inline callbacks. |
| `children` | Readonly runtime child map. Declared properties retain exact node types; arbitrary keys use DynamicNode. |
| `forEachChild` | **Dynamically added nodes are excluded by default.** Pass `{ includeDynamic: true }` to visit them. |
| `add` | Adds one child at runtime and returns the attached node with its exact inferred type. Adds several child definitions atomically and returns an exact keyed map of their attached live nodes. |
| `remove` | Detaches a dynamically added child. Initially declared children cannot be removed. |
| `form` | Nearest explicit `form()` containing this group, or `null` when no form workflow owns it. A nested explicit form is the workflow owner instead of the complete structural root. |
| `root` | Complete structural root containing this group. A root or detached group returns itself. Use this signal when traversal must cross nested form workflow boundaries. |
| `errors` | Validation errors belonging directly to this group, excluding descendant-owned errors. |
| `allErrors` | Validation errors from this group and its complete subtree in structural order. |
| `getError` | Returns the first validation error belonging directly to this group and matching `kind`. Returns the first custom error belonging directly to this group and matching `kind`. |
| `validationStatus` | Aggregated validation phase for this group subtree: `'valid'`, `'invalid'`, or `'unknown'`. |
| `submitting` | Whether an ancestor form is currently running its submission action. Groups cannot initiate submission. |

## Related reference

- [Node API and collision-safe access](../node-api.md)
- [Public types index](./index.md)
- [AddedNode](./added-node.md)
- [AnyNode](./any-node.md)
- [CustomValidationError](./custom-validation-error.md)
- [DynamicNode](./dynamic-node.md)
- [FormApi](./form-api.md)
- [GroupNode](./group-node.md)
- [GroupValue](./group-value.md)
- [NodeErrorsSignal](./node-errors-signal.md)
- [ValidationErrorMap](./validation-error-map.md)
- [ValidationErrorWithTargetNode](./validation-error-with-target-node.md)
- [ValidationStatus](./validation-status.md)
- [ValidatorSource](./validator-source.md)
