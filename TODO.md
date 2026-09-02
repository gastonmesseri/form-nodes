# TODO

## Up next

- Decide the exact semantics and naming of object-node ancestry lookups.
  - Re-evaluate whether `node.form()` should return the nearest `form()` ancestor, which would make
    an explicit nested form the workflow owner observed by all of its descendants.
  - Consider adding a separate `root()` or `rootForm()` signal for retrieving the actual root of the
    complete node tree instead of overloading `form()` with both workflow ownership and root lookup.
  - Define whether `root()` returns any root node (`Field`, `Group`, `Form`, or `ArrayNode`) while
    `rootForm()` returns only a `Form | null`, and choose names that remain clear in IntelliSense.
  - Specify behavior for a root `group()`, a standalone field or array, nested explicit forms,
    groups inside arrays, detached array items, and nodes that are reparented at runtime.
  - Review validator contexts, public root-type inference, async dependency tracking, submission
    inheritance, documentation, and migration impact before changing the current behavior.
- website docs
  - add some sort of modifiable example (maybe open external web or something, like in some docs) to allow user
    to interact with the example
  - add playground to play with states, and etc, and with the code
  - check what font-size would be ideal for the code examples
  - check what colors for documentation are the most recognize as good by people
  - [x] try to color the template: in the components declaration
  - [x] change color of code, i don't like it, maybe use something like in vscode (check vt-theme)
  - explain that the primitives like field() are really like a normal signal() conceptually (like the ones you bind to ngModel), but in this case it has more features than a normal signal.
    e.g. myField = field(); myField() para tomar valor; myField.set() para definir valor, como una signal
- Consider including dynamic controls in form() (like in reactive forms)
  - update docs if required, check all docs
  - myForm.add('age', field(2)); // or myForm.add({ age: field(2) })
  - handle typing properly for this // probably form() and group() should allow dynamic string keys (and make it safe through proxy?, or maybe just ensure that if any non known key is accessed, then only return it as undefined, similar to array() with an index)
- provideFormNodeControl, maybe is not even needed having into account that getDebugNode is safe to use
- Create adapter to be able to use angular [formField] with the library: myForm.name.$field, <my-control [formField]="myForm.name.$field">
- Create isNil helper
- The injector, could also be taken from the formNode directive (maybe directly from the directive, or from getDebugNode) and use it inside the form() field(), etc. as a fallback in case the
  user doesn't provide an injector
- Create something like the "params" concept of asyncvalidators also in the normal synchronous validators (only executed when shallow comparison is false)
- en maxDate, minDate, dateBetween, add shortcuts como 'today' en string
- Check if debounce in asyncValidators also should include the 'blur' value
- Consider changing the @example to something different, like a heading with asterisks **Like this**
 
- Think about how to better structure project folders given current knowledge and existing files
- [IMPORTANT]: decide watch patch does in an array, and also what does the patch does in an array if called from a parent form()
- Validator framework roadmap (implement in this order)
  - Check TODO_VALIDATORS.md file to include more builtin validators
- Public api
  - Consider exporting types with some sort of prefix like NgValidator GemFormsValidator (or something similar)
- Validators
  - Check how 1 validator maybe can set errors in several Nodes (remind of lab case)
    - Also handle cases like in lab, like addErrors, and those
  - Check what model of errors() other libraries return, and decide for the best system
  - Consider allowing defining a asyncValidator without asyncValidator function:
    e.g.
    field('Marco', {
      validators: [
        required,
        {
          type: 'async', // maybe this would be a good marker to wrap later with asyncValidator() helper
          params: ctx => ..., // optional params definition // maybe also useful for synchronous validators (the params i mean)
          validate: ctx => ...,
          debounce: 300,
        }
      ],
    })
- Shortcuts for signature
  - Consider shortcut for simple array template (just an array with 1 object [forced through type] (maybe 2 objects?)) [detectable through Array.isArray()]
    // maybe not a good idea because it is ambiguous whether it should start with 1 item (the one in the template) or 0 items (probably not)
    form({
      houses: [{
        city: field(''),
        country: field(''),
      }],
    })
  - Consider shortcut for simple primitives [detectable through typeof === number/string/boolean/null/undefined]
    form({
      age: 23, // same as "age: field<number>(23)"
      name: 'Marco',
      partner: null as string | null,
      friend: field<string>(),
    })
