---
title: asyncValidator()
---

# asyncValidator() {#asyncvalidator}

`asyncValidator()` marks a Promise- or Observable-based validator so its owning node can manage
reactive dependencies, debounce, cancellation, pending state, errors, and stale results.

```ts
import { asyncValidator, field, form } from '@ngblocks/form-nodes';

const usernameAvailable = asyncValidator(({ value, abortSignal }) => {
  return checkUsername(value(), abortSignal).then(available =>
    available ? null : { kind: 'usernameTaken' },
  );
});

const myForm = form({
  username: field('', [usernameAvailable]),
});
```

Async validators must be direct entries in a node's validator source. Do not return one from a
synchronous conditional validator.

## 🧭 API map {#api-map}

| I want to… | Start with | Details |
| --- | --- | --- |
| Let Form Nodes discover dependencies | `asyncValidator(validate, options?)` | [Callback signature](#callback-signature) |
| Name dependencies explicitly | `asyncValidator({ params, validate, ... })` | [Parameterized signature](#parameterized-signature) |
| Delay, condition, or recover validation | `debounce`, `when`, `onError` | [Option reference](#option-reference) |
| Read value, tree, state, or cancellation | Callback context | [Context reference](#context-reference) |
| Return a Promise, Observable-like value, or validation result | `AsyncValidationResult` | [Return value](#return-value) |
| Understand pending, ordering, and stale work | Node validation state | [Execution lifecycle](#execution-lifecycle) |

## 📐 Signatures {#signatures}

```ts
asyncValidator(validate, options?);
asyncValidator({ params, validate, debounce?, when?, onError? });
```

Both signatures produce an `AsyncValidator<TValue>` accepted by a field, form, group, or array
validator source. They differ only in how reactive dependencies are selected.

| Signature | Tracked dependencies | Best for |
| --- | --- | --- |
| Callback | Signals read by `validate` and `when` | A concise validator with obvious dependencies |
| Parameterized | Signals read by `params` and `when`; `validate` is untracked | A stable, explicit request snapshot |

Parameterless callbacks in the callback signature can reference their class form without return
annotations. Their accepted return type is intentionally unchecked, but they must still return
Promise-like or Observable-like validation results. Context-taking callbacks and the parameterized
configuration keep their checked return contracts. Explicitly annotated standalone callback
contexts still infer the value type. See
[Self-referencing validators](../guides/validation.md#self-referencing-validators).

### 🔸 Value type and inference {#value-type-and-inference}

An `asyncValidator()` declared separately has no consuming node from which TypeScript can infer
`TValue`. Without an explicit generic, `value()` is `unknown`; narrow it before use:

```ts
const usernameAvailable = asyncValidator(({ value }) => {
  const username = value(); // unknown

  return typeof username === 'string'
    ? checkUsername(username)
    : Promise.resolve(null);
});
```

Specify the exact value type when the validator is intended for a known node type:

```ts
const usernameAvailable = asyncValidator<string | null>(({ value }) => {
  const username = value(); // string | null

  return username ? checkUsername(username) : Promise.resolve(null);
});
```

The same rule applies to the parameterized signature: its first generic is the validated value,
and `params` provides inference for `TParams` from the snapshot it returns.

The optional `TApi` generic specializes the remaining `parent` and `path` properties. It does not
add an `api` member to the context. `TField` specializes the node and its API; omit helper generics
for inline inference. Without an exact node type, use `ctx.value()` for the typed value.

### 🔸 Callback signature {#callback-signature}

```ts
asyncValidator<TValue, TApi = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>(
  validate: (context: AsyncValidatorContext<TValue, TApi, ValidatorOwner<TField>>) => AsyncValidationResult,
  options?: AsyncValidatorOptions<TValue, TApi, ValidatorOwner<TField>>,
): AsyncValidator<TValue, TField>;
```

Signals read while `validate` runs become dependencies. A later change cancels the previous
execution and schedules validation again.

```ts
const tenantId = signal('public');

const usernameAvailable = asyncValidator(({ value, abortSignal }) => {
  return api.checkUsername({
    username: value(),
    tenantId: tenantId(),
  }, abortSignal).then(available =>
    available ? null : { kind: 'usernameTaken' },
  );
});
```

### 🔸 Parameterized signature {#parameterized-signature}

```ts
asyncValidator<TValue, TParams, TApi = AsyncValidatorApi<TValue>, TField extends AnyNode = AnyNode>({
  params,
  validate,
  debounce?,
  when?,
  onError?,
}): AsyncValidator<TValue, TField>;
```

`params` selects tracked inputs and `validate` receives the stable result. Signals read only
inside `validate` do not become dependencies.

```ts
const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: tenantId(),
  }),
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});
```

## ⚙️ Options {#options}

| Option | Accepted value | Available in | Purpose |
| --- | --- | --- | --- |
| [`debounce`](#async-validator-debounce-option) | number | Both | Delays each execution |
| [`when`](#async-validator-when-option) | reactive boolean callback | Both | Enables validation conditionally |
| [`onError`](#async-validator-onerror-option) | error-mapping callback | Both | Converts operation failures |
| [`params`](#async-validator-params-option) | reactive snapshot callback | Parameterized | Selects and names dependencies |
| [`validate`](#async-validator-validate-option) | async callback | Parameterized | Validates one params snapshot |

<div className="api-member-reference">

## ⚙️ Option reference {#option-reference}

### 🔸 Shared options {#shared-options}

#### ⏳ debounce {#async-validator-debounce-option}

**Signature:** `debounce?: number`

Delays execution by this many milliseconds. A new trigger cancels and restarts the complete delay.
The node reports `pending() === true` during both debounce and execution.

```ts
asyncValidator(
  ({ value, abortSignal }) => checkUsername(value(), abortSignal),
  { debounce: 300 },
);
```

The value must be a number of milliseconds. This option delays validation after a committed value
or another tracked dependency changes.

#### ⏳ when {#async-validator-when-option}

**Signature:** `when?: (context: AsyncValidatorBaseContext<TValue, TApi>) => boolean`

Reactively controls whether the validator is active. A false result cancels pending work and clears
this validator's current result. When it becomes true, validation is scheduled again.

```ts
asyncValidator(({ value, abortSignal }) => checkUsername(value(), abortSignal), {
  when: ({ value }) => (value()?.length ?? 0) >= 3,
});
```

The parameterized signature does not evaluate `params` while `when` is false.

#### 🚨 onError {#async-validator-onerror-option}

**Signature:** `onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi>) => ValidationResult`

Maps a rejected Promise, thrown error, or Observable error to an ordinary validation result.

```ts
asyncValidator(({ value }) => checkUsername(value()), {
  onError: () => ({
    kind: 'usernameCheckUnavailable',
    message: 'The username could not be checked. Try again later.',
  }),
});
```

Without `onError`, an operation failure contributes no validation error. Stale or destroyed
executions do not publish a mapped result.

### 🔸 Explicit parameters {#explicit-parameters}

#### ⏳ params {#async-validator-params-option}

**Signature:** `params: (context: AsyncValidatorBaseContext<TValue, TApi>) => TParams`

Reactively derives the snapshot passed to `validate`. Successive results are compared before work
restarts.

```ts
const location = signal({ city: 'Zurich', country: 'Switzerland' });

asyncValidator({
  params: ({ value }) => ({
    storeName: value(),
    city: location().city,
  }),
  validate: ({ params, abortSignal }) => api.checkStore(params, abortSignal),
});
```

Primitives use `Object.is()`. Objects and arrays are compared one level deep:

- a new object with equal first-level values does not restart validation;
- changing, adding, or removing a first-level value restarts it;
- nested objects and arrays are compared by reference, not recursively.

Include only values that should restart the request.

The signals read by `params` determine when Form Nodes reevaluates the snapshot. Angular signals
track the signal read, not an individual property of an object stored in that signal. The shallow
comparison then determines whether validation actually restarts:

```ts
const account = signal({ tenantId: 'public', theme: 'light' });

const usernameAvailable = asyncValidator({
  params: ({ value }) => ({
    username: value(),
    tenantId: account().tenantId,
  }),
  validate: ({ params, abortSignal }) => {
    return api.checkUsername(params, abortSignal);
  },
});

account.set({ tenantId: 'public', theme: 'dark' });
// `params` is reevaluated, but validation does not restart.

account.set({ tenantId: 'private', theme: 'dark' });
// `tenantId` changed, so stale work is cancelled and validation restarts.
```

Returning a fresh object is therefore safe: allocation alone does not trigger another request.

#### ⏳ validate {#async-validator-validate-option}

**Signature:** `validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi>) => AsyncValidationResult`

Validates one stable `params` snapshot. It runs untracked, so put every reactive request input in
`params`.

```ts
asyncValidator({
  params: ({ value }) => ({ username: value() }),
  validate: ({ params, abortSignal }) => {
    return api.isUsernameAvailable(params.username, abortSignal).then(available =>
      available ? null : { kind: 'usernameTaken' },
    );
  },
});
```

</div>

## 📖 Context reference {#context-reference}

Every callback receives state for the node being validated. `abortSignal` is added to validation
executions, and `params` only to parameterized `validate`.

| Member | Type | Available in |
| --- | --- | --- |
| [`value`](#async-validator-context-value) | `Signal<TValue>` | All callbacks |
| [`node`](#async-validator-context-node) | `Signal<TField>` | All callbacks |
| [`field`](#async-validator-context-field) | `Signal<TField>` | All callbacks |
| [`parent`](#async-validator-context-parent) | parent-node signal | All callbacks |
| [`path`](#async-validator-context-path) | path signal | All callbacks |
| [`abortSignal`](#async-validator-context-abortsignal) | `AbortSignal` | `validate` |
| [`params`](#async-validator-context-params) | `TParams` | Parameterized `validate` |

<div className="api-member-reference">

### 🔸 Node and navigation {#node-and-navigation}

#### ⏳ value {#async-validator-context-value}

**Signature:** `value: Signal<TValue>`

The current committed value. Call it as `value()`. Reading it in the callback signature creates a
dependency; reading it in `params` contributes to the derived snapshot.

```ts
asyncValidator(({ value }) => checkUsername(value()));
```

#### ⏳ node {#async-validator-context-node}

**Signature:** `node: Signal<TField>`

The readonly signal of the validated node, identical to `field`. Prefer this name when the owner
can be a form, group, or array. Both aliases retain the same inferred node type.
See [Inline node inference](../concepts/tree-and-api.md#inline-node-inference).

#### ⏳ field {#async-validator-context-field}

**Signature:** `field: Signal<TField>`

A stable readonly signal returning the validated node; never `null`. This is the exact same signal
as `node`. Inline primitive validators infer the concrete field, form, group, or array, including
aggregate children and array items. A separately declared validator defaults to the common node
API union; primitive-specific operations then require narrowing. Explicit `TField` context types
are preserved as `Signal<TField>`.

`context.field()` returns the node. Read its committed value with `context.value()`, which
preserves the inferred value type. Use `context.field().value()` when accessing it through the node. Reading only `field()` tracks node identity, which
stays stable across value changes and attachment or detachment. Read a returned node's value or
state signal when validation should depend on that state.
See [Navigation inside validators](../concepts/tree-and-api.md#navigation-inside-validators).

```ts
asyncValidator(({ field }) => auditNode(field()));
```

#### ⏳ node().api {#async-validator-context-api}

Access the node API through `ctx.node().api` or `ctx.field().api`. Its type follows the validated
node, so inline validators retain the concrete primitive API. There is no direct `ctx.api` property.
For ordinary state reads, use the node directly, such as `ctx.node().dirty()`.
See [API access](../concepts/tree-and-api.md#api-for-collisions-and-generic-code) for aliases and child-name collisions.

#### ⏳ node().form() {#async-validator-context-form}

Use `context.node().form()` (or `context.field().form()`) for the nearest explicit form workflow.
It returns `null` when no form owns the node. There is no flat `context.form` property.

#### ⏳ node().root() {#async-validator-context-root}

Use `context.node().root()` (or `context.field().root()`) for the complete structural root.
It never returns `null`. There is no flat `context.root` property.

#### ⏳ parent {#async-validator-context-parent}

**Default type:** Signal of a form, group, or array API, or `null`.

The direct parent, or `null` when the validated node is a root. A parent is always a form, group,
or array. Common node members are available directly; primitive-specific operations need narrowing.

```ts
asyncValidator(({ parent }) => parent() ? validateWithParent(parent()!) : Promise.resolve(null));
```

#### ⏳ path {#async-validator-context-path}

**Signature:** `path: Signal<readonly string[]>`

Property names and array indexes locating the node from its root. Array indexes are strings.

```ts
asyncValidator(({ path }) => auditPath(path()));
```

### 🔸 State {#state}

#### ⏳ state signals {#async-validator-context-state}

Read state through `ctx.node()` or its alias `ctx.field()`. These signals are not direct context
properties. The same access works in inline validators and reusable helpers.

| Signal | Meaning | Example read |
| --- | --- | --- |
| `ctx.node().submitting()` | The node or an ancestor form is submitting | `ctx.node().submitting()` |
| `ctx.node().touched()` | Interaction marked the node touched | `ctx.node().touched()` |
| `ctx.node().untouched()` | The node remains untouched | `ctx.node().untouched()` |
| `ctx.node().dirty()` | Modification was recorded | `ctx.node().dirty()` |
| `ctx.node().pristine()` | No modification was recorded | `ctx.node().pristine()` |
| `ctx.node().disabled()` | The node is excluded | `ctx.node().disabled()` |
| `ctx.node().enabled()` | The node participates normally | `ctx.node().enabled()` |
| `ctx.node().disabledReasons()` | Active disabling causes | `ctx.node().disabledReasons()` |
| `ctx.node().readonly()` | Consumers should prevent editing | `ctx.node().readonly()` |
| `ctx.node().writable()` | Consumers may permit editing | `ctx.node().writable()` |
| `ctx.node().hidden()` | Consumers should omit the node | `ctx.node().hidden()` |
| `ctx.node().visible()` | Consumers should display the node | `ctx.node().visible()` |
| `ctx.node().required()` | Current rules require a value | `ctx.node().required()` |

Reading state in `when`, the callback form, or `params` makes it a dependency.
Parameterized `validate` and `onError` can read the same state without tracking new dependencies.

### 🔸 Execution-only members {#execution-only-members}

#### ⏳ abortSignal {#async-validator-context-abortsignal}

**Signature:** `abortSignal: AbortSignal`

Belongs to one execution and aborts when it becomes stale, inactive, or destroyed. Pass it to
cancellable APIs:

```ts
asyncValidator(({ value, abortSignal }) => {
  return fetch(`/api/users/${encodeURIComponent(value())}`, { signal: abortSignal })
    .then(response => response.json())
    .then(result => result.available ? null : { kind: 'usernameTaken' });
});
```

Form Nodes discards stale results even when the underlying API ignores this signal.

#### ⏳ params {#async-validator-context-params}

**Signature:** `params: TParams`

The stable snapshot for this parameterized execution. It is absent from the callback signature,
`when`, and `onError`.

```ts
asyncValidator({
  params: ({ value }) => ({ username: value() }),
  validate: ({ params }) => checkUsername(params.username),
});
```

</div>

## 📝 Return value {#return-value}

Resolved results and `onError` results use the same defensive normalization as synchronous
validators: keep errors with a readable string `kind`, ignore malformed entries, and warn only
in development. Ignored results contribute no errors; pending state still finishes normally.
Strings become `{ kind: 'custom', message }`, including empty strings. Arrays can mix strings
and error objects. See [Returning messages](../guides/validation.md#returning-messages). This filtering does not invoke `onError` for malformed
results; that callback retains its existing exception/rejection handling. See
[Malformed validator results](../guides/validation.md#malformed-validator-results).

```ts
type AsyncValidationResult =
  | PromiseLike<ValidationResult>
  | ObservableLike<ValidationResult>;
```

| Resolved or emitted result | Effect |
| --- | --- |
| `null`, `undefined`, or `void` | Validation succeeds |
| `string` | Adds an error with `kind: 'custom'` and the returned message, including `''` |
| `{ kind, message?, ... }` | Adds one error |
| An array of strings and/or error objects | Adds several errors in returned order |

Observable-like values use their first emission and are then unsubscribed. RxJS Observables satisfy
the structural contract, but Form Nodes does not require RxJS.

`asyncValidator()` returns the marked validator function—not a node or a separate instance with
properties and methods. Add it directly to a `validators` source.

## 🔌 Execution lifecycle {#execution-lifecycle}

For mixed synchronous and asynchronous validators, initial setup is deferred until construction finishes, so guards and asynchronous
callbacks can safely reference a class form being declared. Reading errors or pending state performs
the initial setup immediately and schedules the asynchronous callback. Synchronous errors suppress
asynchronous execution. Later reactive changes retain their scheduled revalidation behavior.

### 🔸 Scheduling and status {#scheduling-and-status}

- Synchronous validators run first and block async validators while they have errors.
- `pending()` is true during debounce and execution.
- Pending without an existing error produces `validationStatus() === 'unknown'`.
- A completed error makes the node invalid while another async validator may remain pending.
- Results remain ordered by validator declaration, not completion time.

### 🔸 Dependencies and cancellation {#dependencies-and-cancellation}

- A dependency change cancels stale work and restarts the complete debounce.
- Simultaneous value, params, and `when` changes coalesce into one latest execution.
- A false `when` cancels work and clears this validator's result.
- Disabled, readonly, or hidden state cancels work; returning to interactive state restarts it.
- Destroying the lifecycle owner cancels delay and work.
- Stale Promise resolutions, Observable emissions, and mapped errors are ignored.

## 📐 Public types {#public-types}

| Type | Purpose |
| --- | --- |
| `AsyncValidator<TValue>` | Marked validator accepted by validator sources |
| `AsyncValidatorOptions<TValue, TApi>` | Callback-signature options |
| `ParameterizedAsyncValidatorConfig<TValue, TParams, TApi>` | Complete parameterized configuration |
| `ParameterizedAsyncValidatorOptions<TValue, TParams, TApi>` | Parameterized marker options |
| `AsyncValidatorBaseContext<TValue, TApi>` | Context shared by `params`, `when`, and `onError` |
| `AsyncValidatorContext<TValue, TApi>` | Callback context with `abortSignal` |
| `ParameterizedAsyncValidatorContext<TValue, TParams, TApi>` | Context with `abortSignal` and `params` |
| `AsyncValidationResult` | Promise-like or Observable-like validation operation |
| `ValidationResult` | Success, a message or error object, or an array of both |

See [Async validation](../guides/async-validation.md) for task-oriented examples and
[Advanced behavior](../advanced/behavior-details.md#asynchronous-scheduling-and-dependencies) for
additional scheduling and lifecycle semantics.


Separately declared `asyncValidator<TValue>()` helpers preserve `TValue` on the node returned by
`context.node()` and `context.field()`, including callable value reads and the node's value signal.
This also applies to `when`, `params`, and `onError` contexts. See the
[reusable validator example](./validator.md#value-type-and-inference).

### Self-referencing conditions

A parameterless `when` can reference its declaring form through a later computed without type
annotations. Its return is unchecked; return a boolean. Context-taking conditions retain their
typed context and boolean result. See [self-referencing conditions](../guides/validation.md#self-referencing-when-conditions).

Initial automatic evaluation of a configured `when` is deferred past synchronous construction.
Validation-state reads or explicit validation can start it earlier. Disabling the condition cancels
work and releases its dependency tracking; reenabling starts a fresh execution with current values.
