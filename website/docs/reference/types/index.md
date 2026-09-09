---
title: Public types
---

# Public types

Every consumer-facing type alias and interface exported by `@ngblocks/form-nodes` has a dedicated
reference below. Prefer inference for node declarations; use these types for component inputs,
reusable helpers, validator contracts, and integration boundaries.

Import types from the package root. Declarations show their exact generic defaults and constraints;
helper names appearing inside a declaration are not necessarily public imports. Follow the linked
public types and the associated API guide for practical usage. Types do not create runtime objects.
`FormNodeDirective` also has a runtime Angular import documented on the binding reference.
`FormNodesModule` is documented as an Angular module; `_FormNode` is an AOT implementation export,
not a consumer type to import.

Start with [custom control contracts](../custom-control-contracts.md) or
[validation error types](../validation-errors.md) when integrating components or error displays.

## Nodes and values

| Type | Purpose |
| --- | --- |
| [AddedNode](./added-node.md) | Result of attaching a node definition or shorthand dynamically to an object node. |
| [AnyNode](./any-node.md) | Common callable contract for any field, group, form, or array node. |
| [ArrayIndexes](./array-indexes.md) | Numeric node access with parent-aware array item types. |
| [ArrayItems](./array-items.md) | The typed collection of item nodes exposed by an array node. |
| [ArrayItemWithParent](./array-item-with-parent.md) | An array item node whose parent is typed as the owning array. |
| [ArrayNode](./array-node.md) | Array node model. Omit the first type argument for an unspecified structure, or provide it to preserve exact item types. Generic array nodes retain array operations. |
| [ArrayPatch](./array-patch.md) | Readonly sequence accepted by an array node's `patch()`, mapped through the item patch type. |
| [ArraySet](./array-set.md) | Complete readonly sequence accepted by an array node's `set()`. |
| [ArrayValue](./array-value.md) | Mutable array value produced by an array node, with every item mapped to its readable value. |
| [DynamicFormChildren](./dynamic-form-children.md) | Readonly runtime-key map of dynamic and initially declared children. |
| [DynamicNode](./dynamic-node.md) | A dynamically discovered node whose concrete primitive is not known statically. |
| [FieldNode](./field-node.md) | A field node. Omit TValue for an unspecified value, or supply it to constrain reads and writes. |
| [FormNode](./form-node.md) | Form node model. Omit the first type argument for an unspecified structure, or provide it to preserve exact child types. |
| [FormNodeValue](./form-node-value.md) | Committed value inferred from any `form()`, `group()`, `array()`, or `field()` instance. Equivalent to `ReturnType&lt;TNode&gt;`; preserves nested values and field nullability. |
| [FormPatch](./form-patch.md) | Partial object accepted by a form's `patch()`; omitted child properties remain unchanged. |
| [FormSet](./form-set.md) | Complete object accepted by a form's `set()`, recursively using each child's set type. |
| [FormValue](./form-value.md) | Object value produced by a form, with each child node mapped to its readable value. |
| [FormValueContract](./form-value-contract.md) | Structural contract for checking a form or group against an aggregate value type without replacing its inferred child-node types. |
| [GroupNode](./group-node.md) | An object-shaped structural node without its own submission workflow. Omit the first type argument for an unspecified structure, or provide it to preserve exact child types. |
| [GroupPatch](./group-patch.md) | Partial object accepted by a group's `patch()`; omitted child properties remain unchanged. |
| [GroupSet](./group-set.md) | Complete object accepted by a group's `set()`, recursively using each child's set type. |
| [GroupValue](./group-value.md) | Object value produced by a group, with each child node mapped to its readable value. |
| [NodeValueSignal](./node-value-signal.md) | Reactive value views shared by fields, groups, forms, and arrays. Calling this signal is equivalent to calling the node: configured `equal` checks can retain an earlier equivalent value. Prefer calling the node for ordinary application reads. |

## Node APIs

| Type | Purpose |
| --- | --- |
| [ArrayApi](./array-api.md) | State and operations for an array node, including item access and reconciliation. |
| [CallableNodeApi](./callable-node-api.md) | A collision-safe node API that is also an Angular signal of the exposed node value. |
| [FieldApi](./field-api.md) | State, value views, navigation, and operations available on a field node. |
| [FormApi](./form-api.md) | State and operations for a form, including typed children and submission. |
| [GroupApi](./group-api.md) | State and operations for a structural group, including its typed children. |
| [NodeApi](./node-api.md) | The common API surface shared by all node kinds. |