- directive
  - allow alternative predefined names for directive
  - allow dynamic name for directive (in case is possible for example creating a form)
    . e.g. providers: [FormNode.withName('myCustomDirectiveName')]
  - Consider deliberately extending native `min`/`max` propagation beyond Angular 22 Signal Forms to `input[type=time]`, `input[type=week]`, and `input[type=datetime-local]`, which support those constraints in the HTML standard.
    - Design the native serialization for `Date`, number, and string constraints before implementing it (`HH:mm[:ss]`, `YYYY-Www`, and local date-time strings without a time-zone offset).
    - Define the time-zone semantics for `datetime-local` and avoid implicit `Date.toString()` conversion.
    - Ensure the constraint representation agrees with the value representation supported by each native control.
    - Cover browser validity, SSR, hydration, reset, rebinding, and clearing inactive constraints.
    - Document this as a deliberate improvement over Angular 22.1.4, whose native propagation currently covers only `number`, `range`, `date`, and `month`.
  - Allow hooking to existing angular apis
    - Add other Angular interoperability mechanisms if they become relevant
  - Decide whether host attributes or inputs such as `[disabled]` should also update the node; node-to-control state synchronization is already implemented.
  - Ensure whether we need to have angular forms as package dependency, or we can create an abstraction like we did with isObservableLike....
  - Make the directive sync disabled/readonly/required attributes like in angular signal forms 22.
    - maybe there are more attributes synced, check in angular implementation
    - (from angular docs) The [formField] directive also syncs field state for attributes like required, disabled, and readonly when appropriate.
    - Have into account that a custom component can have an input called [disabled] and maybe this should be also used? (or maybe not and it should be implemented explicitly in the custom control component)
    - It seems my implementation already binds from formNode to the attributes, but probably is also reasonable to bind from the attributes (or other inputs like [disabled] in the component) to the node
- Ensure that the library performs tree-shaking (e.g. not used validators ) [I THINK I ALREADY HANDLED THIS IN SOME COMMIT]
- Investigate how other angular libraries perform versioning,
  - e.g. do they use the version name as the same as angular current version?
  - do they support previous versions?
- Ensure that disabledReasons also doesn't fail when it references self form root, when it is declared with a reactive function
- Consider nesting disabledReasons in myForm.myField.disabled.reasons();
- Make our required() handling to be compatible with angular material (ensure angular material detects our required() handling to display the required mark)
  - maybe other ones that are not required, min(), max(), etc
- Add precise instructions on how to use the library (e.g. angular imports, etc)
- Expose restoreDefaultValidatorMessages() function in the public api
- Add playground to the website, with simple example or something like that
- Consider @gemgular/forms name for library
- Add good docs about implementing a custom control (support for focus, etc, angular CVA, form value accessor, etc)
- Create useFormNode() utility (or inject(FormNode)) to allow a custom component to access easily the formNode or even better to access some sort of signal based api that allows handling
  both formNode and formField (access formNode or formField state, or even formControl), something useful for the consumer and generic. So that inside the component it can for example
  access the errors() or something like that
- Add very descriptive intellisense for every property in public api, (options, calls, etc, properties)
- Ensure that disabled input on a custom component, works better than in reactive forms (message in console that it displays)
  - Although maybe it could have some collision with the new angular way of defining custom controls (for example, now disabled is passed as an input, and i suppose that the form() disabled will be there). Think about that.
- also add other missing properties besides of keyInParent (disabledReasons, etc)
- Think about what is a good name to use in the examples for the form instance
  - e.g.
  form = form({ 
    name: field(''),
    age: field(23),
  });
  // later in the template <input type="text" [formNode]="form.name">
  // 'form' is good for the instance? maybe formModel, maybe myForm? maybe personForm?

- Check if the submission state, has to be explicitly coming from <form [formNode]="myForm">
  Maybe just binding a nested field with [formNode] could automatically detect the parent form (maybe not)
