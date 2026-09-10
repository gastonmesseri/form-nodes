---
title: Validation error types
---

import CodeBlock from '@theme/CodeBlock';
import descendantsSource from '!!raw-loader!../../examples/errors-descendants.example.ts';
import errorsSource from '!!raw-loader!../../examples/public-error-contracts.example.ts';

# Validation error types

Choose an error type according to where the error is in the validation pipeline: a rule returns a
result, the node assigns ownership, and an error renderer consumes the published errors.

## Choose a result or error contract

| Task | Public type |
| --- | --- |
| Describe the base category and optional message | [`ValidationError`](./types/validation-error.md) |
| Return a synchronous rule result | [`ValidationResult`](./types/validation-result.md) |
| Return an error that may target another node | [`ValidatorError`](./types/validator-error.md) |
| Return an error for the current node without attribution | [`ValidationErrorWithoutTargetNode`](./types/validation-error-without-target-node.md) |
| Accept an error before or after node attribution | [`ValidationErrorWithOptionalTargetNode`](./types/validation-error-with-optional-target-node.md) |
| Consume a published error with an owning node | [`ValidationErrorWithTargetNode`](./types/validation-error-with-target-node.md) |
| Represent successful validation | [`ValidationSuccess`](./types/validation-success.md) |
| Return asynchronous results | [`AsyncValidationResult`](./types/async-validation-result.md) |
| Return errors or further synchronous validator composition | [`ComposableValidationResult`](./types/composable-validation-result.md) |

[`ValidationError`](./types/validation-error.md) exposes `kind: string` and `message?: string`. Do not assume every error has a
message; provide an application fallback or a configured validator message. A synchronous result
can also be a string, which becomes a `custom` error, or a readonly array of messages and errors.
An empty string is still an error message. `null`, `undefined`, and `void` indicate success.

[`ValidatorError`](./types/validator-error.md) accepts `kind: string | number` as input. A numeric identifier such as `123`
is normalized to `'123'` before publication; `ValidationError` and error queries continue to
use strings. Use `ValidatorError` or [`ValidationResult`](./types/validation-result.md) to annotate rules returning numeric
kinds, and query them with `getError('123')`. Numeric errors are shallow copies; their source
object is not mutated. See the [complete validator result contract](../guides/validation.md#validator-results)
for the declaration callback's intentional `any` return and checked authoring alternatives.

## Structured built-in and custom errors

| Requirement | Public type |
| --- | --- |
| A union of library-provided errors | [`BuiltInValidationError`](./types/built-in-validation-error.md) |
| An unregistered custom error with unknown additional data | [`CustomValidationError`](./types/custom-validation-error.md) |
| The error shape for a particular kind | [`ValidationErrorForKind<TKind>`](./types/validation-error-for-kind.md) |
| Register custom kinds through module augmentation | [`ValidationErrorMap`](./types/validation-error-map.md) |

Use `getError(kind)` when you need kind-specific fields. The base error collection guarantees
category, optional message, and ownership; it does not make every validator-specific property
available on every entry. Register application error kinds to give lookups their precise shape.
Module augmentation adds compile-time information; the validator must still produce matching data.

<CodeBlock language="ts" title="profile-errors.ts">{errorsSource}</CodeBlock>

The built-in contracts include the data relevant to their rule, such as numeric or date bounds,
actual values, patterns, word or length constraints, and duplicate indexes. Follow the
[individual validator references](./built-in-validators.md) for exact error kinds and behavior.

## Ownership and binding attribution

`targetNode` identifies the node owning an error. Reading an error through an ancestor's
`allErrors()` preserves its original target. A binding-specific error may also contain `formNode`,
the concrete directive binding that produced it; ordinary custom validators do not assign that
binding field themselves.

Use [`AnyNode`](./types/any-node.md) and `$api` when handling target nodes whose child names are
unknown. `errors()` and `allErrors()` differ in their traversal scope; see
[errors and validation status](../guides/errors-and-status.md) for own versus descendant errors,
visibility, and error-query behavior.

## State and display integration

[`ValidationStatus`](./types/validation-status.md) describes valid, invalid, or unresolved state;
it is not an error object. Pending asynchronous work and existing errors must be considered
according to the node's aggregation rules.

For controls observing Angular and Form Nodes bindings through [`useFormNodeState()`](./form-node-state.md), use
[`ControlStateError`](./types/control-state-error.md). For translated or configured messages, use
[`ValidatorMessages`](./types/validator-messages.md) and
[`ValidatorMessageParameters`](./types/validator-message-parameters.md).

See [validator messages](../guides/validator-messages.md) for message resolution and
[custom control contracts](./custom-control-contracts.md) for reusable error-display integration.


## Error queries {#error-queries}

`node.errors()` reads only errors owned by that node. An invalid form can have no own errors when its children are invalid. Use `node.errors({ descendants: true })` to collect own errors followed by descendant errors in structural tree order. `node.allErrors()` remains an equivalent shortcut and returns the same cached array.

<CodeBlock language="ts" title="errors-descendants.example.ts">{descendantsSource}</CodeBlock>

No arguments, `{}`, and `{ descendants: false }` all select own errors. The option accepts a reactive boolean, for example inside `computed(() => profile.errors({ descendants: includeChildren() }))`. Reads track the selected existing signal; they do not create a new computed per call.

Every error preserves its original `targetNode`. Own reads retain the concrete node type; subtree reads use [`AnyNode`](./types/any-node.md), whose collision-safe API is accessed through `targetNode.$api`. Fields have no descendants, so both queries return the same errors. Disabled descendants, asynchronous validation, and dynamic child changes follow the existing `allErrors()` behavior.

The `errors` property remains assignable to Angular `Signal` and can still be passed directly to signal consumers. Its exported type is [`NodeErrorsSignal`](./types/node-errors-signal.md). These options apply to node errors, including `.$api.errors`; binding and `useFormNodeState()` error signals retain their own signatures.