## Controls and bindings

| Type | Purpose |
| --- | --- |
| [ControlState](./control-state.md) | Read-only state of the form binding attached to a custom-control component. |
| [ControlStateDisabledReason](./control-state-disabled-reason.md) | A source-neutral explanation for why the bound control is disabled. |
| [ControlStateError](./control-state-error.md) | A validation error normalized across supported Angular form-binding APIs. |
| [ControlStateSource](./control-state-source.md) | Binding APIs that can supply a universal `ControlState` state facade. |
| [FormNodeBinding](./form-node-binding.md) | Public view of a concrete `[formNode]` binding. |
| [FormNodeCheckboxControl](./form-node-checkbox-control.md) | A custom control exposing a boolean `checked` model for `[formNode]`. |
| [FormNodeControl](./form-node-control.md) | Either a value control or, for boolean values, a checkbox control recognized by `[formNode]`. |
| [FormNodeDirective](./form-node-directive.md) | The public instance type of the [formNode] Angular directive. |
| [FormNodeSubmitEvent](./form-node-submit-event.md) | A native form submission attempt. Values are exposed snapshots; `form` is the bound node. |
| [FormNodeUiControl](./form-node-ui-control.md) | Optional state inputs and interaction hooks recognized by `[formNode]` on Angular 21 and 22. |
| [FormNodeValueControl](./form-node-value-control.md) | A custom control exposing a `value` model for `[formNode]`. |

## Validator contracts

| Type | Purpose |
| --- | --- |
| [AsyncValidator](./async-validator.md) | Validator marked by `asyncValidator()` for asynchronous scheduling and cancellation. |
| [AsyncValidatorApi](./async-validator-api.md) | Mutable node API exposed to asynchronous validators by default. |
| [AsyncValidatorBaseContext](./async-validator-base-context.md) | Reactive context shared by asynchronous validator conditions, params, and handlers. |
| [AsyncValidatorContext](./async-validator-context.md) | Reactive node context and cancellation signal provided to an asynchronous validator run. |
| [AsyncValidatorOptions](./async-validator-options.md) | Scheduling, activation, and failure-handling options for `asyncValidator()`. |
| [AsyncValidatorState](./async-validator-state.md) | Non-validation state available through the validated node API. |
| [ComposableValidator](./composable-validator.md) | Validator that may return errors directly or compose one or more validators dynamically. |
| [FieldContext](./field-context.md) | Reactive context available to validation functions for the current field. |
| [ParameterizedAsyncValidatorConfig](./parameterized-async-validator-config.md) | The object-form asyncValidator configuration, combining reactive params with an asynchronous validate callback. |
| [ParameterizedAsyncValidatorContext](./parameterized-async-validator-context.md) | Asynchronous validator context extended with the current reactive parameter snapshot. |
| [ParameterizedAsyncValidatorOptions](./parameterized-async-validator-options.md) | Options for an async validator whose tracked dependencies are exposed as a typed snapshot. |
| [Validator](./validator.md) | Synchronous validator receiving the current value as a reactive signal. |
| [ValidatorApi](./validator-api.md) | Common node API exposed to validators when no exact owner API is specified. |
| [ValidatorContext](./validator-context.md) | Reactive context provided to synchronous validators. Generic public owners retain TValue on their node value reads. Concrete owners and partial structural owner contracts remain exact; only the common owner exposes every node kind. |
| [ValidatorOptions](./validator-options.md) | Common options supported by built-in validators. |
| [ValidatorReadonlyApi](./validator-readonly-api.md) | Reactive value and navigation shared by all validator context specializations. |
| [Validators](./validators.md) | Readonly normalized collection of composable validators for a node value. |
| [ValidatorSource](./validator-source.md) | One validator or a readonly list in which `null` and `undefined` represent no validator. |

## Validation errors and results