- Consider hiding from the node the controlValue and setControlValue properties, and maybe just exposing them in the ".api" to avoid cluttering for the consumer
  - controlValue and setControlValue feel more like an internal thing
  - also maybe hide disabledReasons
- maybe add "novalidate" html property by default to the parent form of the fields? (maybe not)
- Allow creating a framework with predefined options (e.g. by default form() array() or field() has { nullable: true })
- code style: funciones "export const" "const" que devuelven algo directamente, hacer que abran brackets
- Implement shorthand for required in the field options similar to disbled
- initial value should be null or undefined? (for field())
  - and for array?
- Rename to something generic like @ng-tools/forms (maybe)
- In the future allow something like dynamic forms from a JSON or object definition
  - Schema-driven form generation from JSON definitions.
- Allow always myForm.$api in form()/group() in case the user wants to declare de property api (always user priority)
- Runtime addition or removal of form nodes.
- Consider allowing validator function returning false/true (for shorthands)
- Try to simplify the "markers" concept, probably not needed that overengineering
- Consider allowing optionally a schemaFunction (like in angular 22 signal forms)
  - maybe better a init: () => void, in the form() options
- Maybe, allow the components implementing it, to define errors inside the component into the field() (maybe, like the invalid date in the VtInputDateComponent)
- Make components easily hookable to the formField (of this library, e.g. to display errors, or display required, etc, nice custom component implementation api)
- Add isNil utility, and check all cases where it is applicable, (checking for x === null || x ===undefined)
- Restructure project folder structure, once project is solid and stable. think how to organize folders
- Create repo to pass custom lintern rules in dlab
- Allow defining global options
  - example: createFormUtils({ ... globaloptionshere }) // Returns { form, field, array, group, etc... }
- Add support for validators defined by string (e.g. 'required|minLength:2') [like in vue]
  - this would break treeshaking
  - If possible, typed strings
- Check with chatgpt, how to improve as max as possible a nice package.json metadata for this project
- Exponer un helper para obtener el valor del form(), e.g. (type MyFormValue = FormValue<typeof myFormInstance>) (or FormNodeValue<typeof myFormInstance>)
- Due to typescript limitations, try providing something similar to signal forms schemaPath api,
  so that in another callback, we can set validators properly typed or something like that.
  - e.g.
  profile.address.city.setValidators([
    asyncValidator<
      string | null,
      typeof profile.address.city.api
    >(async ({ api }) => {
      const root = api.form(); // typeof profile | null
  
      root?.name.set('Daniel');
      return null;
    }),
  ]);
- Consider an alternative name for ".api"
- Pick ideas from other form libraries (e.g. veevalidate, or other react, angular libraries)
- Add debounce to synchronous validators, probably also with a factory function validator(() => ...)
- TRY TO MAKE ASYNC VALIDATORS ALSO BEING THE RESULT OF A COMPOSABLE VALIDATION FUNCTION.
  - at the moment this is not possible.
- Consider cleaning the form() array() field() files, (maybe a class?)
- Also consider exporting the main functions with the following names: ngForm, ngField, ngArray
- In the framework, provide also a component (create and export an angular component) to display the validation errors
  - max validation errors
  - color, color by type
  - maybe consider also simply component to put below the html field, and then display things like warnings, errors, or disableReasons
- In the same sense that required() was implmeented to potentially notify custom components that the required validator has been configured, also do 
  with min() max() to notify custom components that there is a min/max validator defined (e.g. maybe a number input would allow writing or clicking arrows for more than max, or something like that)
- Check angular docs to check metadata implementation etc, and more stuff:
  - https://angular.dev/guide/forms/signals/form-logic?utm_source=chatgpt.com
- Check what is the minimum Typescript version needed for the package (it uses NoInfer for example), and therefore check what minimum angular version is supported
- Check OTHER LIBRARIES, to see how can i improve the api, adding more useful features, etc
- To make it safe to use (similar to what we did with self-referencing root in validators), ensure
  that disabled, readonly, etc, also allow referencing safely something that hasn't been created yet
  (e.g. referencing a signal that is at the bottom of the file [through a function]).
