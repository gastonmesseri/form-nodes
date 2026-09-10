---
title: Migration guides
---

# Migration guides {#migration-guides}

## Moving to 3.7.0: closest form state {#closest-form-state}

`useClosestFormState()` replaces the removed `useClosestForm()` export. The new hook returns a
stable facade rather than a signal of the form API. Its properties are reactive signals:

```ts
// Before:
closestForm = useClosestForm();
// After:
formState = useClosestFormState();
```

Replace `closestForm()?.submitted()` with `formState.submitted()`. Replace calls to the old
API signal with `formState.formNode()`: for example, `formState.formNode()?.reset()` or
`formState.formNode()?.()` for the exposed form value.

`submitted()` now also supports the nearest Angular Reactive Forms or `NgForm` root when no
Form Nodes owner is available. `formNode()` remains null for those sources. Without any source,
`submitted()` is false. See [resolution and reset timing](../reference/use-closest-form-state.md).

## Moving to 3.6.0: read-only validator contexts {#read-only-validator-contexts}

Nodes returned by `ctx.node()`, `ctx.field()`, and `ctx.parent<TParent>()` now expose a recursive
read-only validation view. This includes `$api`, ancestors, children, and array traversal.
The explicit parent generic preserves your child types but does not restore the full node API.
This breaking type change ships in minor version **3.6.0** at the maintainer's explicit request,
as an exception to the default Semantic Versioning policy.

Replace validation-output conditions such as `ctx.node().valid()` or `ctx.parent()?.errors()` with
conditions on the relevant values. Return validation errors, optionally targeting a context node.
Move mutations, submissions, and validator replacement into application actions or `configure`.
Code outside validator contexts retains the normal node API. Runtime identities are unchanged.

The optional `validator(callback, { reactive: false })` samples external signals on value-triggered
validation; it does not make circular reads safe. See [the validator reference](../reference/validator.md).

## Moving to 3.4.0: one API access path {#single-api-access}

Use `node.$api` wherever you previously used the `node.api` API alias. Direct reads and operations such as `node()`, `node.valid()`, and `node.reset()` continue to work.

| Previous API access | Current API access |
| --- | --- |
| `node.api` | `node.$api` |
| `node.api()` | `node.$api()` |
| `node.api.valid()` | `node.$api.valid()` |
| `node.api.value.control.set(next)` | `node.$api.value.control.set(next)` |

`$api` remains callable, reactive, and safe from child-name collisions. A declared child named `api` is ordinary data: keep access such as `profile.api()` when it reads that child. Do not replace those child reads with API calls.

This change ships in the minor release **3.4.0** at the maintainer's request while the library has no other consumers. The old alias is removed; update existing API access before upgrading.

## Moving to 3.3.0: nested value views {#nested-value-views}

The old public names are removed without compatibility aliases. This incompatible change is
included in the minor release **3.3.0**. The maintainer has explicitly authorized this
versioning exception because the library currently has no other consumers. The migration is
still required; a minor version number does not make these removed APIs backward compatible.

| Previous API | Replacement |
| --- | --- |
| `node.controlValue()` | `node.value.control()` |
| `node.setControlValue(next)` | `node.value.control.set(next)` |
| `node.api.controlValue()` | `node.api.value.control()` |
| `node.$api.controlValue()` | `node.$api.value.control()` |
| `node.api.setControlValue(next)` | `node.api.value.control.set(next)` |
| `node.$api.setControlValue(next)` | `node.$api.value.control.set(next)` |

When passing a signal to a utility, replace `node.controlValue` with `node.value.control`.
For extracted actions, use `const { set: receiveValue } = node.value.control`.
Use `$api.value` for generic `AnyNode` infrastructure or child-name collisions.

`node()` and `node.value()` keep their exposed equality behavior. New `value.committed()` reads
latest committed data before custom equality checks, including in descendants, but does not bypass
debounce. `value.committed.set(next)` is equivalent to `node.set(next)`; `node.set()` remains supported.
Control setters now have a uniform public path on all four node kinds. They receive complete
values, mark the selected node dirty, and respect debounce; they do not collect child drafts or
emit directive outputs by themselves. The nested signals provide `set`, not Angular's full
`WritableSignal` interface. See [signatures, examples, and semantics](../reference/node-value.md).

## Moving to 3.0.0: node types and Angular imports {#node-type-names}

Version 3.0.0 reorganizes public node types and Angular imports.
Update imports and explicit type annotations:

| Previous API | Replacement |
| --- | --- |
| `Node` | `AnyNode` |
| `Field<TValue>` | `FieldNode<TValue>` |
| `Group<TChildren>` | `GroupNode<TChildren>` |
| `Form<TChildren>` | `FormNode<TChildren>` |
| `ArrayNode<TItem>` | Unchanged |
| `FormNode` directive import or binding type | `FormNodeDirective` |

`FormNode` now names the form model type. In component `imports`, DI, and directive queries,
use `FormNodeDirective`. `FormNodeBinding<TNode>` remains the generic binding contract.
`[formNode]`, the `formNode` template export, and `field()`, `group()`, `form()`, and `array()`
keep their names and runtime behavior. `isFormNode()` now narrows to `AnyNode`.

For components that accept an unspecified node structure, omit the generic arguments and use `FieldNode`, `GroupNode`,
`FormNode`, or `ArrayNode`. `FormNode` means a form specifically; `AnyNode` accepts every
primitive. See [Choosing a node type](../reference/node-api.md#node-types).

You can import [`FormNodesModule`](../reference/form-nodes-module.md) in components or application
modules instead of importing `FormNodeDirective` individually. It currently exports that directive
and does not register configuration providers.

## 📦 Moving to 2.0.0 {#moving-to-200}

Version `2.0.0` is a major release because it includes incompatible API and behavior changes.
When upgrading from `1.1.0`, follow the 2.0.0 migration sections below. Existing `^1.x`
dependency ranges do not select `2.0.0`; update the dependency explicitly and run your application checks. Incompatible changes normally require another major release; see the explicit
[3.3.0 exception](./versioning.md#nested-value-api-exception).

## 🔄 2.0.0: standalone validation error types {#standalone-validation-error-types}

The `ValidationError` namespace has been replaced by directly exported types. Update imports
and qualified references using this mapping:

| Previous reference | Import and use |
| --- | --- |
| `ValidationError.ForKind<K>` | `ValidationErrorForKind<K>` |
| `ValidationError.WithTargetNode<N>` | `ValidationErrorWithTargetNode<N>` |
| `ValidationError.WithOptionalTargetNode<N>` | `ValidationErrorWithOptionalTargetNode<N>` |
| `ValidationError.WithoutTargetNode` | `ValidationErrorWithoutTargetNode` |
| `ValidationError.ValidatorResult<N>` | `ValidatorError<N>` |

The base `ValidationError` interface remains available. Object shapes, generic defaults,
readonly properties, target restrictions, and validation behavior are unchanged. See
[Error types](../reference/validation.md#error-types).

## 🧪 2.0.0: experimental input synchronization {#unreleased-experimental-input-synchronization}

Rename `syncControlInputs` to `syncInputs`. Optional custom-control input synchronization is now
**disabled by default**. To preserve the old full synchronization, explicitly pass
`{ syncInputs: 'all' }` at the node, factory, provider, or global scope. `true` now means
`'declared'`, not full synchronization. Null resets to false.

Value/checked models, native-control state, CVA callbacks, and interaction hooks retain their
normal behavior. A node option configures only its own binding. See
[the mode reference](../reference/provide-form-nodes-config.md#custom-control-inputs) before enabling
this experimental Angular-internal adapter.

## ⚙️ 2.0.0: global configuration {#unreleased-global-configuration}

Replace `configureGlobalValidatorMessages(messages)` with
`configureGlobalFormNodes({ validatorMessages: messages })`. The old export is removed.
The new `GlobalFormNodesConfig` type additionally accepts `classes` and `syncInputs`.

Configure global binding defaults before bootstrap; each explicit Angular provider takes
precedence for its own option. Existing bindings retain their captured settings. Global message
sources remain reactive and do not receive an injection context. Null resets only the supplied
global option, and omission preserves earlier settings.

Cleanup callbacks now restore independent options and skip already cleaned-up overrides when
called out of order. See [Global configuration](../reference/configure-global-form-nodes.md).

## ⚙️ 2.0.0: unified configuration provider {#unreleased-unified-configuration-provider}

Use `provideFormNodesConfig()` for both validator messages and binding configuration:

| Previous API | Replacement |
| --- | --- |
| `provideValidatorMessages(factory)` | `provideFormNodesConfig({ validatorMessages: factory })` |
| `provideFormNodeConfig(options)` | `provideFormNodesConfig(options)` |
| `FormNodeConfig` | `FormNodesConfig` |

The old exports are removed. Combine the options in one call per injector scope:

```ts
provideFormNodesConfig({
  validatorMessages: () => ({ required: 'Please complete this field.' }),
  classes: ANGULAR_FORMS_STATUS_CLASSES,
  syncInputs: false,
});
```

The function returns `Provider[]`, so it supports component providers as well as application,
route, and NgModule providers. Keep injectable factories inside `validatorMessages`.
Messages are still captured when nodes are created; binding an existing node does not replace them.

All three options inherit independently. A synchronization-only configuration preserves inherited
classes and messages. A classes-only configuration preserves inherited synchronization and messages.
An explicit class map replaces the inherited map without merging. An empty `{}` registers no
providers; `{ classes: {} }` clears only classes. To also restore synchronization explicitly, use
`{ classes: {}, syncInputs: 'all' }`.
See [Configuration provider](../reference/provide-form-nodes-config.md).

## 🌳 2.0.0: opt in to dynamic child iteration {#unreleased-opt-in-to-dynamic-child-iteration}

`forEachChild(callback)` now visits only initially declared children. To preserve the previous
behavior of including children added with `add()`, pass the new option:

```ts
node.forEachChild(callback, { includeDynamic: true });
```

The opted-in callback receives `DynamicNode`, so update callbacks that assumed only declared
child types. A runtime boolean also requires a `DynamicNode` callback. Empty forms and groups
need the option to visit any children; their default callback child type is `DynamicNode`.
`Object.values(node.children)` continues to include added nodes and retains its existing types.

## 📐 2.0.0: runtime child map types {#unreleased-runtime-child-map-types}

`children` again accepts arbitrary string keys, so `node.children.nonExisting?.value()` is valid.
Known properties retain their exact types. Enable `noUncheckedIndexedAccess` to have missing
index-signature keys typed as optional, or use `get(key)`, which is always optional.

Enumeration now includes `DynamicNode` in its element type because added children may differ
from the initial declaration. Use `forEachChild()` for the precise declared-child union, or
`forEachChild(callback, { includeDynamic: true })` for all runtime children.

## 📐 1.1.0: declared-child map types {#110-declared-child-map-types}

In version 1.1.0, `children` exposed only initially declared keys in TypeScript. This restriction
is superseded by the 2.0.0 runtime-map change above. Replace dynamic
`node.children[key]` access with `node.get(key)`, which returns `DynamicNode | undefined`,
or retain the precisely typed node returned by `add()`.

`Object.values(node.children)` now infers the union of declared child types. Runtime enumeration
still includes dynamically added nodes, whose types may fall outside that union. `forEachChild()` now infers the same declared-child union. For arbitrary dynamic child types,
use `get(key)` inside the callback or retain the node returned by `add()`.

This is a breaking typing change; runtime map contents and node behavior are unchanged.

## ⚙️ Scoped package name {#scoped-package-name}

The package is published as `@ngblocks/form-nodes`. Update dependency declarations, imports,
and module augmentations to use that name:

```sh
npm install @ngblocks/form-nodes
```

```ts
import { form, field } from '@ngblocks/form-nodes';
```

Remove the old unscoped dependency if it is present. Exported symbols and form behavior are
unchanged. The GitHub repository and documentation site keep their existing URLs.

## ⚙️ Flattening form submission options {#flattening-form-submission-options}

Move submission properties directly into the second `form()` argument:

| Previous option | Replacement |
| --- | --- |
| `submission.action(form, value)` | `onSubmit(value, form)`; reverse the callback arguments. |
| `submission.onInvalid(form)` | `onSubmitBlocked(form)` |
| `submission.ignoreValidators: 'pending'` | `submitWhen: 'not-invalid'` (still the default) |
| `submission.ignoreValidators: 'none'` | `submitWhen: 'valid'` |
| `submission.ignoreValidators: 'all'` | `submitWhen: 'always'` |

Replace `FormSubmissionOptions` annotations with `FormOptions` and update their properties.
Groups and arrays do not accept any of these submission options. The blocked callback includes
pending validation when `submitWhen` is `'valid'`; it does not run for concurrent submissions
or missing actions. Pending validation is not awaited. See [Form submission](../guides/submission.md).

## 🔌 Renaming the custom-control state hook {#renaming-the-custom-control-state-hook}

In the first public release, `1.0.0`, `useControlState()` is renamed to
`useFormNodeState()`. Update imports from `@ngblocks/form-nodes` and every call to the hook. The old
name is no longer exported.

The return type remains `ControlState<TValue>`, and all `ControlState*` types retain their
names. Supported bindings, signal behavior, and injection-context requirements are unchanged;
see the [`useFormNodeState()` reference](../reference/form-node-state.md).

## 🧩 Removing the field adapter {#removing-the-field-adapter}

In the first public release, `1.0.0`, Form Nodes no longer exposes `$field`.
Change each Form Nodes binding from:

```html
<input [formField]="profile.name.$field" />
```

To:

```html
<input [formNode]="profile.name" />
```

Import `FormNodeDirective` from `@ngblocks/form-nodes` in the component's `imports`. Remove Angular's `FormField`
import when no independently created Angular form uses it. Bind native form roots with
`[formNode]="profile"` to retain Form Nodes submission and reset handling.

`provideFormNodesConfig()` now configures `[formNode]` only. Angular's `provideSignalFormsConfig()`
configures its own `[formField]` controls independently; both providers can coexist. If classes
previously came from Angular's provider on an adapted control, move them to `provideFormNodesConfig()`
and read state with `binding.node()` instead of `binding.state()`.

`useFormNodeState()` remains available for all supported forms APIs. Use Angular's `form()` and
`signal()` for controls bound through Angular `[formField]`; see the
[`useFormNodeState()` example](../reference/form-node-state.md#bind-with-formfield).

Custom components may implement the Form Nodes control types without depending on Angular's
version-specific `FormUiControl` type. The supported Angular ranges are now `^21.0.7 || ^22.1.5`;
update older Angular installations to a verified patch before adopting `1.0.0`.

## 🧪 Upgrade checklist {#upgrade-checklist}

Use this process for every major release:

1. Read the source and target entries in the [changelog](./changelog.md).
2. Verify Angular, Node.js, and TypeScript expectations in [Compatibility](./compatibility.md).
3. Search the relevant migration section for renamed, removed, or behavior-changing APIs.
4. Upgrade without suppressing npm peer-dependency warnings.
5. Run TypeScript and Angular template compilation before changing application code preemptively.
6. Run tests that cover validation, submission, arrays, and `[formNode]` control bindings.

```bash
npm install --save @ngblocks/form-nodes@^1
npx tsc --noEmit
ng build
ng test
```

Adapt the verification commands to the scripts and test runner used by your application.

## 📦 What migration entries will contain {#what-migration-entries-will-contain}

Every breaking migration will identify:

- The first version containing the change.
- Who is affected and how to recognize the affected usage.
- A before-and-after example.
- Observable behavior changes, not only renamed TypeScript symbols.
- Any automated migration or temporary compatibility path, when available.

## 💡 Moving to 1.0.0 {#moving-to-100}

`1.0.0` is the first public release, so there is no earlier public Form Nodes version to migrate
from. The development migration notes on this page apply to users of earlier repository snapshots. For a new application, start with [Installation](../getting-started/installation.md) and then
build [Your first form](../getting-started/first-form.md).

### ◆ Package name {#package-name}

The library is now named `@ngblocks/form-nodes`. Replace the previous package dependency with `@ngblocks/form-nodes`
and update imports, re-exports, module augmentations, and any TypeScript path mappings or bundler
aliases that reference the previous name.

```bash
npm install --save @ngblocks/form-nodes
```

```ts
import { form, field, array } from '@ngblocks/form-nodes';
```

Exported symbols and form behavior are unchanged by the rename. Remove the previous dependency
from `package.json` and regenerate your lockfile with your package manager.

### ◆ Validator state access {#validator-state-access}

State signals are no longer direct validator-context properties. Read `dirty`, `disabled`,
`disabledReasons`, `enabled`, `hidden`, `pristine`, `readonly`, `required`, `submitting`, `touched`,
`untouched`, `visible`, and `writable` through `context.node()` or `context.field()` instead.

For example, replace `({ touched }) => touched()` with `({ node }) => node().touched()`.
The same migration applies to inline validators, `validator()`, built-in validator `when` options,
and all `asyncValidator()` callbacks. State reads retain their existing reactive tracking rules.
`value`, `node`, `field`, `parent`, and `path` remain on the shared context.

### ◆ Validator node signals and navigation {#validator-node-signals-and-navigation}

`context.node` and `context.field` are now the same readonly signal returning the validated node.
Inline callbacks and inline helpers infer the concrete primitive, its value type, and its children
or items. Omit helper generics to allow inference from the enclosing primitive.

| Previous access | New access |
| --- | --- |
| `context.field` as a node | `context.node()` or `context.field()` |
| `context.field.dirty()` | `context.node().dirty()` or `context.field().dirty()` |
| `context.field()` to read a value | `context.value()` (preferred) or `context.field().value()` |
| `context.form()` | `context.node().form()` or `context.field().form()` |
| `context.root()` | `context.node().root()` or `context.field().root()` |

Flat `form` and `root` context properties are removed. The node signals never return `null` and
keep their identity across value changes or tree moves. Explicit `TField` context types appear
as `Signal<TField>` on both aliases. Reading only `context.node()` tracks identity, not value.
`context.parent()` remains available. Replace `context.api` with `context.node().api` or
`context.field().api`. Inline validators infer the concrete node API. For separately declared
helpers, provide `TField` when an exact node type is needed; `TApi` now only specializes the
remaining context navigation. Read the typed value with `context.value()`.

### ◆ Form and root ancestry lookups {#form-and-root-ancestry-lookups}

`form()` now identifies workflow ownership by returning the nearest explicit `form()`. Code that
used it to reach the outermost structural node must call `root()` instead:

```ts
const checkout = form({
  payment: form({
    card: field(''),
  }),
});

checkout.payment.card.form(); // checkout.payment
checkout.payment.card.root(); // checkout
```

A standalone `group()` or `array()` previously returned itself from `form()` and now returns
`null`; its new `root()` signal returns itself. Standalone fields continue to return `null` from
`form()`, but now also expose themselves through `root()`. Update validator dependencies in the
same way: use `context.node().form()` for the owning workflow and `context.node().root()` for the complete tree.

### ◆ Field nullability options {#field-nullability-options}

Per-field `nullable` options were removed before the initial release. Replace
`field(value, { nullable: false })` with `field.strict(value)`, and replace
`field(value, { nullable: true })` with `field.nullable(value)`. Preserve any other options as the
last argument. The `nullable` option on `createFormPrimitives()` is unchanged because it defines a
factory-wide default rather than one field's local choice.

### ◆ Declaration shorthand contract {#declaration-shorthand-contract}

The initial `1.0.0` contract accepts primitive values, `Date`, functions, class instances, other
non-plain objects, and arrays as atomic field shorthand inside `form()`, `group()`, dynamic
`add()`, and object templates passed to `array()`. Plain objects create structural groups. Existing
nodes are attached unchanged.

Arrays are always atomic fields when used as object properties; their length and contents never
select the node kind. Replace an array property with `array(template)` only when its items need
independent nodes. Wrap a plain application-data object with `field(value)` when it must remain one
atomic value, or use `group({...})` when the structural branch needs options or validators.

Definition objects reject enumerable accessors, symbol child keys, and `__proto__`. Replace an
accessor with a data property before constructing the form, use a supported string child key, or
wrap the complete object with `field(value)` when it represents one leaf value. See the
[declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix) for exact
equivalents and inferred types.

When migrating from Angular Reactive Forms or Angular 22 Signal Forms, use the
[form-modeling patterns](../guides/form-modeling-patterns.md) and
[control-binding guide](../guides/control-binding.md). These are conceptual migrations rather than
version upgrades, so application behavior should be translated deliberately instead of through
mechanical symbol replacement.

## ⚙️ Custom-control binding configuration {#custom-control-binding-configuration}

Models (`value = model(...)` or `checked = model(...)`) and CVAs keep their standard connections
without experimental options. State input writes and paired value connections now have independent
options, each defaulting to false and inheriting independently.

| Earlier configuration | Replacement |
| --- | --- |
| `syncInputs: true` or `'only-declared'` | `syncInputs: 'declared'` |
| `syncInputs: 'always'` | `syncInputs: 'all'` |
| `syncInputs: 'only-signal-controls'` | `syncInputs: 'signal-controls'` |
| `{ mode: 'always', inputs: [...] }` | `{ inputs: [...] }` |
| `{ mode: 'only-declared', inputs: [...] }` | Use `{ inputs: 'declared' }` for all declarations, or explicitly list the desired declared inputs. |
| `syncInputs: []` to enable paired values | `bindInputOutputPairs: true` with syncInputs false/omitted |

Add `bindInputOutputPairs: true` wherever a separate value/valueChange or checked/checkedChange pair
previously relied on syncInputs to connect. Keep syncInputs separately for the desired state inputs.
False/null now pauses the entire pair connection, including component focus/reset hooks and writable
node access. Returning to an enabled node resynchronizes its current value.

Targets in `{ inputs, target }` filter the selected adapter, not component interfaces. A CVA with a
model still matches cva. Active pairs only match all. Model controls can receive complete supported
input synchronization with signal-controls, or use useFormNodeState() without experimental writes.
See [the full configuration reference](../reference/provide-form-nodes-config.md#custom-control-inputs).