| Type | Purpose |
| --- | --- |
| [AsyncValidationResult](./async-validation-result.md) | Promise-like or observable-like result accepted from an asynchronous validator. |
| [BuiltInValidationError](./built-in-validation-error.md) | Union of every validation error provided by the library. |
| [ComposableValidationResult](./composable-validation-result.md) | Result accepted from a composable validator, including nested validators and successful entries. |
| [CustomValidationError](./custom-validation-error.md) | A custom validation error whose additional application-specific properties remain unknown. |
| [ValidationError](./validation-error.md) | A validation error produced by a validator. |
| [ValidationErrorForKind](./validation-error-for-kind.md) | Resolves a known error kind to its structured type, with a generic fallback for custom kinds. |
| [ValidationErrorMap](./validation-error-map.md) | Extensible registry used to resolve structured errors by their discriminating `kind`. |
| [ValidationErrorWithOptionalTargetNode](./validation-error-with-optional-target-node.md) | An error that may already define its target node. |
| [ValidationErrorWithoutTargetNode](./validation-error-without-target-node.md) | An error returned by a field validator before its target node is assigned. |
| [ValidationErrorWithTargetNode](./validation-error-with-target-node.md) | An error associated with a specific target node. |
| [ValidationResult](./validation-result.md) | A successful result, an error or message, or several errors and messages. Strings become errors with kind 'custom', including empty strings. |
| [ValidationStatus](./validation-status.md) | Aggregate validation result. |
| [ValidationSuccess](./validation-success.md) | Indicates that validation completed without errors. |
| [ValidatorError](./validator-error.md) | An error returned by a validator, optionally assigned to another node. |

## Configuration

| Type | Purpose |
| --- | --- |
| [ArrayOptions](./array-options.md) | Template, initial-data, validation, and ownership configuration for array(). |
| [DisabledReason](./disabled-reason.md) | Identifies one active cause of a node's disabled state. |
| [DisabledStateSource](./disabled-state-source.md) | A static or reactive condition that disables a node, optionally with a user-facing reason. |
| [FieldOptions](./field-options.md) | Value, validation, interaction, and ownership configuration for field(). |
| [FormNodesConfig](./form-nodes-config.md) | Injector-scoped validator messages and configuration for `[formNode]` bindings. |
| [FormOptions](./form-options.md) | Value, validation, interaction, ownership, and submission configuration for form(). |
| [GlobalFormNodesConfig](./global-form-nodes-config.md) | Process-wide defaults below injector-scoped configuration. |
| [GroupOptions](./group-options.md) | Configuration shared by object-shaped groups, excluding form submission behavior. |
| [MarkAsTouchedOptions](./mark-as-touched-options.md) | Options controlling whether markAsTouched() propagates to descendants. |
| [SyncInputName](./sync-input-name.md) | Names accepted when selecting individual synchronized control inputs. |
| [SyncInputs](./sync-inputs.md) | Controls which node states and constraints are synchronized to a bound control. |
| [ValidatorMessageParameters](./validator-message-parameters.md) | Structured built-in error data available to a configured message function. |
| [ValidatorMessages](./validator-messages.md) | Partial catalog used to replace built-in validator messages by error kind. |

## Configured factories

| Type | Purpose |
| --- | --- |
| [ArrayFactory](./array-factory.md) | The array factory returned by createFormPrimitives(). |
| [FieldFactory](./field-factory.md) | A configured field factory with nullable and strict declaration modes. |
| [FormFactory](./form-factory.md) | The form factory returned by createFormPrimitives(). |
| [FormPrimitives](./form-primitives.md) | The family of configured field, form, group, and array factories. |
| [FormPrimitivesOptions](./form-primitives-options.md) | Shared defaults supplied to createFormPrimitives(). |
| [GroupFactory](./group-factory.md) | The group factory returned by createFormPrimitives(). |
| [NonNullableFieldFactory](./non-nullable-field-factory.md) | A configured field factory whose default declarations exclude null. |

## Observable interoperability

| Type | Purpose |
| --- | --- |
| [ObservableLike](./observable-like.md) | Framework-neutral subset of an Observable accepted from asynchronous validators. |
| [ObserverLike](./observer-like.md) | Minimal observer contract accepted from an asynchronous validation source. |
| [SubscriptionLike](./subscription-like.md) | Handle returned by an observable-like source so the current validation run can release it. |