- Consider imports interface like the following:
  import { form } from 'wherever';

  const myForm = form({
    name: form.field('Mark');
    age: form.field(23),
    houses: form.array({
      city: form.field('Madrid'),
      country: form.field('Spain'),
    }),
  });
- Consider nullable api like this:
  const name = field.nullable('Mark');
  const age = field.nullable(23),
- Consider the following (changing submission api):
  // Try to simplify the following. instead of submission.action, maybe just allow a callback onSubmit, and onInvalidSubmit to allow easier api
  // Same in case it has more options inside submission
  const profile = form({
    name: field('', [required]),
  }, {
    submission: {
      action: async (_form, value) => saveProfile(value),
      onInvalid: () => showValidationMessage(),
    },
  });

  const submitted = await profile.submit();
- Add ESLINt with vt rules

Debounce más general
Nosotros admitimos milisegundos en field(). Angular permite debouncers asíncronos cancelables, herencia desde ancestros y estrategias como blur. Nuestra implementación ya cancela timers correctamente, pero es menos expresiva.

Forma pública de controlValue
Angular expone un WritableSignal; nosotros un Signal readonly más setControlValue(). Es una diferencia deliberada de API y prefiero nuestra versión porque distingue claramente el origen del cambio:
field.set(value);             // aplicación
field.setControlValue(value); // control

Nodos eliminados
Nosotros convertimos un nodo eliminado en un nodo raíz independiente y utilizable. Angular lo considera orphan. Hay que decidir qué comportamiento resulta más útil.

Tracking estructural desde el modelo
Angular crea y elimina nodos automáticamente según el array almacenado en el signal. Nosotros usamos template/factory y métodos estructurales. Es una diferencia arquitectónica deliberada que no intentaría eliminar.

## Angular upgrade checklist

Run this checklist for every Angular update. Keep it in `TODO.md` permanently and reset its checkboxes for the next update.

- Release baseline and public API
  - [ ] Resolve the latest maintenance release or tag for every supported Angular major; record the inspected tag, commit, source paths, and relevant test paths.
  - [ ] Read the Angular release notes, changelog, deprecations, breaking changes, migrations, supported public API policy, and Signal Forms documentation for the complete version interval being adopted.
  - [ ] Compare the exported `@angular/core` and `@angular/forms` public types used by the library, including `Signal`, `InputSignal`, `ModelSignal`, `ComponentRef`, `ControlValueAccessor`, `NgControl`, validator tokens, reflection, debug-node, and rendering APIs.
  - [ ] Re-check whether `mySignal[ɵSIGNAL]`, `ɵInputSignalNode`, and `applyValueToInputSignal()` still exist and whether their runtime and type shapes changed.
  - [ ] Re-check whether a public replacement now exists, such as supported access to the host component's `ComponentRef.setInput()` or a dedicated Signal Forms interoperability protocol.
  - [ ] Keep the private signal-input adapter isolated; do not expand `ɵSIGNAL` usage while no public replacement exists.
- Angular Signal Forms behavioral parity
  - [ ] Inspect the latest Signal Forms implementation and tests rather than relying only on documentation or previous-version behavior.
  - [ ] Compare node creation, parent/root ownership, paths and keys, removed/orphan nodes, array identity and reconciliation, and structural model changes.
  - [ ] Compare committed value and control-value flow, programmatic versus control-originated writes, equality rules, reset semantics, and debounce inheritance, blur behavior, cancellation, and flushing.
  - [ ] Compare touched, dirty, hidden, readonly, disabled reasons, required state, interaction propagation, and which ancestors or descendants each operation affects.
  - [ ] Compare synchronous and asynchronous validation, laziness and reactive dependencies, pending propagation, cancellation and stale results, error ownership and aggregation, validator metadata, and native constraint metadata.
  - [ ] Compare submission, invalid submission, concurrent submission, submitted/submitting state, native submit/reset events, focus behavior, and disabled or hidden descendants.
  - [ ] Re-audit every intentional difference recorded in `docs/behavior.md`; update, remove, or add differences and regression tests as Angular changes.
