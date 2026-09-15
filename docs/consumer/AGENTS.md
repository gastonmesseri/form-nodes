# Using @ngblocks/form-nodes

This guide is for agents editing applications that consume Form Nodes. It is not the
contribution guide for the library itself. Follow the application's own conventions and
instructions when applying these library usage rules.

## Read the installed version first

- Read this package's `package.json` for its version and Angular peer dependencies.
- Use its `README.md`, `CHANGELOG.md`, and `types/ngblocks-form-nodes.d.ts` to check the API
  shipped with that version. Paths in this section are relative to the installed package.
- Import public APIs from `@ngblocks/form-nodes`. Do not import internal bundle paths or use
  underscore-prefixed runtime members.
- The documentation website describes current development and may be newer than the installed
  package. Check installed declarations before using an unfamiliar option or copying an example.
- Form Nodes has its own public API. Do not substitute Angular Reactive Forms or Angular Signal
  Forms method names, validator signatures, or reset semantics based on memory.

## Model and binding

- Use `form({ ... })` for the root, `field(...)` for leaves, and plain nested objects for ordinary
  groups. Use `group(...)` when the group needs its own validators or options.
- Use `array({ ... }, { initialValue: [...] })` for dynamic rows with independently managed
  children. Use `field([...])` when one control owns an entire array value, such as a multi-select.
  Use `field({ ... })` when an object is an atomic control value rather than a structural group.
- Declare models once, usually as component properties. Do not recreate them in template getters
  or reactive computations on every read.
- Read committed public values by calling nodes: `profile.username()` or `profile()`.
  Read state through signals such as `profile.valid()` and `profile.username.touched()`.
- Call operations directly, such as `profile.patch(...)`. Use `profile.$api` when a child name
  collides with an API member, or when writing generic node infrastructure.
- Fields are nullable by default. Choose explicit value types when inference cannot express the
  domain. `field<number>(null)` declares a nullable numeric field; `field(null)` infers unknown.
  Check the installed API for `field.strict()` or `createFormPrimitives({ nullable: false })`
  when non-nullable declarations are required.
- Bind controls with `[formNode]` and import `FormNodeDirective` in the component. Do not add
  `ngModel`, `formControl`, or `formControlName` to manage the same control binding.
- The model tree determines parent membership. A separate `field()` stays independent even if
  its control is rendered inside the same HTML form. No `standalone` registration option is needed.
- Use the integration guide for custom controls. `[formNode]` supports native controls and CVAs;
  `useFormNodeState()` can observe a control's active binding, including independently used
  Angular form directives. It is not a second model to synchronize manually.

## Writes, arrays, and reset

- Use `set()` for complete values and `update()` to derive a value from the current value.
  A form/group `patch()` updates only supplied properties. An omitted property is distinct from
  an explicit `undefined`; the latter is assigned when accepted by the field's value type.
- A supplied array in `patch()` replaces the collection like `set()`: its length and order
  determine the resulting rows. TypeScript requires complete item values. This also applies
  to arrays nested in a parent form/group patch.
- To edit selected properties of one existing object row, call `rows.at(index)?.patch(...)`.
  Do not send a one-element array patch expecting it to update only the first row.
- Use `push()`, `removeAt()`, and other array operations for structural edits. Without `trackBy`,
  replacement reuses rows by index. With `trackBy`, provide stable unique keys; duplicate keys fail.
- `null`, `undefined`, and `[]` clear an array on `set()` or `patch()`. They are not no-op patches.
  Validate external data instead of bypassing complete-value types with `any` or casts.
- `reset()` clears interaction state and pending input while retaining committed values.
  `reset(value)` also assigns the supplied values. `resetToInitial()` restores captured initial
  values. Do not assume Angular FormControl's reset behavior.
- Programmatic value writes do not automatically mark nodes dirty. Use the binding's interaction
  behavior, or explicitly call interaction operations when application behavior requires them.

## Validation, notifications, and submission

- Use exported validators with their actual signatures. For example, pass `required` directly;
  use `minLength(1)`, `maxLength(5)`, or `lengthBetween(1, 5)` for length constraints.
- Read validator input from the validator context's `value()` signal. Read reactive dependencies
  inside the validator execution so they can be tracked; do not capture stale values outside it.
- Consult the async-validation guide for trigger, pending, cancellation, and dependency behavior.
  Node construction and explicitly triggered validation can work without an Angular injector;
  DOM binding and injector-dependent integrations have their own requirements.
- `onValueChange` observes committed changes from both programmatic writes and control edits.
  Do not interpret it as a user-only event or invent an `origin` argument.
- Debounced control input may commit later. Avoid assuming that a flag around `writeValue()`
  can identify every later callback; consult the value-flow and custom-control guides when
  integrating a CVA, and test external writes as well as user edits.
- Configure the form's `onSubmit` and use `submit()` or the documented native-form binding.
  Follow its validation and submission outcomes rather than implementing a parallel lifecycle.

## Verify the consuming application

Use the application's package manager and existing build, type-check, and test scripts. Check
Angular templates as well as TypeScript. Test the observable behavior being changed: initial and
loaded values, user edits, errors, pending validation, array growth/removal, and reset where relevant.
Do not assume that the library repository's development commands exist in a consuming project.

## Documentation by task

- [First form](https://form-nodes.js.org/getting-started/first-form)
- [Public API](https://form-nodes.js.org/reference/api-overview)
- [Values and state](https://form-nodes.js.org/concepts/values-and-state)
- [Dynamic arrays](https://form-nodes.js.org/guides/dynamic-arrays)
- [Control binding](https://form-nodes.js.org/reference/form-node-binding)
- [Custom controls](https://form-nodes.js.org/guides/custom-controls)
- [Control state](https://form-nodes.js.org/reference/form-node-state)
- [Value flow](https://form-nodes.js.org/guides/value-flow)
- [Async validation](https://form-nodes.js.org/guides/async-validation)
- [Submission](https://form-nodes.js.org/guides/submission)