- `[formNode]` and control interoperability
  - [ ] Compare Angular `FormField`, form-root binding, binding selection, pass-through wrappers, the control-creation hook, directive exports, and supported host elements.
  - [ ] Verify native `input`, `select`, `textarea`, checkbox, radio, multi-select, number, range, date, month, time, week, and datetime-local value parsing and serialization.
  - [ ] Verify native `required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, disabled, readonly, name, accessibility, validity, parse-error, focus, and event synchronization.
  - [ ] Verify signal controls using `model()` or input/output pairs, `value` versus `checked`, input aliases and transforms, optional state inputs, reset and touch hooks, explicit `provideFormNodeControl()`, and node pass-through.
  - [ ] Verify `ControlValueAccessor`, accessor precedence, `NgControl`, synchronous `NG_VALIDATORS`, disabled propagation, touch/change callbacks, and custom-control focus behavior.
  - [ ] Verify multiple bindings to one node, binding-owned errors, rebinding, destruction cleanup, DOM-order focus, and preservation of node-owned debounce work.
  - [ ] Re-check whether `getDebugNode()` and `reflectComponentType()` remain public, stable, sufficient for discovery, and unchanged in the information they expose.
- Angular runtime and rendering environments
  - [ ] Verify creation and synchronous behavior outside an injection context, explicit asynchronous validation outside DI, injector ownership, `DestroyRef` cleanup, weak ownership, and garbage-collection assumptions.
  - [ ] Verify zone-based and zoneless change detection, OnPush controls, effect scheduling, signal dependency tracking, and absence of expression-changed errors.
  - [ ] Verify JIT, partial AOT compilation, full-AOT consumer fixtures, Angular template type checking, server rendering, hydration, event replay when applicable, and browser-only observers.
  - [ ] Verify CSP nonce handling, Shadow DOM, document cleanup, server globals, and platform guards used by native validity observation.
- Packaging and supported toolchain
  - [ ] Review Angular's supported Node.js, TypeScript, RxJS, Zone.js, compiler, CLI, and `ng-packagr` ranges and update the development matrix without unnecessarily constraining consumers.
  - [ ] Verify Angular Package Format output, partial compilation, ESM exports, side-effect metadata, tree shaking, declaration bundling, and installation as a real package consumer.
  - [ ] Review peer dependencies and confirm every advertised Angular range is actually covered by the build, type, template, server, and browser matrix; do not force unsupported peer ranges.
- Required verification and documentation
  - [ ] Run lint, public type tests, template compilation, package-consumer tests, unit and coverage tests, AOT, SSR, hydration, OnPush, and real-browser tests with nonzero expected test counts.
  - [ ] Add focused regression tests for every detected Angular change and for every private compatibility assumption retained by the library.
  - [ ] Update the compatibility table, installation requirements, changelog, migration guide, consumer website, and `docs/behavior.md` only after the supported matrix passes.
  - [ ] Record commands, versions, inspected Angular sources, intentional differences, failures, and any unverified scope in the upgrade handoff.

## Later

- Reconsider whether `array()` should expose `patch()`; its positional semantics may be confusing and the same updates can be expressed explicitly through item nodes or other array operations.

## Ideas

-

## Pending decisions

-

## Bugs

- [ ]

## Discarded
- discarded - implement debounce for synchronous validators

## Completed

- [x] Audit every public options and source parameter from the consumer's IntelliSense perspective.
  - Inline small call-site shapes such as `markAsTouched()` and both `asyncValidator()` overloads.
  - Keep named types for reusable concepts such as node options, validator sources, message catalogs, and async configurations.
  - Expose small accepted unions directly in node and built-in-validator options and clarify which callback sources are reactive.
  - Remove the redundant `RequiredOptions` alias while retaining reusable `ValidatorOptions`.
- [x] Audit `readonly` across consumer-supplied option and configuration objects.
  - Keep options, submission configuration, validator-message catalogs, async configuration, and binding-class configuration mutable in the public type system.
  - Retain readonly state and result objects owned by the library.
- [x] Allow built-in validators to accept a static message string directly when the signature is unambiguous.
  - Preserve the options object for reactive messages and date parsing configuration.
  - Preserve `uniqueItems('property')` as the property key-selector shorthand; use an options object for a no-key-selector message or pass the message after a key selector.

- [x] Add `mapObjectValues(object, mapper)` for value transformations that preserve an object's keys.
  - Use it for object-node normalization and recursive node-definition cloning.
  - Keep `arrayToObject()` for transformations whose source is genuinely an array and whose mapper
    derives each output key.
- [x] Add a general `arrayToObject(items, mapper)` utility and replace the existing
  `Object.fromEntries(array.map(...))` patterns.
  - The mapper receives the item, index, and readonly source array and returns a key/value tuple.
  - Property keys preserve their inferred string, number, or symbol union.
  - Duplicate keys deliberately follow `Object.fromEntries()` semantics: the last value wins.
- [x] Introduce `group()` as the default fixed-object aggregate while reserving `form()` for a submission/workflow boundary.
  - Research found Angular Reactive Forms reuses `FormGroup`, Angular 22 Signal Forms separates its uniform `FieldTree` from `FormRoot`, path-based libraries avoid nested form instances, and TanStack uses groups beneath a submission-owning form.
  - `group()` is a fixed, non-null object node with children, aggregate value/state, validators, inherited configuration, updates, reset, and common node operations.
  - `group()` omits `submission` and `submit()` while inheriting `submitting()` from an ancestor workflow.
  - `form()` remains the explicit workflow boundary and the only node accepted by native `<form [formNode]>`.
  - Plain nested objects and object templates inside `array()` normalize to `group()`; explicit nested `form()` remains available for independent subflows.
  - Both primitives share the same internal object-node engine, with capability-specific public types and runtime surfaces.
  - The inference decision is recorded in behavior docs, website reference, the development changelog, and type tests. No consumer migration entry is needed before the first publication.
- [x] Consolidate root-level `integration-tests`, `type-tests`, and `testing` infrastructure under `tests/integration`, `tests/types`, and `tests/helpers`.
- [x] Determine whether accessing `mySignal[ɵSIGNAL]` is a supported Angular API.
  - It is exported from `@angular/core`, but Angular explicitly excludes every `ɵ`-prefixed symbol from its supported public API and compatibility guarantees.
  - Keep the current `ɵSIGNAL`/`ɵInputSignalNode` adapter isolated and covered by AOT, SSR, hydration, OnPush, and browser tests until Angular provides a public host-component input-writing mechanism.
- [x] Infer `field(null)` as `Field<unknown>` instead of `Field<null>`, while preserving explicit generic inference such as `field<string>(null)` as `Field<string | null>`.
- [x] Complete the consumer website documentation roadmap.
  - [x] Create an API overview page that maps common needs to the relevant public APIs.
  - [x] Add a Common mistakes page with incorrect and corrected examples.
  - [x] Add a Troubleshooting page organized around symptoms and concrete solutions.
  - [x] Add a configuration reference covering scopes, reactivity, precedence, inheritance, and providers.
  - [x] Add a consumer testing guide for nodes, validators, arrays, bindings, and submission.
  - [x] Improve navigation within long reference pages with summaries and on-page API maps.
  - [x] Add complete Angular Material and PrimeNG integration examples.
  - [x] Convert more behavior-defining documentation examples into executable, type-checked examples.
  - [x] Add a form-modeling patterns guide for common domain and UI design decisions.
  - [x] Add an interactive playground for values, state, validation, debounce, and arrays.
  - [x] Add versioning, Angular compatibility, changelog, and migration documentation.
- [x] Verify consumer tree shaking removes validators and default messages that are not imported.
- Implement ESLint
- Document every built-in validator and structured built-in error for IntelliSense.
- Add an extensible validation error registry and strongly typed `getError(kind)` overloads.
- Include the rejected `actual` measurement or value in applicable built-in validation errors.
- Implement `minWords()` and `maxWords()` with deterministic Unicode word counting.
- Implement the `oneOf()` validator with static or reactive allowed values.
- Add centralized default messages and common custom-message options to the built-in validators.
- <!> important. Consider including hidden access to .api that is not .api, (maybe $api, or _api) because user defined properties could collide with it
  and then the form() framework will not work because it uses it on the internal system
- Allow `array()` `trackBy` to accept a typed string property name in addition to a callback.
- Document the `array()` template and factory first parameter in IntelliSense, including cloning semantics, fresh-definition requirements, and examples.
- Decide and document nullable `array()` input behavior: normalize `null` and `undefined` container values to an empty array while keeping the observable value structurally non-null.
- Add `swap()` to `array()` and document the structural reordering operations for IntelliSense.
- Add `moveUp()` and `moveDown()` convenience operations to `array()` while preserving node identity and state.
- Complete the observable `[formNode]` comparison against Angular Signal Forms 22.1.4, including native controls, custom controls, pass-through wrappers, binding state, control debounce, SSR, hydration, AOT, and real-browser behavior; retain documented differences where Angular relies on private or binding-name-specific compiler support.
- Expose readonly `controlValue()` on forms and arrays without aggregating pending descendant buffers, including independent debounce for controls bound directly to aggregate nodes.
- Implement `getError()` on every node.
- Pass value, node API, path, parent, and root form context to validators.
- Allow validator functions to return an error object or `undefined`.
- Make `array()` nodes iterable so Angular `@for` can iterate their child nodes directly.
- Choose `[formNode]` as the node-binding directive name.
- Bind aggregate forms to native `<form [formNode]="form">` elements.
- Support Angular `ControlValueAccessor` custom controls and expose compatible `NgControl` integration.
- Automatically support Angular `FormValueControl` and `FormCheckboxControl`, retaining `provideFormNodeControl()` as the explicit fallback.
- Synchronize applicable native and signal-control state such as disabled, readonly, required, invalid, touched, and dirty.
- Document the supported custom-control integration paths.
- Reach and enforce high test coverage, including dedicated type, template, package-consumer, browser, SSR, AOT, and hydration tests.
- Investigate and implement the distinction between `value()` and `controlValue()` for control-originated debounce.
- Implement form submission state and native form submission integration.
- Implement `update()` for field, form, and array nodes.
- Implement `allErrors()` for own and descendant error aggregation while keeping `errors()` scoped to the current node.
- Add Promise-based asynchronous validators with cancellation, debounce, pending state, and parent propagation.
- Allow shorthand objects instead of explicit nested `form()` calls.
- Store a parent node reference instead of manually propagating disabled and readonly state.
- Distinguish signal properties from action methods in IntelliSense declarations.
- Allow booleans, signals, and reactive functions for disabled, readonly, and hidden state.
- Consider by default should be FieldType | null?
  - Should allow field<string>(null) ?
- Consider making the validators array second parameter optional, and allow optionally an overload to directly set the options.
- Consider allowing in form()/group() that the api is also exposed in the root (not only in api property)
  but giving priority in types and also in runtime to the user defined properties during the form({}) call.
  - also considering exposing as prefixed with $disabled() $markAsTouched (with dolar prefix)
- Implement shortcut for required in field() form() para saber si es required o no, tomando en cuenta el validador por defecto con ese kind
- Make Nodes have some property to recognize if it is a root of the tree
- Implement debounce for the field value.
- rename variable name internalApi (i think it is not internal, but actually external exposed)
- Separate types in validation.type, (e.g. observableLike should probably has its own file)
- [x] Make validators reactive by default through automatic signal dependency tracking.
  - [x] Revalidate built-in validators when the validated node value changes.
  - [x] Treat plain value snapshots as intentionally static; use a signal-reading function for reactive constraints.
  - [x] Do not add `reactive: false`; validators only track signals they actually read, while parameterized asynchronous validators provide explicit dependency control.
- Allow `validators` to be a reactive function that returns validators conditionally.
- In form() (or group()), allow also exposing all the .api properties, but giving priority to userDefined fields. 
  - Also provide a property called "controls" (or "fields") that contains only the sub-fields
- Array
  - Dynamic array primitives.
  - in documentation (and in tests) ensure that passing a field directly is documented ( e.g. array([], field('Marco')) )
  - Ensure signature allow [template/factory, initialValue, validators, options] and [template/factory, initialValue, options]
  - Ensure that setting form.set({ myArray: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }] }) works properly and not weird behavior
    - It should propagate the value properly
    - It should create new nodes if needed
    - It should delete nodes if needed
    -<i> This is not possible in FormArray of reactive forms
  - Considerar si es mejor pasar el valor inicial (o numero) en el primer parametro de array() o en el segundo.
    - maybe better in the second, so that it is optional, and initial value is empty array []
  - Being accesible by myFormArray[0] // index
  - implement map/filter etc methods, possibly implementing being an array by itself, all methods (without collision) [MAYBE NOT NEEDED, that is on the value, MAYBE YES NEEDED TO ITERATE THE FIELDS AND NOT THE VALUES]
- migrar @input a input()
- migrar @hostlistener a host: { ... }
- Remove unnecessary explicit `void` return annotations and discarded-Promise `void` expressions.
- quitar unnecessary readonly de members
- Add keyInParent property to nodes
- Validator framework roadmap
  - [x] Add strongly typed built-in validation errors so `getError(kind)` exposes each error's structured properties in IntelliSense, while retaining an extensible fallback for custom error kinds.
  - [x] Improve every built-in validator's JSDoc with examples, empty-value behavior, reactive constraint semantics, custom-message options, and exact error shapes.
  - [x] Add a `validator()` authoring helper so reusable custom validators infer their context and validate their result without manually annotating the callback signature; only the value model generic is required for a standalone declaration.
  - [x] Support reactive custom validator messages, comparable to Angular 22 Signal Forms, while preserving static strings as the simplest option.
  - [x] Allow applications to customize or internationalize the centralized default validator messages reactively, both inside and outside Angular dependency injection.
    - [x] Record a consumer-oriented internationalization guide covering global, provider, form/array, and validator-local configuration for reuse by the future documentation website.
  - [x] Keep using the general `minLength()` and `maxLength()` validators for arrays instead of adding redundant `arrayMinLength()` and `arrayMaxLength()` variants.
  - [x] Do not add `arrayMinMaxLength()` for now; composing `minLength()` and `maxLength()` preserves individual error details and avoids another error shape.
  - [x] Keep individual validator exports instead of adding a `vtValidators` namespace object, preserving straightforward imports and tree shaking.
  - [x] Consider what other common use validators could be useful by checking other libraries (any framekwork)
    - [x] Add `url()` for absolute WHATWG URLs, keeping HTTP-only validation as a possible separate validator.
    - [x] Add `integer()` using JavaScript's safe-integer range.
    - [x] Add reactive `equalTo()` for confirmation and cross-field equality without exposing compared values in errors.
    - [x] Add `uniqueItems()` for arrays with identity, property-name, and reactive function key selectors.
    - [x] Add inclusive `between()` with reactive numeric bounds and native constraint metadata.
    - [x] Add inclusive `dateBetween()` with parsed reactive date bounds and native constraint metadata.
  - [x] Consider changing 'kind' to 'type' in validators
  - [x] Implement basic validators (get from lab)
    - [x] Review required overload and make it work like in lab
  - [x] discarded - value probably is simpler to make it directly the value, and not a signal() wrapping the value
  - [x] Each validator should have a very descriptive behavior in is JSDoc
  - Improve validators model, similar to Angular 22 signal forms, but also allow referencing other fields, and also de form tree (as arguments)
  - [x] Export `validator()` for users to define validator functions without manually specifying the callback signature.
    - [x] Make this the recommended way to create a custom validator in a separate file where node-level contextual inference is unavailable.
      - [x] Accept the value model as a generic for `field()`, `array()`, or `form()` validators.
  - [x] Inline built-in validator option objects so `message` and date `parseAs` choices are visible directly at each call site.
  - [x] required should notify that it doesn't validate empty arrays (i think this is angular 22 signal forms behavior. in case is not, then it is not a good example)
- directive
  - [x] Ensure that directive public api (in case it is referenced from the tempalte with #myFormNode), is nicely typed and useful, and hides non-public properties/methods
- [x] Add reactive internationalization support for built-in validator messages. See `docs/validator-messages.md`.
