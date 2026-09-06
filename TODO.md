## Up next

- [ ] website docs
  - [ ] add some sort of modifiable example (maybe open external web or something, like in some docs) to allow user
    to interact with the example
  - [ ] add playground to play with states, and etc, and with the code
  - [ ] check what font-size would be ideal for the code examples
  - [ ] check what colors for documentation are the most recognize as good by people
  - [x] try to color the template: in the components declaration
  - [x] change color of code, i don't like it, maybe use something like in vscode (check vt-theme)

- [ ] Maybe: Consider that in the validators ctx.node() and ctx.field() to hide some members that we are sure that they are going to create circular infinite loop

- [ ] The errors array, maybe should be a computed with a shallow check? (can we improve some other signals with a shallow check? perform an audit) (will this improve reactivity? what is the cost?)

- [ ] Request to suggest tests folders organization (including also tests in src/**/*)

- remove primitive-state-refactor.md file once finished

- the folder metadata can probably just be a metadata.ts with metadata.spec.ts inside primitives/utils (put create-node-metadata.ts code inside metadta.ts)

- [ ] create-form-primitives doesn't have a test file? should it?

- [ ] Consider adding transform or parse options with some default like for dates in the field (maybe others as well?)
  - from date to string and the opposite, with moment() or with temporal
  - it accepts string ('date', maybe other name for the defaults) or function, or maybe  an object with two properties:
    .e.g field('', {
      parser: {
        parse: v => ...,
        emit: v => ...,
      }
    })

- [NEXT] [ ] NAME LIBRARY (form-nodes) ?
  - Consider @gemgular/forms name for library
  - maybe @gem/ng-form-nodes and keep all my libraries under @gem?
  - maybe @gem/ng-forms
  - let's try to brainstorm names (200) names, and later select
  - i'd like it to sound official
  - [ ] Rename to something generic like @ng-tools/forms (maybe)

- [NEXT] [ ] Create package for npm
  - [ ] Check with chatgpt, how to improve as max as possible a nice package.json metadata for this project (after naming library)
  - DO AS MUCH AS POSSIBLE TO INDEX IN NPM GITHUB AND GOOGLE

- [NEXT] [ ] Improve submit options api (right now is nested i think)
  - [ ] Consider the following (changing submission api):
    // Try to simplify the following. instead of submission.action, maybe just allow a callback onSubmitAction, and onInvalidSubmit to allow easier api (give me options and explore the meaning of the callback)
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

- [NEXT] [ ] Validators internal (internal validators of a custom control component) (e.g. invalid date) [how to do that?]
  - maybe through useControlState({ validationErrors: () => this.ownComponenteValidationErrorsSignal() })
  - this should also allow support for [formControl] [formControlNAme] [formField] bindings somehow
  - [ ] Maybe, allow the components implementing it, to define errors inside the component into the field() (maybe, like the invalid date in the VtInputDateComponent)

- [ ] [IMPORTANT]: decide watch patch does in an array, and also what does the patch does in an array if called from a parent form()
  - consider possibilities and help me deciding, what does it make sense?

- [NEXT] [ ] Make our required() handling to be compatible with angular material (ensure angular material detects our required() handling to display the required mark)
  - [ ] maybe other ones that are not required, min(), max(), etc

- [NEXT] [ ] Consider hiding from the node the controlValue and setControlValue properties, and maybe just exposing them in the ".api" to avoid cluttering for the consumer
  - [ ] controlValue and setControlValue feel more like an internal thing
  - [ ] also maybe hide disabledReasons

- [NEXT] [ ] Add remaining validators in TODO_VALIDATORS

- [NEXT] [ ] TRY TO MAKE ASYNC VALIDATORS ALSO BEING THE RESULT OF A COMPOSABLE VALIDATION FUNCTION.
  - [ ] at the moment this is not possible.

- [NEXT] [ ] Check what is the minimum Typescript version needed for the package (it uses NoInfer for example), and therefore check what minimum angular version is supported
  - same for angular version

- [NEXT] [ ] Pick ideas from other form libraries (e.g. veevalidate, or other react, angular libraries)
  - [ ] Check OTHER LIBRARIES, to see how can i improve the api, adding more useful features, etc

- [NEXT] [ ] To make it safe to use (similar to what we did with self-referencing root in validators), ensure
  that disabled, readonly, etc, also allow referencing safely something that hasn't been created yet
  (e.g. referencing a signal that is at the bottom of the file [through a function]).
  - [ ] Maybe: Consider wrapping all reactive calls that are prone to be called with self form reference in a try/catch with good defaults.
    e.g. validator functions, disabled, readonly, etc... (maybe not)
    - [ ] because if there is a form self-reference then it could fail if called when form hasn't been yet initialized.
    - [ ] be careful that the tracking in those computed/reactive functions is not destroyed by the function failure/error
    - e.g.  this type of code:
      const myForm = form({
        username: field(''),
        email: field('', [
          required,
          min(2),
          () => {
            if (!this.myForm.username()) return { kind: 'needsUsername', message: 'The email field needs a username' } // Esta linea, que hago referencia a myForm, a eso me refiero
          },
        ]);
      });

- [ ] Audit: Review what can we take away from internalApi in primitives (maybe some properties/methods are not needed to be in internalApi)

- [ ] Maybe: Consider naming useControlState to useFieldState() getting aligned with most recent angular standards (formField) (or useFormFieldState())

- [ ] Maybe: Consider removing support for myForm.name.$field (maybe right now with useControlState() we don't need to support that)

- [ ] Maybe: In the folder tests/types maybe structure each file with JS Comments like if we do something like it('should do....')

- [ ] Maybe: Consider changing the @example to something different, like a heading with asterisks **Like this** (for better readability)

- [ ] Maybe: Public api: Consider exporting types with some sort of prefix like NgValidator GemFormsValidator (or something similar)

- Check what happens with the new angular FormValueControl (or whatever the name is) if:
  - My custom control has value = model() and disabled = input();
  - I instantiate my component like this: <my-component [formNode]="myNode" [disabled]="true" />
  - i set myNode.enable()
  - inside my-component what is happening? (imagine that if disabled = input() is true, then the component shows as red)

- [ ] Validator framework roadmap (implement in this order)
  - [ ] Check TODO_VALIDATORS.md file to include more builtin validators

- [ ] Validators
  - [ ] Check how 1 validator maybe can set errors in several Nodes (remind of lab case)
    - [ ] Also handle cases like in lab, like addErrors, and those
  - [ ] Check what model of errors() other libraries return, and decide for the best system
  - [ ] Consider allowing defining a asyncValidator without asyncValidator function:
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

- [ ] Consider imports interface like the following:
  import { form } from 'wherever';

  const myForm = form({
    name: form.field('Mark');
    age: form.field(23),
    houses: form.array({
      city: form.field('Madrid'),
      country: form.field('Spain'),
    }),
  });

- [ ] directive
  - [ ] allow alternative predefined names for directive
  - [ ] allow dynamic name for directive (in case is possible for example creating a form)
    . e.g. providers: [FormNode.withName('myCustomDirectiveName')]
  - [ ] Consider deliberately extending native `min`/`max` propagation beyond Angular 22 Signal Forms to `input[type=time]`, `input[type=week]`, and `input[type=datetime-local]`, which support those constraints in the HTML standard.
    - [ ] Design the native serialization for `Date`, number, and string constraints before implementing it (`HH:mm[:ss]`, `YYYY-Www`, and local date-time strings without a time-zone offset).
    - [ ] Define the time-zone semantics for `datetime-local` and avoid implicit `Date.toString()` conversion.
    - [ ] Ensure the constraint representation agrees with the value representation supported by each native control.
    - [ ] Cover browser validity, SSR, hydration, reset, rebinding, and clearing inactive constraints.
    - [ ] Document this as a deliberate improvement over Angular 22.1.4, whose native propagation currently covers only `number`, `range`, `date`, and `month`.
  - [ ] Allow hooking to existing angular apis
    - [ ] Add other Angular interoperability mechanisms if they become relevant
  - [ ] Decide whether host attributes or inputs such as `[disabled]` should also update the node; node-to-control state synchronization is already implemented.
  - [ ] Ensure whether we need to have angular forms as package dependency, or we can create an abstraction like we did with isObservableLike....
  - [x] Make the directive sync disabled/readonly/required attributes like in angular signal forms 22.
    - [x] maybe there are more attributes synced, check in angular implementation
    - [ ] (from angular docs) The [formField] directive also syncs field state for attributes like required, disabled, and readonly when appropriate.
    - [ ] Have into account that a custom component can have an input called [disabled] and maybe this should be also used? (or maybe not and it should be implemented explicitly in the custom control component)
    - [ ] It seems my implementation already binds from formNode to the attributes, but probably is also reasonable to bind from the attributes (or other inputs like [disabled] in the component) to the node

- [ ] Investigate how other angular libraries perform versioning,
  - [ ] e.g. do they use the version name as the same as angular current version?
  - [ ] do they support previous versions?

- [ ] Ensure that disabledReasons also doesn't fail when it references self form root, when it is declared with a reactive function

- [ ] Consider nesting disabledReasons in myForm.myField.disabled.reasons();

- [ ] Expose restoreDefaultValidatorMessages() function in the public api

- [ ] Add playground to the website, with simple example or something like that

- [ ] Create useFormNode() utility (or inject(FormNode)) to allow a custom component to access easily the formNode or even better to access some sort of signal based api that allows handling
  both formNode and formField (access formNode or formField state, or even formControl), something useful for the consumer and generic. So that inside the component it can for example
  access the errors() or something like that

- [ ] Ensure that disabled input on a custom component, works better than in reactive forms (message in console that it displays)
  - [ ] Although maybe it could have some collision with the new angular way of defining custom controls (for example, now disabled is passed as an input, and i suppose that the form() disabled will be there). Think about that.

- [ ] Check if the submission state, has to be explicitly coming from <form [formNode]="myForm">
  Maybe just binding a nested field with [formNode] could automatically detect the parent form (maybe not)

- [ ] code style: functions declared with `export const` or `const` that return an expression directly should use braces

- [ ] Implement shorthand for required in the field options similar to disbled

- [ ] In the future allow something like dynamic forms from a JSON or object definition
  - [ ] Schema-driven form generation from JSON definitions.

- [ ] Consider allowing validator function returning false/true (for shorthands)

- [ ] Try to simplify the "markers" concept, probably not needed that overengineering

- [ ] Consider allowing optionally a schemaFunction (like in angular 22 signal forms)
  - [ ] maybe better a init: () => void, in the form() options

- [ ] Maybe: Consider adding support for validators defined by string (e.g. 'required|minLength:2') [like in vue]
  - [ ] this would break treeshaking
  - [ ] If possible, typed strings

- [ ] Due to typescript limitations, try providing something similar to signal forms schemaPath api,
  so that in another callback, we can set validators properly typed or something like that.
  - [ ] e.g.
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
  // maybe something like onInit callback in the options?

- [x] Consider an alternative name for ".api"

- [x] Consider cleaning the form() array() field() files, (maybe a class?)

- [ ] In the framework, provide also a component (create and export an angular component) to display the validation errors
  - [ ] max validation errors
  - [ ] color, color by type
  - [ ] maybe consider also simply component to put below the html field, and then display things like warnings, errors, or disableReasons

- [ ] Check angular docs to check metadata implementation etc, and more stuff:
  - [ ] https://angular.dev/guide/forms/signals/form-logic?utm_source=chatgpt.com

- [ ] Check following suggestions
  - [ ] More general debounce
  We support milliseconds in `field()`. Angular supports cancellable asynchronous debouncers, inheritance from ancestors, and strategies such as blur. Our implementation already cancels timers correctly, but it is less expressive.
  - [ ] Public shape of controlValue
  Angular exposes a `WritableSignal`; we expose a readonly `Signal` plus `setControlValue()`. This is a deliberate API difference, and our version is preferred because it clearly distinguishes the origin of the change:
  field.set(value);             // application
  field.setControlValue(value); // control
  - [ ] Removed nodes
  We turn a removed node into an independent, usable root node. Angular considers it an orphan. Decide which behavior is more useful.
  - [ ] Structural tracking from the model
  Angular automatically creates and removes nodes based on the array stored in the signal. We use a template/factory and structural methods. This is a deliberate architectural difference that should not be removed.

## Angular upgrade checklist

Run this checklist for every Angular update. Keep it in `TODO.md` permanently and reset its checkboxes for the next update.

- Release baseline and public API
  - [ ] Resolve the latest maintenance release or tag for every supported Angular major; record the inspected tag, commit, source paths, and relevant test paths.
  - [ ] Read the Angular release notes, changelog, deprecations, breaking changes, migrations, supported public API policy, and Signal Forms documentation for the complete version interval being adopted.
  - [ ] Compare the exported `@angular/core` and `@angular/forms` public types used by the library, including `Signal`, `InputSignal`, `ModelSignal`, `ComponentRef`, `ControlValueAccessor`, `NgControl`, validator tokens, reflection, debug-node, and rendering APIs.
  - [ ] Re-check whether structurally discovered input-signal nodes and `applyValueToInputSignal()` still exist and whether their runtime shapes changed.
  - [ ] Re-check Angular's `ɵcmp.setInput` signature and `ngOnChanges` integration.
  - [ ] Re-check whether a public replacement now exists, such as supported access to the host component's `ComponentRef.setInput()` or a dedicated Signal Forms interoperability protocol.
  - [ ] Keep all private component-input writing isolated under `form-node/angular-internals` while no public replacement exists.
- Angular Signal Forms behavioral parity
  - [ ] Inspect the latest Signal Forms implementation and tests rather than relying only on documentation or previous-version behavior.
  - [ ] Compare node creation, parent/root ownership, paths and keys, removed/orphan nodes, array identity and reconciliation, and structural model changes.
  - [ ] Compare committed value and control-value flow, programmatic versus control-originated writes, equality rules, reset semantics, and debounce inheritance, blur behavior, cancellation, and flushing.
  - [ ] Compare touched, dirty, hidden, readonly, disabled reasons, required state, interaction propagation, and which ancestors or descendants each operation affects.
  - [ ] Re-check that Angular's runtime `FieldNode` still implements `markAsUntouched()` and
    `markAsPristine()`. Angular 22.1.4 omits them from the public `FieldState` interface even though
    the adapter needs their independent behavior to avoid using the broader `reset()` operation.
  - [ ] Compare synchronous and asynchronous validation, laziness and reactive dependencies, pending propagation, cancellation and stale results, error ownership and aggregation, validator metadata, and native constraint metadata.
  - [ ] Compare submission, invalid submission, concurrent submission, submitted/submitting state, native submit/reset events, focus behavior, and disabled or hidden descendants.
  - [ ] Re-audit every intentional difference recorded in `docs/behavior.md`; update, remove, or add differences and regression tests as Angular changes.
- `[formNode]` and control interoperability
  - [ ] Compare Angular `FormField`, form-root binding, binding selection, pass-through wrappers, the control-creation hook, directive exports, and supported host elements.
  - [ ] Re-check the runtime `FormField.parseErrors` signal used by the opaque `$field` adapter.
    Angular 22.1.4 marks it internal and omits it from `FormFieldBinding`, while no public binding API
    exposes parsing errors without also reading the complete validation state.
  - [ ] Verify native `input`, `select`, `textarea`, checkbox, radio, multi-select, number, range, date, month, time, week, and datetime-local value parsing and serialization.
  - [ ] Verify native `required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, disabled, readonly, name, accessibility, validity, parse-error, focus, and event synchronization.
  - [ ] Verify component signal controls using `model()` or input/output pairs, `value` versus `checked`, input aliases and transforms, optional state inputs, reset and touch hooks, and node pass-through.
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

- Optionally extend `ControlState` with interaction-reporting methods beyond `markAsTouched()` only
  when every supported binding source exposes a public operation with equivalent semantics. Keep
  value changes and form-owned operations such as reset, disable, and enable outside this facade.
- Reconsider whether `array()` should expose `patch()`; its positional semantics may be confusing and the same updates can be expressed explicitly through item nodes or other array operations.
- Reconsider mirroring Gem asynchronous-validation `pending` into Angular field state only if
  Angular provides a supported external-state mechanism. Gem must remain the validator owner and
  validators must never execute twice merely to reproduce Angular's lifecycle.
- Reconsider exposing Gem submission state to Angular controls only if a concrete control use case
  appears. Submission remains owned by `[formNode]`; the `$field` adapter must not reproduce or
  combine with Angular `FormRoot` by default.
- Revisit `$field` pattern-slot growth if a field can activate more simultaneous pattern
  contributions after adapter creation than were materialized initially. Angular schemas register
  a fixed number of metadata rules; the adapter currently mirrors every initially materialized
  pattern and reserves one slot for the common initially inactive reactive-pattern case.


## Ideas

-


## Pending decisions



## Bugs

- [ ]


## Discarded

- [d] Improve JSDoc/intellisense of ctx.node() and ctx.field() because right now it displays a huge union maybe we can improve that into something simpler in just a few lines (maybe abstracting the type? )
  - if it adds too much complexity, not do that
- [d] Keep synchronous `validator()` callback-only instead of adding `{ params, validate }`; the
  extra signature complicates partial generic inference and the ordinary reactive callback remains simpler.
- discarded - implement debounce for synchronous validators
- [d] Do not add `'blur'` to `asyncValidator()` debounce.
  - Angular 22.1.x accepts milliseconds or a custom asynchronous timer for async-operation
    debounce; `'blur'` belongs to control-value debounce instead.
  - Consumers can combine `field(..., { debounce: 'blur' })` with an async validator so validation
    begins after the control value commits on blur, then optionally apply a numeric async-validator
    debounce.
- [d] Consider shortcut for simple array template (just an array with 1 object [forced through type] (maybe 2 objects?)) [detectable through Array.isArray()]
  // maybe not a good idea because it is ambiguous whether it should start with 1 item (the one in the template) or 0 items (probably not)
  form({
    houses: [{
      city: field(''),
      country: field(''),
    }],
  })
- [d] Add debounce to synchronous validators, probably also with a factory function validator(() => ...)
  -discarded-reason- it is already handled by a debounce in the normal field declaration
- [d] Also consider exporting the main functions with the following names: ngForm, ngField, ngArray


## Completed

- [x] Audit internal node-value reads across all library runtime folders after introducing exposed equality.
  - [x] Inspect text references and typed callable reads; verify internal aggregation, trackBy, control buffers, Angular synchronization/reset, and clone recipes use their intended value sources.
  - [x] Correct the `[formNode]` control-state adapter to read `$api._value()` and verify current committed values, pending input, reset, interaction, and disconnect through field/form/group/array bindings.
  - [x] Preserve exposed reads for public parent composition, validation/metadata contexts, submission, and update callbacks; preserve control-value reads for UI/CVA rendering.
  - [x] Record the routing criterion in `AGENTS.md` and the detailed audit in `docs/behavior.md`, with consumer documentation and real-browser coverage.

- [x] Evaluate and implement equality on `ArrayNode` after the internal/public value split.
  - [x] Accept shallow, deep, or typed custom comparison through `ArrayOptions`, including configured factories, object/field/factory templates, and nested arrays. Capture the comparator and apply it only to `exposedValue`.
  - [x] Preserve structural identity, moves, paths, detachment, child state, keyed reconciliation, and pending array/ancestor buffer invalidation across equivalent public changes.
  - [x] Cover lazy evaluation, comparator errors and recovery, template clones, public validation/submission/update routing, and asynchronous cancellation with and without injection contexts.
  - [x] Document array equality and its independent structural state with an executable example and browser control coverage. Reference: Angular `v22.1.5`, commit `468b65b74566537456c192ac4281795c5a1e1a5e`, computed implementation/tests, field structure, dynamic node tests, and deep-signal implementation/tests.

- [x] Evaluate moving `FieldNode` to separate stored and exposed values and implement the shared exposed-value strategy.
  - [x] Use `value` and `exposedValue` consistently in `FieldNode`, `FormGroupNode`, and `ArrayNode`. Simplify aggregate public composition to read exposed children directly, replacing the first-stage snapshot reuse optimization.
  - [x] Apply field equality lazily to `exposedValue`; use internal `Object.is` storage for writes, reset, control synchronization, and debounce. Update callbacks and validators receive the exposed value.
  - [x] Deliberately revise comparator timing/errors and identical-write behavior to follow Angular computed semantics. Preserve public parent composition, asynchronous validation ownership, and pending control invalidation across hidden internal changes.
  - [x] Update behavioral tests, browser controls, executable documentation, and the consumer contract. Array-specific equality was deferred at this stage and implemented subsequently above.

- [x] Implement the internal/exposed value split in `FormGroupNode` as the first stage of the dual-value design, replacing the earlier decision to defer all aggregate equality.
  - [x] Expose `equal: 'shallow' | 'deep' | comparator` on form/group options, including configured factories and clones. Keep the existing field equality contract and defer array equality.
  - [x] Route callable/value reads, validators, submission values, and update callbacks through the exposed model. Compose public parents from public children and internal parents from committed children; reuse snapshots when both paths agree.
  - [x] Keep controls, reset, debounce invalidation, and array key reconciliation on committed values, including nested arrays and Angular bindings.
  - [x] Preserve asynchronous work across equal computed dependencies without losing later notifications. Cover behavior through field/form tests, focused utilities, public type tests, and browser bindings.
  - [x] Document the contract and executable example in the website and behavior reference. Array and field migration were deferred at this stage; the subsequent field migration is recorded above.

- [x] Audit the proposed internal/public value split against Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`) and the current primitive, validation-context, control-buffer, and Angular-adapter implementations.
  - A temporary two-signal prototype kept callable/value reads on the same exposed computed while passing the committed aggregate to the real control-buffer helper. A later child edit invalidated pending aggregate control input even when the exposed comparator retained the old value. This resolves the earlier debounce objection for that architecture.
  - Parent aggregates and the Angular adapter currently read callable nodes. An internal model must use a separate internal accessor when crossing node boundaries; changing only `createNode()` would still route these operations through exposed values. Parent raw-value aggregation can expose a child's latest internal value even while that child's public comparator retains an earlier representative; using public children for the parent view requires a separate aggregation path.
  - Validators reading exposed values may skip revalidation of changes accepted internally. Submitting internal values therefore requires equality to preserve all relevant validation rules, or validation/submission routing must use a different explicit contract. `ctx.value()` and node-navigation reads also need a deliberate routing policy.
  - Moving the existing field comparator from its writable signal to a computed changes update/reset inputs, comparison timing, handling of skipped intermediate writes, and comparator exceptions. A default `Object.is` internal signal also suppresses identical writes before an always-false exposed comparator can observe them. These are observable contract changes, not a transparent refactor.
  - Temporary probes passed for separate value reads, debounce invalidation, validator/submission mismatch, parent-channel selection, and field compatibility differences. The focused field, form, group, array, buffer, and Angular-adapter suites passed: 535 tests in 6 files. No library behavior was changed; the architecture remains under exploration.

- [x] Document consumer-specific equality through `computed(() => node(), { equal })` for all node kinds, with an executable example showing retained derived values, current committed values, and downstream recomputation. Keep configurable node equality on fields; extending it directly to aggregates is deferred following the audit.

- [x] Audit extending field equality to aggregates before implementation (Angular `v22.1.5`, commit `468b65b74566537456c192ac4281795c5a1e1a5e`).
  - Inspected `packages/core/primitives/signals/src/computed.ts` and `packages/core/test/signals/computed_spec.ts`: equal computed results retain the previous value, skip value-dependent consumers, and do not track comparator reads. Signal Forms instead projects children from its shared writable model; inspected `packages/forms/signals/src/util/deep_signal.ts` and `packages/forms/signals/test/node/deep_signal.spec.ts`.
  - Temporary probes simulated comparator installation on existing aggregate computed signals without changing shipped source. A case-insensitive form comparator retained `'Marco'` after its child changed to `'MARCO'`; form value-only validation did not rerun, child validation did, and submission received the retained value. Deep equality retained old object references in forms/groups after children accepted equivalent replacements.
  - The control buffer currently uses committed value identity to invalidate pending aggregate input after child or structural changes. Retained custom equality allowed stale pending input to overwrite a later child edit. Even shallow equality preserved pending array input after swapping equal-valued item nodes, changing existing cancellation behavior.
  - Shallow equality can preserve the aggregate value and skip value consumers when equal-valued array items are reordered, but structural state must still update independently. Any implementation must separate model/structure revisions from retained value equality before changing buffer invalidation.
  - The focused field, form, group, array, and control-buffer suites passed: 504 tests across 5 files. Runtime behavior and the public API remain unchanged; the product decision is recorded under Pending decisions.

- [x] Expose `FormNodeValue<typeof node>` to extract the committed value type of any form, group, array, or field and document it in its own reference page. Extend the initial form-only helper to all node kinds while preserving the existing `FormValue<TNodes>` child-map contract, nested values, nullability, and configured primitives.

- [x] Implement `field(..., { equal: 'shallow' | 'deep' | comparator })`, including strict/nullable/configured fields and template clones. Preserve equivalent committed values across callable/value/validator/parent reads, keep control input and interaction independent, and handle debounce cancellation. Deep comparison follows lodash-style value semantics without importing lodash. This completes the field portion of the original primitive equality proposal; aggregate support remains pending.

- [x] Make components easily hookable to the formField (of this library, e.g. to display errors, or display required, etc, nice custom component implementation api)
- [x] Audit and fix aggregate construction inside `computed()`, separately from the class migration. The pre-existing parent-link write failure affected forms, groups, and populated arrays under both class-field emit modes. Initialize links, array values, buffer snapshots, and watcher ownership without tracking mutable node state; preserve definition normalization, factory, option-getter, and injector dependencies.
- [x] Think about what is a good name to use in the examples for the form instance
  - [x] e.g.
  form = form({ 
    name: field(''),
    age: field(23),
  });
  // later in the template <input type="text" [formNode]="form.name">
  // 'form' is good for the instance? maybe formModel, maybe myForm? maybe personForm?
- [x] refactor classes
  - [x] maybe the createFieldNode createFormGroupNode createArrayNode functions, shouldn't handle the arguments thing, that should be the task for field() form() group() array()
    but, it should handle the new FieldNode(...).getNode(); // this it should handle
- [x] Simplify `FormGroupNode.submit()` with `async`/`await` and a single action-level `try/finally`, preserving the public promise contract and submission timing. This supersedes the explicit-promise implementation and separate `runSubmissionAction()` decision below.
- [x] Audit and simplify `FormGroupNode.submit()` without `async`: extract action execution and submitting cleanup into `runSubmissionAction(submission)`. Retain paired promise completion handlers because a `finally()` chain changes cleanup or returned-promise settlement timing.
- [x] Return argument interpretation to `field()`, `array()`, `form()`, `group()`, and configured primitives. Keep `createFieldNode()`, `createArrayNode()`, and `createFormGroupNode()` limited to constructing the instance and returning `getNode()`, preserving option precedence and public signatures. This supersedes the earlier construction-entry argument-resolution decision.
- [x] Extract `createFieldNode()` and `createArrayNode()` beside their implementation classes, matching the construction boundary used by `createFormGroupNode()`. Preserve public overloads, argument precedence, omitted/undefined field values, and direct constructor use in clone recipes.
- [x] Move `array.property.spec.ts` to `primitives/tests` alongside other primitive invariant suites, preserving its generated mutation and reconciliation coverage.
- [x] Rename the shared implementation from `ObjectNode` to `FormGroupNode`, its entry helper to `createFormGroupNode()`, and its files to `form-group-node.ts`, `form-group-node.utils.ts`, and `form-group-node.utils.spec.ts`. Earlier completed entries retain their original names as decision history; public object-definition types remain unchanged.
- [x] Rename `form.utils.ts` and its companion tests to `object-node.utils.ts` / `object-node.utils.spec.ts` so they match the shared form/group implementation. Preserve the local companion-file organization.
- [x] Make `ObjectNode.submit()` return a promise explicitly without `async`, preserving synchronous action execution, early results, promise rejection for synchronous failures, and submitting cleanup timing for synchronous and asynchronous actions.
- [x] Move field, form, array, and group implementation logic into organized internal classes.
  - Completed `FieldNodeFactory` and `ArrayNodeFactory`, subsequently renamed to `FieldNode` and `ArrayNode`.
  - Completed the shared form/group `ObjectNode`, preserving the public APIs, configured normalizers, dynamic children, submission boundaries, and weak clone/debounce ownership.
  - Reviewed immutable array proxy deletion, array computed signatures, and callable assembly alignment with `Object.defineProperties()`.
  - Follow the [primitive state refactor roadmap and reusable checklist](docs/primitive-state-refactor.md).
- [x] Distinguish the form/group implementation from the `[formNode]` directive. Choose `ObjectNode` for the shared object aggregate; `FormNodeController` and `FormNodeState` were considered as alternative names.
- [x] Complete the second `ArrayNode` readability audit: use explicit reconciliation modes, clarify remaining-item and incoming-key variables, explain schema-sample reuse, and group related methods. Keep the indexed proxy inside `createNode()` as decided during review.
- [x] Audit and improve `ArrayNode` readability: extract `publicApi.forEach` into a class method, separate keyed reconciliation validation from item reconciliation, clarify item-factory and schema-sample names, and introduce a local alias for parent-aware item types. Preserve optional buffer cancellation with `controlValueBuffer?.cancel()`.
- [x] Audit pending debounce ownership in the shared `createControlValueBuffer()` helper. A forced-GC experiment retained an otherwise unreachable array, its item, and its parent form while a numeric timer or custom debounce promise was pending; the immediate-debounce control was collected. This reproduced with both the pre-migration function and `ArrayNodeFactory`, under both class-field emit modes. Keep the correction separate from the completed array migration and verify live-node completion as well as collection.
  - Corrected shared-buffer callback scopes and weak controller ownership in both the buffer and `FieldNode`. Regression tests reproduce the original retention and verify collection, cancellation, late settlement, and live-node completion under both class-field emit modes.
- [x] Enforce explicit block returns for multiline arrow expressions through the local ESLint `project/multiline-arrow-body` rule. Allow single-line expressions and direct multiline array/object literals, including TypeScript assertions; update the source formatting and cover the rule's exceptions in its own tests.
- [x] Align `FieldNode.createNode()` with array and form/group callable assembly using `Object.defineProperties()` and `Object.getOwnPropertyDescriptors()`, preserving the public API, property descriptors, and action aliases.
- [x] Rename the internal `ArrayNodeFactory` and `FieldNodeFactory` classes and files to `ArrayNode` / `array-node.ts` and `FieldNode` / `field-node.ts`. Preserve the public `ArrayNode` type and package exports; use `ArrayNodeType` as its local import alias where it shares a module with the implementation class.
- [x] Move `array()` state and operations into internal `ArrayNodeFactory`, preserving public overloads, callable proxies, item reconciliation, aggregate state, injector/control integration, and clone ownership. Apply the field conventions and record the completed array roadmap in `docs/primitive-state-refactor.md`.
- [x] Consolidate `FieldNodeFactory` constructor signal assignments into one `untracked()` block. Prepare validators and options outside it, then create the context, validation infrastructure, and public node only after all initial signal values are assigned.
- [x] Group all writable signal members in `FieldNodeFactory` immediately before `getError`, keeping non-signal members above them, related signals adjacent, and the computed block separate.
- [x] Complete writable signal member initialization in `FieldNodeFactory`: use the approved temporary `undefined as TValue` value/control-value slots and seed both synchronously inside `untracked()` before any context, validation, or node exposure. Preserve actual initial values, object identity, buffering/reset behavior, public types, and both class-field emit modes. This supersedes the earlier recommendation to keep these two signal declarations in the constructor.
- [x] Initialize `FieldNodeFactory.validators` as a member with `[]`, then populate it before validation setup inside `untracked()`. Verify first synchronous and asynchronous validation, metadata, nested aggregation, and both class-field emit modes. Audit `value`/`controlValue`: retain constructor initialization because no universal `TValue` default exists and member reads of parameter properties fail with standard class-field emission.
- [x] Initialize `FieldNodeFactory.selfDisabled`, `selfReadonly`, and `selfHidden` as members with `false` defaults. Apply static options inside a narrow constructor `untracked()` block, preserve reactive source and option-getter tracking, and verify each step through field/form behavior and both class-field emit modes.
- [x] Shorten `FieldNodeFactory.getFieldNode()` to `getNode()` now that the class name supplies the field context. Update its callers and the internal conventions; the method still returns the existing node.
- [x] Rename the internal `FieldState` class to `FieldNodeFactory` and its file to `field-node-factory.ts`. Keep `getFieldNode()` as the caller-facing accessor and update the refactor guide and project conventions.
- [x] Use `FieldNodeFactory.getFieldNode()` in `field()` and clone creation instead of accessing `.node` directly. The method returns the existing node; construction and the public field API remain unchanged.
- [x] Move `createFieldClone()` and `createObjectClone()` to the top of their owning files and document why retained recipes need isolated declarative inputs. Verify that a class method extracting those inputs can also release the source tree; module scope is an explicit ownership convention, not a language restriction.
  - After review, replace the external field helper with `FieldNodeFactory.createClone()`. Extract configuration before returning the callback so clone creation stays in the class without retaining the source instance. Keep `createObjectClone()` beside the function-based form implementation.
- [x] Replace the duplicated internal `_nodeType` discriminant with `$api.nodeType()` in the directive and Angular adapter. Remove it from all primitive implementations and `InternalNodeApi`, retaining collision-safe access through `$api`.
- [x] Prototype an internal `FieldState` class behind the existing callable `field()` API.
  - [x] Sort non initialized variables first, then the rest
  - Keep public overloads and nullability helpers in `field.ts`, separate class members with blank lines, and preserve callback-safe actions and weak debounce ownership. Verify the emitted public declarations against the pre-refactor baseline.
  - Use plain implementation member names without `private`, `readonly`, or `_` prefixes; callers initially accessed `node` directly and now use `getFieldNode()` after review.
  - Group computed and other properties separately by responsibility, keeping complementary states and constraint pairs adjacent.
  - Name mutable interaction state `selfTouched`/`selfDirty` and its computed public state `touched`/`dirty`, consistently with `selfReadonly` and `selfHidden`.
  - Order methods by responsibility, with main operations before supporting helpers and node assembly last.
  - Audit `createNode()` and clarify its assembly names: `nodeMembers` are copied onto the callable node, `publicApi` adds the `patch` alias, and `internalApi` extends that API with internal hooks. Keep the assembly explicit and preserve the shared `api`/`$api` object.
  - Extract custom debounce execution into `startCustomControlDebounce()`, keeping strategy selection in `setControlValue()` and preserving cancellation, synchronous completion/errors, stale settlements, and weak ownership in scheduled callbacks.
  - Normalize computed callback formatting: concise expressions for simple reads, explicit return blocks for multiline expressions or decisions, and consistent statement terminators.
  - Separate constructor phases with blank lines while preserving statement order; start the validation watcher after node assembly and registration.
  - Resolve the initialization questions: argument-independent signals are initialized as members; argument-dependent signals, including `selfReadonly` and `selfHidden`, are initialized with their actual values in the constructor. Placeholder values plus `.set()` require casts for generic values and additional handling for construction inside computed callbacks.
  - Record the ongoing field readability roadmap and a reusable checklist for later primitive refactors in `docs/primitive-state-refactor.md`.
  - Complete the first global prototype review and record a second readability audit. Verify the current public contract and weak debounce ownership; keep the new implementation candidates and naming preferences open.
  - Implement the four second-audit improvements: use the existing public root contract internally, extract control-binding registration and blur flushing, name the immediate numeric-debounce condition, and infer the renamed `stateRef` member's type. Preserve API hooks and weak callback ownership; class naming and access preferences remain open.
  - Complete a third readability audit: identify pre-existing clone-template retention, reproduce it against the pre-class implementation, and verify an isolated clone-recipe experiment in both class-field emit modes. Record the pending fix and two smaller readability proposals in the refactor guide.
  - Complete the third-audit improvements: isolate field, form/group, array, and shorthand-object clone recipes from live source trees; add collection and lifecycle regression coverage; rename `initialValidatorSource`; and separate node assembly groups visually. Preserve the existing public API and record the retention fix in consumer documentation and changelogs.
  - Refine `createNode()` after review: inline forwarding callbacks in `nodeMembers`, reuse them for API aliases, and remove spacing between object properties while retaining class-member spacing. Keep the API-only `patch` alias and record `_nodeType` consolidation as a separate cross-node cleanup.
  - After further review, include `patch` directly in field `nodeMembers` at runtime while retaining its omission from the callable public type. Remove the redundant `publicApi` assembly object; typed patch access remains on `api` and `$api`.
  - Rename the remaining `nodeMembers` object to `publicApi` now that it contains the complete shared field API; keep `internalApi` as its extension with internal hooks.
  - Colocate the template-ownership subprocess fixture with its primitive test as `template-ownership.fixture.ts`. Remove the file-specific TypeScript include and document the general fixture placement, build exclusion, and coverage exclusion conventions.
- [x] Add tests for every function in `src/lib/utils`.
  - Add direct coverage for object classification, word counting, subscription detection, empty values, collection lengths, and DOM binding order. Extend injector tests for captured ownership, subscriber notifications, and binding-lease cleanup.
- [x] Think about how to better structure project folders given current knowledge and existing files
  - [x] should i move public-api.spec.ts next to public-api.ts ?
  - [x] what is the best way of organizing the folders? lib/core is needed? maybe just lib? maybe just core?
- [x] Allow an untyped no-argument field declaration from a non-nullable configured factory to typecheck as `Field<unknown>`, matching its existing `null` initial value.
  - Preserve the initial-value requirement for explicit generic calls and document `field.nullable<T>()` for typed empty declarations. Cover configured inference and executable documentation examples.
- [x] Consolidate validator-message consumer documentation in the website guide, preserving callback parameter details and removing the superseded internal copy. Update README and behavior-reference links while retaining the completed work history.
- [x] Place `public-api.spec.ts` beside `src/public-api.ts` and import its tested contracts through the public entry point.
- [x] Document directory responsibilities and placement conventions for helpers, tests, and documentation in `docs/architecture.md`, linked from the README.
- [x] Move `create-control-value-buffer.ts` and its tests to `src/lib/primitives/utils`, alongside its primitive consumers' other helpers.
  - Keep `form.utils.ts` (subsequently renamed to `object-node.utils.ts`) and `form-node.utils.ts` beside their corresponding implementation files.
- [x] Group primitive-specific helpers in `src/lib/primitives/utils`.
  - Move node definition factories, node markers, disabled-reason handling, and state-source readers out of the general utilities directory, preserving behavior and public APIs.
- [x] Rename `form-root.directive.spec.ts` to `form-node.directive.form.spec.ts` to describe its existing coverage of FormNode on native forms. Preserve the test contents.
- [x] Rename `src/lib/control-state-hook` to `src/lib/control-state` to match the feature and its files.
  - Preserve the adapter structure and tests; update the public entry point, FormNode integration, and shared test-helper imports without changing behavior or the public API.
- [x] Move `src/lib/directives/form-node` to `src/lib/form-node` and remove the empty `directives` directory.
  - Keep the feature's existing files, tests, utilities, and Angular internals together. Update imports and public entry-point paths without changing the public API or behavior.
- [x] Remove the redundant `src/lib/core` directory level.
  - Keep the existing implementation areas directly under `src/lib`. Update public entry-point exports, test-helper imports, browser fixture type imports, and playground imports; preserve the existing API and behavior.
- [x] Keep `validation/validators` focused on concrete validators and their tests.
  - Moved message resolution, default messages, date constraints, and shared validator options into `validation/utils`; moved the independent string helper `count-words` into `core/utils`. Updated imports and the `ValidatorOptions` re-export without changing the public API or behavior.
- [x] Move shared built-in validator tests into `core/validation/tests`.
  - Group `builtin-validator-error`, `builtin-validator-when`, and `reactive-validator-messages` with the IntelliSense suite. Keep each individual validator's tests beside its implementation.
- [x] Move the cross-primitive validator IntelliSense test into `core/validation/tests`, preserving its language-service fixture and assertions.
- [x] Group the remaining validation helpers in `core/validation/utils`.
  - Moved `validator-source`, `resolve-async-validation-result`, and `create-validator-context`, together with the existing async-result resolver tests. Updated relative imports without changing behavior or the public API.
- [x] Move validation-specific helpers from `core/utils` into `core/validation/utils`, keeping their existing tests alongside them.
  - Relocated `async-validator-marker`, `field-context-marker`, `add-default-target-node`, and `normalize-validation-result`; updated their imports and re-exports without changing behavior or the public API.
- [x] Document where to configure validator messages in Angular applications.
  - Show a separate message catalog, an explicit `configureGlobalValidatorMessages()` call in `main.ts` before bootstrap, and the application-scoped alternative in `app.config.ts` or `AppModule.providers`.
  - Explain startup lifetime, when restoration is appropriate, and why static catalogs need no initializer or side-effect-only import. Include compiler-checked Angular examples and links from the guide and configuration reference.
- [x] Decide the exact semantics and naming of object-node ancestry lookups.
  - [x] Re-evaluate whether `node.form()` should return the nearest `form()` ancestor, which would make
    an explicit nested form the workflow owner observed by all of its descendants.
  - [x] Add a separate `root()` signal for retrieving the actual root of the
    complete node tree instead of overloading `form()` with both workflow ownership and root lookup.
  - [x] Let `root()` return any root node (`Field`, `Group`, `Form`, or `ArrayNode`) and keep
    `form()` as the nearest `Form | null` lookup instead of adding a redundant `rootForm()`.
  - [x] Specify behavior for a root `group()`, a standalone field or array, nested explicit forms,
    groups inside arrays, detached array items, and nodes that are reparented at runtime.
  - [x] Review validator contexts, public root-type inference, async dependency tracking, submission
    inheritance, documentation, and migration impact before changing the current behavior.
- [x] Audit and remove tests whose sole purpose is rejecting retired API names or options.
  - Removed seven type assertions for per-field `nullable`, `FormRoot` / `FormRootDirective`, binding/directive `field`, and directive `ngOnInit`.
  - Confirmed that no absence assertions for flat validator-context `root()` / `form()` remain in the current tests.
  - Retained positive coverage of replacement APIs and negative tests for current contracts: node-kind restrictions, private implementation members, readonly signals, input types, error ownership, and control adapters. No runtime or public API changes.
- [d] Consider that validators declarated not-inline could be strictly typed [OPTIONALLY, SO WE SHOULD KEEP CURRENT TYPING BEHAVIOR] for some specific type of nodes. E.g. something like the following would be only allowed to be put in a Field (not in form() group() or array())
  const myValidatorCustom1 = validator<string | null, 'field'>((ctx) => {
    if (ctx.value()) return { kind: 'somo', message: '' }
  });
  // Maybe the following could only be used in form() or group()
  const myValidatorCustom2 = validator<string | null, 'form' | 'group'>((ctx) => {
    if (ctx.value()) return { kind: 'somo', message: '' }
  });
  // so... doing later myField = field('', [myValidatorCustom2]) // this should fail the type because the validator is only allowed in field
  - [x] this could also improve the type of the union provided in ctx.node() and ctx.field() because we already provide some info to validator<>
  - [x] if we do this we should be sure that we don't disturb the automatic inference for inline validators
  - [x] what do you think, do you have any other api suggestion? is it a good idea/bad/complex/unnecesarily-complex
  - [x] OR MAYBE JUST INTRODUCE GUARDS FOR STRICTLY TYPED validators? e.g. if validator<string | null> then it could only be used in a field<string> 
  or validator<number[]> could be only used in a field<number[]> or in an array() that contains a value of number[]. WHAT DO YOU THINK?
  - Existing validator typing already restricts use according to the node's value type, including nullability, while allowing compatible values across node kinds.
  - Keep the current generic API and inline inference. A concrete owner type can already be supplied when a validator needs node-specific operations; no additional kind selectors or guards are needed.
- [x] Evaluate simplifying `create-validator-context` by replacing `Object.defineProperties` with an object literal or `Object.assign`.
  - Keep the current implementation: it enriches the marked context once, preserves the shared context and readonly node-signal identities, and prevents replacing or deleting its navigation properties.
  - `Object.assign` saves descriptor syntax but removes the runtime property protection. A separate object literal needs coordinated initialization or caching and must preserve the non-enumerable context marker; this is not a net simplification for the current callers.
  - Reconsider a complete object literal if the node/context initialization lifecycle is redesigned for another concrete requirement. No runtime or public API changes are needed for this review.
  - Reviewed Angular `v22.1.5` (`468b65b74566537456c192ac4281795c5a1e1a5e`) field context implementation and tests; the descriptor choice is library-specific. The tag was resolved in the preceding review; refreshing remote tags during this follow-up failed because GitHub DNS resolution was unavailable.
  - Verification: 365 tests passed across `field.spec.ts`, `form.spec.ts`, `async-validator.spec.ts`, and `run-sync-validators.spec.ts`.
- [x] Preserve the declared value type on standalone validator nodes (`ctx.field().value()` and `ctx.node().value()`), including nullable values and asynchronous contexts.
- [x] fix signature in test-file myFormTestSomething (it should be valid to declare validators array there)
- [x] Clean validators context 
- [x] Define and document field shorthands, including arrays, Moment-like values, non-plain objects,
  runtime normalization, and TypeScript limitations.
- [x] Preserve an explicitly supplied `undefined` initial value in `field(undefined)` while keeping
  the omitted `field()` initial value as `null`, using the argument count to distinguish both calls.
- [x] Consider nullable api like this:
  const name = field.nullable('Mark');
  const age = field.nullable(23),
- [x] In the same sense that required() was implmeented to potentially notify custom components that the required validator has been configured, also do
  with min() max() to notify custom components that there is a min/max validator defined (e.g. maybe a number input would allow writing or clicking arrows for more than max, or something like that)
- [x] Always expose `myForm.$api` in `form()` and `group()` in case the user wants to declare an `api` property (user-defined properties always take priority)
- [x] initial value should be null or undefined? (for field())
  - [x] and for array?
- [x] maybe add "novalidate" html property by default to the parent form of the fields? (maybe not)
- [x] Add good docs about implementing a custom control (support for focus, etc, angular CVA, form value accessor, etc)
- [x] Add precise instructions on how to use the library (e.g. angular imports, etc)
- [x] Ensure that the library performs tree-shaking (e.g. not used validators ) [I THINK I ALREADY HANDLED THIS IN SOME COMMIT]
- [x] Runtime addition or removal of form nodes.
- [x] Add Angular 22-style `error` overrides to every built-in validator.
- [x] Shortcuts for signature
  - [x] Consider shortcut for simple primitives [detectable through typeof === number/string/boolean/null/undefined]
    form({
      age: 23, // same as "age: field<number>(23)"
      name: 'Marco',
      partner: null as string | null,
      friend: field<string>(),
    })
    // <!!!!> Maybe it even works with an object like value even if it creates a group() // just a hunch (because of the form({ valueObj: { name: '' } })) // myForm.valueObj() still returns the object
- [x] Remove the per-field `nullable` option now that `field.strict()` and `field.nullable()` are
  the explicit local nullability APIs.
- [x] Add shared validator-message and injector-inheritance defaults to `createFormPrimitives()`.
- [x] Add `field.strict()` and `field.nullable()` as short, explicit nullability overrides.
- [x] Display complete nested form and group value objects in IntelliSense without exposing
  internal `FormValue` or normalization helpers.
- [x] Allow creating an isolated form primitive set with an optional predefined `nullable` default
  through `createFormPrimitives()`, including shorthands, dynamic children, and array templates.
- [x] Make first generic of form() and group() to be the model of the form(). (what is it right now?)
  - [x] e.g.
  form<{
    username: string;
    age: number;
  }>({
    username: field(''),
    age: field(0),
  });
- [x] Ensure that array().push is reactive, makes sort of reactive change (sort of immutability detected by effect/etc)
- [x] Field shorthand
  - [x] docs
    - [x] Provide alternative for non-possible disabled = input() readonly = input(),
      strong alternative like useFieldState() hook, compatible with all angular ways of declaring a form state (ngModel, formControl, new way, formNode)
      this should also be notified in the component-input-writer console.warn
      boundFieldState = useBoundFieldState<string | null>(); // Maybe infer type from value = model()
      boundField = useBoundField(); // maybe better
    - [x] Add a declaration matrix comparing shorthand syntax with its explicit equivalent and showing
      ambiguous values that require `field()`, `group()`, or `array()`.
    - [x] Update the `form()`, `group()`, `field()`, array, creation, validation, and migration/reference
      pages with executable examples and inference assertions.
    - [x] Add package-consumer tests against emitted declarations, plus changelog and migration notes for
      any newly accepted or newly rejected input category.
    - [x] Before expanding the contract, verify focused behavior and type tests, lint, typecheck, build,
      coverage, package tests, and documentation typecheck/build.
  - [x] Design array shorthand separately
    - [x] Resolve the former `items: []` ambiguity as an array-valued field. Every array used as an
      object-node child is equivalent to `field(arrayValue)`, regardless of its length or contents.
    - [x] Keep scalar item templates such as `array('')` rejected. Require an explicit node template
      such as `array(field(''))`; this keeps item configuration visible and does not imply anything
      about arrays used as property values.
    - [x] Keep array-valued templates such as `array([])`, `array([''])`, and tuple templates rejected.
      Require `array(field([...]))` for array-valued items or `array(array(...))` for nested dynamic
      collections rather than guessing whether the first array describes a value, tuple, or structure.
    - [x] Decide against implicit `array()` inference for empty arrays, tuples, readonly arrays, object
      items, and heterogeneous values. They consistently become atomic fields; template cloning,
      `trackBy`, item validators, and array options belong only to explicit `array()` declarations.
    - [x] Require an explicit `array(...)` whenever a declaration intends a dynamic node collection,
      preserving aligned runtime intent and useful static inference.
    - [x] Decide against the following proposed `array()` inference. It is retained here as decision
      history; the declaration now intentionally infers `field([...])`, and consumers use explicit
      `array(...)` when they need item nodes:
      const myForm = form({
        myArray: [{ name: 'Paul', age: 20 }, { name: 'Mark', age: 28 }],
      });
  - [x] Allow `array()` object templates to contain field shorthands, such as
    `array({ name: '', age: 0 })`, with runtime normalization, template cloning, and TypeScript
    inference matching the equivalent explicit `array({ name: field(''), age: field(0) })` declaration.
  - [x] Decide dynamic mutation semantics
    - [x] Decide whether `group.add()` and related dynamic APIs accept shorthand values or continue to
      require explicit node definitions: both `form.add()` and `group.add()` accept them.
    - [x] If dynamic shorthand is supported, reuse the same normalization and inference contract rather
      than creating a second set of rules.
    - [x] Cover detach, reparent, replace, reset, and late-created child ownership for implicit nodes.
  - [x] Harden runtime normalization
    - [x] Centralize normalization and exercise the same behavior through `form()` and `group()`, at the
      root and at every nested depth.
    - [x] Add runtime tests for special numbers, empty strings, `false`, bigint, symbols, invalid dates,
      `null`, `undefined`, null-prototype objects, symbol keys, and objects with unusual prototypes.
    - [x] Define and test behavior for enumerable accessors, inherited properties, reserved child names,
      and prototype-pollution-sensitive keys such as `__proto__`.
    - [x] Verify that implicit fields behave exactly like `field(value)` for reset, set, patch, clone,
      validation, disabled/readonly state, parent/root/path ownership, injector inheritance, and binding.
    - [x] Ensure diagnostics identify the complete declaration path and recommend the correct explicit
      primitive when normalization fails.
  - [x] Add public type tests for strings, numbers, booleans, bigints, symbols, `Date`, `null`,
    `undefined`, nested object literals, class instances, explicit nodes, and mixed declarations.
  - [x] Verify literal widening, `as const`, `satisfies`, readonly properties, optional properties,
    unions, and predeclared model objects.
  - [x] Verify that validators and node options retain useful contextual typing when shorthand and
    explicit declarations are mixed.
  - [x] Add compile-time failures for ambiguous arrays and unsupported declaration values with
    actionable error types where practical.
  - [x] Measure deeply nested and wide definitions to prevent excessive type instantiation or poor
    editor performance. Keep a 15-level mixed deep fixture and a 50-child mixed wide fixture under
    budgets of 75,000 types and 1,100,000 instantiations with the package's supported TypeScript
    version.
  - [x] Treat primitive values and `Date` instances as implicit `field()` declarations.
  - [x] Infer `field<unknown>` for `null` and `undefined` shorthand declarations.
  - [x] Treat plain object literals as implicit `group()` declarations.
  - [x] Preserve explicit node declarations without wrapping or replacing them.
  - [x] Reject array literals until their meaning is explicitly designed.
  - [x] Define one leaf-versus-structure contract for runtime normalization and public TypeScript
    inference: preserve nodes, reject arrays, normalize plain structural definitions to groups, and
    normalize every other value to a field.
  - [x] Treat non-plain objects as implicit fields, including `RegExp`, `URL`, `Map`, `Set`, typed
    arrays, Temporal values, Moment-like values, and custom class instances. Require an explicit
    `field(value)` only at deliberately widened boundaries where TypeScript no longer carries the
    concrete runtime type.
  - [x] Document `field(value)` as the unambiguous escape hatch for any value that could otherwise be
    interpreted as structure.
- [x] Implement requiredIf validator
- [x] Rename `injectBoundControl()` and its related public types to the shorter, source-neutral
  `useControlState()`, `ControlState`, `ControlStateSource`, `ControlStateError`, and
  `ControlStateDisabledReason` names.
- [x] Add a dedicated `useControlState()` reference page with a type-checked custom control and
  examples for `formNode`, `formField`, `formControl`, `formControlName`, and `ngModel`.
- [x] Finish `.add()` for dynamic `form()` and `group()` children.
  - [x] Keep both `add('key', field(''))` and atomic `add({ key: field('') })` signatures.
  - [x] Preserve input cardinality in the return: one definition returns its exact node, while an
    object returns an exact keyed map of every attached node.
  - [x] Do not overload proxy assignment such as `myForm.newProperty = field('')`; structural
    mutation remains explicit through `add()`.
- [x] Prevent direct key access to dynamic `form()` and `group()` properties so incorrect names such
  as `<input [formNode]="myForm.unexistingOrMistypedPropertyName">` fail Angular template checking.
  Runtime keys use `.get()` or keyed access through `.children` instead.
- [x] Keep `useControlState()` read-only except for `markAsTouched()`, which reports a native
  control interaction to the owning forms API.
  - [x] Do not add `setValue()`; custom controls write through `model()`, `FormValueControl`, or
    `ControlValueAccessor`, while programmatic form writes belong to the owning forms API.
- [x] Add `useControlState<T>()` as a source-neutral custom-component state facade, initially backed by `[formNode]`, with normalized `{ kind: string; ... }` errors and neutral disconnected state.
- [x] Split control-state sources into dedicated adapters and add `[formControl]` through `AbstractControl.events`, with safe defaults for unsupported state.
- [x] Make every control-state adapter own its complete common-state model and keep `useControlState()` limited to source selection and signal forwarding.
- [x] Support `[formField]`, `formControlName`, and `ngModel` through dedicated control-state adapters.
- [x] Let custom controls call `controlState.markAsTouched()` across every supported binding source.
- [x] Harden `useControlState()` adapters for dynamic `AbstractControl` rebinding, silent `{ emitEvent: false }` mutations, reactive effects, source-specific names, deterministic source precedence, and server-to-browser connection.
- [x] Keep normalized control-state disabled reasons as `{ message?: string }`, preserving unnamed active reasons as `{}` so only `[]` means no reason.
- [x] Improve custom-component input writing for `[formNode]`.
  - [x] Resolve public aliases and transforms through `reflectComponentType()`.
  - [x] Preserve `ngOnChanges` through Angular's definition input writer when available.
  - [x] Find input-signal nodes through own symbols without importing private Angular symbols.
  - [x] Guard every private Angular lookup and write so incompatible internals only disable affected optional state-input synchronization.
  - [x] Warn once per control and input when compatibility fallback cannot synchronize an optional state input, with safe alternatives.
  - [x] Verify `getDebugNode()` component discovery in an isolated production-mode Chromium run with a full-AOT fixture.
  - [x] Initially keep `provideFormNodeControl()` as the explicit fallback for directives and host directives, which `getDebugNode().componentInstance` cannot discover.
  - [x] Subsequently remove `provideFormNodeControl()` and intentionally limit automatic signal-control discovery to components; directive integrations can use a component wrapper or `ControlValueAccessor`.
- [x] Explain that form primitives use the familiar Angular signal value pattern while adding form-specific features.
- [x] Add dynamic named children to `form()` and `group()`.
  - [x] Support `add(name, definition)` and atomic `add({ ... })` calls.
  - [x] Initially expose safe `DynamicNode | undefined` direct dynamic properties; subsequently
    replace them with `.get()` and `.children[key]` so misspelled direct names fail type checking.
  - [x] Allow `remove(name)` for dynamically added children while preserving fixed-child types.
  - [x] Update behavior and consumer documentation with the complete dynamic-child contract.
- [x] Add ESLINt with vt rules
- [x] Add very descriptive IntelliSense for every member in the public API.
  - [x] Audit public options and source parameters.
  - [x] Document primitive instance properties and their state semantics.
  - [x] Audit remaining action methods and callable signatures.
  - [x] Document validator APIs, contexts, statuses, and asynchronous contracts.
  - [x] Document custom-control integration and binding configuration.
  - [x] Document structural value, set, and patch utility types.
- [x] Add complete IntelliSense JSDoc for primitive instance properties, including properties that
  were still missing descriptions after `keyInParent` and `disabledReasons` were introduced.
  - [x] Document common structure, value, validation, interaction, availability, and lifecycle
    signals on generic nodes and on `field()`, `form()`, `group()`, and `array()` instances.
  - [x] Explain leaf-versus-aggregate behavior for `errors`, `allErrors`, `pending`, `touched`,
    `dirty`, and `debouncing`.
  - [x] Verify that the descriptions survive declaration generation for consumer IntelliSense.
  - [x] Document primitive action methods, array navigation and structural operations, callable
    node signatures, and every published `field()`, `form()`, `group()`, and `array()` overload.
- [x] Infer `field(undefined)` as `Field<unknown>`, matching `field(null)`.
  - [x] Preserve explicit generic inference such as `field<string>(undefined)` as
    `Field<string | null>`.
  - [x] Keep the existing runtime normalization from an explicit `undefined` initial value to
    `null`, matching `field()` without an argument.
- [x] Let `[formNode]` temporarily provide its host injector to a directly bound node.
  - [x] Investigation found that the directive already obtains the concrete host injector through
    public `inject(Injector)`; `getDebugNode()` is unnecessary for the directive itself.
  - [x] Use the binding injector for explicitly triggered asynchronous validation and a later
    `$field` adapter request, without changing creation-time provider message catalogs.
  - [x] Model binding ownership as a revocable lease: preserve the first active binding, select the
    next active binding on release, and fall back to ancestor or weak ownership on rebinding or
    destruction.
  - [x] Keep an explicit or currently captured injector first in precedence, put a direct binding
    injector second, and put the nearest ancestor injector third.
  - [x] Add `adoptBindingInjector` independently from `inheritInjector`, with both enabled by
    default and neither affecting an injector owned directly by the node.
  - [x] Avoid private Angular APIs and circular initialization between `[formNode]` and
    `[formField]`.
  - [x] Original idea: use the `[formNode]` directive or `getDebugNode()` as a fallback injector for
    asynchronous validators when `form()`, `field()`, or another primitive received no injector.
- [x] Make injector lookup inherit through the node tree by default.
  - [x] Prefer each node's explicit or currently captured injector, then use the nearest ancestor
    injector when the node has none of its own.
  - [x] Apply inherited ownership to existing descendants and to nodes created later by both array
    templates and factories.
  - [x] Add `inheritInjector: false` as a subtree boundary while preserving injectors owned by the
    boundary node or a descendant.
  - [x] Transfer lifecycle ownership when nodes are adopted and release it when they are detached.
  - [x] Keep injector-free nodes safe through weak watcher ownership.
  - [x] Derive the root-resolution baseline from Angular `v22.1.4` at commit
    `898380974d49cf7976e9d89cc74a0801a26ce7b1`, while documenting Gem Forms' dynamic-node extension.
- [x] Harden `$field` as an opaque Angular `[formField]` control-binding adapter while Gem Forms
  remains the sole authority for form state and operations.
  - [x] Support only behavior required by controls that bind a node's terminal `$field`; do not
    eagerly mirror unused nodes or reproduce Angular's form engine.
  - [x] Verify that lazily connected descendants, including array items added later, resolve the
    root adapter's injector. A complete root created outside injection continues to require an
    explicit `injector` option and throws the documented error otherwise.
  - [x] Verify cleanup when a bound node is removed, its Angular view is destroyed, or the owning
    injector is destroyed.
  - [x] Keep automatic injector adoption from `[formNode]` outside this adapter milestone and track
    it as an independent investigation.
  - [x] Audit the completed baseline against Angular `v22.1.4` at commit
    `898380974d49cf7976e9d89cc74a0801a26ce7b1`.
- [x] Make `$field` compatible with Angular AOT strict-template checking without publishing a typed
  Angular field API.
  - [x] Type-erase the terminal adapter to `any`; Angular's template checker must call the field and
    inspect its writable `value`, which makes `never`, `Field<never>`, and `() => never` invalid.
  - [x] Compile native, custom field, form, group, and array `[formField]` bindings with `ngc` and
    `strictTemplates: true`.
  - [x] Keep Gem nodes as the documented and supported surface for every programmatic operation.
- [x] Verify `$field` adapter cleanup across its supported lifecycle.
  - [x] Disconnect removed array items and unregister their destroyed `[formField]` bindings.
  - [x] Remove focus and parsing-error registrations when a bound Angular view is destroyed.
  - [x] Stop value and interaction synchronization and clean up control registrations when the
    adapter's owning injector is destroyed.
- [x] Verify injector ownership for nodes created later by `array()`.
  - [x] Original concern: determine whether dynamically created array nodes have an injector and
    whether it should come from the parent array.
  - [x] Resolve `$field` through the complete root's captured or explicit injector, including for
    lazily created nested descendants whose item factory runs outside an injection context.
  - [x] Keep injector ownership at the adapter root instead of copying it into every generated item.
  - [x] Preserve the documented error when the complete root was created outside dependency
    injection without an explicit `injector`; entering an ambient injection context later does not
    make that root adopt it implicitly.
- [x] Create an Angular Signal Forms adapter exposed as `myForm.name.$field` for direct use with `<my-control [formField]="myForm.name.$field">`.
  - [x] Back `$field` with a real, stable Angular `FieldTree` created once per root rather than a structural imitation or an independent Angular form per child.
  - [x] Synchronize values bidirectionally and mirror disabled, readonly, hidden, required, validation, touched, and dirty state.
  - [x] Keep adapter creation lazy so nodes remain usable outside Angular dependency injection until `$field` is requested.
  - [x] Apply `provideFormNodeConfig({ classes })` predicates to `$field`-backed `[formField]`
    controls while ignoring unrelated Angular field trees, and document that Angular's non-multi
    Signal Forms config requires consumers to choose one class-config provider per injector scope.
  - [x] Verify and document that an existing `provideSignalFormsConfig({ classes })` applies
    directly to `$field`-backed controls through Angular's native `FormFieldBinding` contract.
  - [x] Synchronize leaf-node `touched` and `dirty` independently in both directions, including
    control-originated input and blur, node-originated reset and clearing, and node-owned
    disabled, readonly, and hidden state flowing to Angular.
  - [x] Route control-originated Angular model changes through the bound node's control-value
    channel instead of `root.set()`, preserving `controlValue()`, numeric and blur debounce,
    `flush()`, cancellation, dirty state, and programmatic-versus-control write semantics.
  - [x] Resolve same-turn Angular and node value conflicts deterministically: a real control-state
    edit takes precedence, while the node wins when no control edit occurred. Verify both operation
    orders, exact control-channel write counts, stable convergence, and absence of feedback loops.
  - [x] Extend independent `touched` and `dirty` adapter coverage beyond leaf nodes to forms,
    groups, arrays, ancestors, descendants, `skipDescendants`, disabled, readonly, hidden, reset
    propagation, and array items already materialized when the adapter is created.
  - [x] Register every Angular `FormFieldBinding` with its original library node so node-level and
    aggregate `focus()` work, multiple bindings use DOM order, destroyed and rebound controls
    unregister, and Angular custom-control focus implementations are preserved.
  - [x] Propagate Gem subtree and explicit-value resets into Angular parsing/control-value cleanup
    and native, custom-control, or CVA reset hooks; cancel pending Gem debounce and handle native
    form reset through `[formNode]`. Angular's internal field reset is deliberately not a public
    operation because `$field` is opaque and Gem Forms is the sole state authority.
  - [x] Propagate native and custom-control parsing errors from each Angular `FormField` binding
    into Gem validation. Preserve binding ownership, merge them with Gem validator errors, remove
    them on recovery, reset, destruction, or rebinding, and expose them through `errors()`,
    `allErrors()`, ancestor validity, and submission checks.
  - [x] Mirror Gem `min`, `max`, `minLength`, `maxLength`, and pattern constraints into Angular
    field metadata for native and custom `[formField]` controls. Keep the sources reactive, support
    number and date limits, use metadata-only rules so Gem remains the sole validator owner, and
    avoid duplicate validation errors.
  - [x] Preserve complete Gem validation-error payloads in Angular field state, including messages,
    constraint data, and custom properties, while preventing Angular-originated parse errors from
    being fed back into Angular a second time.
  - [x] Preserve explicit `targetNode` semantics for aggregate and cross-field validators by
    attaching each adapted error to the corresponding Angular field path. Permit validator results
    to target a Gem node while reserving `formNode` for concrete rendered bindings.
  - [x] Resolve dynamic array item `$field` bindings lazily instead of eagerly mirroring every
    descendant. Remap only requested nodes after moves or `trackBy` reconciliation, preserve their
    interaction state, and clean up removed connections before Angular observes an orphan field.
  - [x] Keep availability intentionally directional: Gem owns `disabled`, `readonly`, `hidden`, and
    `required`; Angular derives them for `[formField]`. Do not emulate reverse setters that Angular
    does not expose.
  - [x] Reject an exhaustive adapter matrix as a standing implementation goal. Add focused unit,
    template, browser, SSR, hydration, or package tests only when a supported binding capability
    requires them; do not reproduce Angular's own cross-library test suite.
  - [x] Keep adapter documentation updates as a standing project rule in `AGENTS.md`, not a
    perpetual unfinished `$field` task. Record the inspected Angular version and governing source
    paths whenever adapter behavior changes.
  - [x] Document and verify the recommended native `<form>` composition: use Gem's `[formNode]` as
    the sole root for submit, reset, and `novalidate`, while individual controls may use
    `[formField]="node.$field"`. Invalid adapted controls block submission and can be focused from
    `onInvalid`; do not combine competing form-root directives.
- [x] Add relative-day shortcuts to `minDate()`, `maxDate()`, and `dateBetween()`.
  - [x] Original task: add string shortcuts such as `'today'` to these date validators.
  - [x] Support `'today'` as a static or reactive boundary.
  - [x] Resolve shortcuts lazily at UTC midnight by default or local midnight with `parseAs: 'local'`.
  - [x] Keep the behavior explicit: no hidden timer revalidates a form exactly at midnight.
- [x] Create the internal `isNil(value)` type guard.
  - [x] Original follow-up: check all applicable cases that used `x === null || x === undefined`.
  - [x] Use it in validator normalization and composition, nullish validator values, array validator-source detection, empty-value detection, and native-control writes.
- [x] Audit every public options and source parameter from the consumer's IntelliSense perspective.
  - [x] Inline small call-site shapes such as `markAsTouched()` and both `asyncValidator()` overloads.
  - [x] Keep named types for reusable concepts such as node options, validator sources, message catalogs, and async configurations.
  - [x] Expose small accepted unions directly in node and built-in-validator options and clarify which callback sources are reactive.
  - [x] Remove the redundant `RequiredOptions` alias while retaining reusable `ValidatorOptions`.
- [x] Audit `readonly` across consumer-supplied option and configuration objects.
  - [x] Keep options, submission configuration, validator-message catalogs, async configuration, and binding-class configuration mutable in the public type system.
  - [x] Retain readonly state and result objects owned by the library.
- [x] Allow built-in validators to accept a static message string directly when the signature is unambiguous.
  - [x] Preserve the options object for reactive messages and date parsing configuration.
  - [x] Preserve `uniqueItems('property')` as the property key-selector shorthand; use an options object for a no-key-selector message or pass the message after a key selector.
- [x] Add `mapObjectValues(object, mapper)` for value transformations that preserve an object's keys.
  - [x] Use it for object-node normalization and recursive node-definition cloning.
  - [x] Keep `arrayToObject()` for transformations whose source is genuinely an array and whose mapper
    derives each output key.
- [x] Add a general `arrayToObject(items, mapper)` utility and replace the existing
  `Object.fromEntries(array.map(...))` patterns.
  - [x] The mapper receives the item, index, and readonly source array and returns a key/value tuple.
  - [x] Property keys preserve their inferred string, number, or symbol union.
  - [x] Duplicate keys deliberately follow `Object.fromEntries()` semantics: the last value wins.
- [x] Introduce `group()` as the default fixed-object aggregate while reserving `form()` for a submission/workflow boundary.
  - [x] Research found Angular Reactive Forms reuses `FormGroup`, Angular 22 Signal Forms separates its uniform `FieldTree` from `FormRoot`, path-based libraries avoid nested form instances, and TanStack uses groups beneath a submission-owning form.
  - [x] `group()` is a fixed, non-null object node with children, aggregate value/state, validators, inherited configuration, updates, reset, and common node operations.
  - [x] `group()` omits `submission` and `submit()` while inheriting `submitting()` from an ancestor workflow.
  - [x] `form()` remains the explicit workflow boundary and the only node accepted by native `<form [formNode]>`.
  - [x] Plain nested objects and object templates inside `array()` normalize to `group()`; explicit nested `form()` remains available for independent subflows.
  - [x] Both primitives share the same internal object-node engine, with capability-specific public types and runtime surfaces.
  - [x] The inference decision is recorded in behavior docs, website reference, the development changelog, and type tests. No consumer migration entry is needed before the first publication.
- [x] Consolidate root-level `integration-tests`, `type-tests`, and `testing` infrastructure under `tests/integration`, `tests/types`, and `tests/helpers`.
- [x] Determine whether accessing Angular's private input-signal node is a supported Angular API.
  - [x] It is exported from `@angular/core`, but Angular explicitly excludes every `ɵ`-prefixed symbol from its supported public API and compatibility guarantees.
  - [x] Discover input-signal nodes structurally without importing `ɵSIGNAL` or `ɵInputSignalNode`, and isolate the adapter with `ɵcmp.setInput` under `form-node/angular-internals`.
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
- [x] Implement ESLint
- [x] Document every built-in validator and structured built-in error for IntelliSense.
- [x] Add an extensible validation error registry and strongly typed `getError(kind)` overloads.
- [x] Include the rejected `actual` measurement or value in applicable built-in validation errors.
- [x] Implement `minWords()` and `maxWords()` with deterministic Unicode word counting.
- [x] Implement the `oneOf()` validator with static or reactive allowed values.
- [x] Add centralized default messages and common custom-message options to the built-in validators.
- [x] <!> important. Consider including hidden access to .api that is not .api, (maybe $api, or _api) because user defined properties could collide with it
  and then the form() framework will not work because it uses it on the internal system
- [x] Allow `array()` `trackBy` to accept a typed string property name in addition to a callback.
- [x] Document the `array()` template and factory first parameter in IntelliSense, including cloning semantics, fresh-definition requirements, and examples.
- [x] Decide and document nullable `array()` input behavior: normalize `null` and `undefined` container values to an empty array while keeping the observable value structurally non-null.
- [x] Add `swap()` to `array()` and document the structural reordering operations for IntelliSense.
- [x] Add `moveUp()` and `moveDown()` convenience operations to `array()` while preserving node identity and state.
- [x] Complete the observable `[formNode]` comparison against Angular Signal Forms 22.1.4, including native controls, custom controls, pass-through wrappers, binding state, control debounce, SSR, hydration, AOT, and real-browser behavior; retain documented differences where Angular relies on private or binding-name-specific compiler support.
- [x] Expose readonly `controlValue()` on forms and arrays without aggregating pending descendant buffers, including independent debounce for controls bound directly to aggregate nodes.
- [x] Implement `getError()` on every node.
- [x] Pass value, node API, path, parent, and root form context to validators.
- [x] Allow validator functions to return an error object or `undefined`.
- [x] Make `array()` nodes iterable so Angular `@for` can iterate their child nodes directly.
- [x] Choose `[formNode]` as the node-binding directive name.
- [x] Bind aggregate forms to native `<form [formNode]="form">` elements.
- [x] Support Angular `ControlValueAccessor` custom controls and expose compatible `NgControl` integration.
- [x] Automatically support Angular `FormValueControl` and `FormCheckboxControl`, retaining `provideFormNodeControl()` as the explicit fallback.
- [x] Remove the explicit signal-control provider after narrowing zero-configuration signal-control discovery to Angular components.
- [x] Synchronize applicable native and signal-control state such as disabled, readonly, required, invalid, touched, and dirty.
- [x] Document the supported custom-control integration paths.
- [x] Reach and enforce high test coverage, including dedicated type, template, package-consumer, browser, SSR, AOT, and hydration tests.
- [x] Investigate and implement the distinction between `value()` and `controlValue()` for control-originated debounce.
- [x] Implement form submission state and native form submission integration.
- [x] Implement `update()` for field, form, and array nodes.
- [x] Implement `allErrors()` for own and descendant error aggregation while keeping `errors()` scoped to the current node.
- [x] Add Promise-based asynchronous validators with cancellation, debounce, pending state, and parent propagation.
- [x] Allow shorthand objects instead of explicit nested `form()` calls.
- [x] Store a parent node reference instead of manually propagating disabled and readonly state.
- [x] Distinguish signal properties from action methods in IntelliSense declarations.
- [x] Allow booleans, signals, and reactive functions for disabled, readonly, and hidden state.
- [x] Consider by default should be FieldType | null?
  - [x] Should allow field<string>(null) ?
- [x] Consider making the validators array second parameter optional, and allow optionally an overload to directly set the options.
- [x] Consider allowing in form()/group() that the api is also exposed in the root (not only in api property)
  but giving priority in types and also in runtime to the user defined properties during the form({}) call.
  - [x] also considering exposing as prefixed with $disabled() $markAsTouched (with dolar prefix)
- [x] Implement a shortcut on `field()` and `form()` that reports whether the node is required, taking the built-in validator with that kind into account
- [x] Make Nodes have some property to recognize if it is a root of the tree
- [x] Implement debounce for the field value.
- [x] rename variable name internalApi (i think it is not internal, but actually external exposed)
- [x] Separate types in validation.type, (e.g. observableLike should probably has its own file)
- [x] Make validators reactive by default through automatic signal dependency tracking.
  - [x] Revalidate built-in validators when the validated node value changes.
  - [x] Treat plain value snapshots as intentionally static; use a signal-reading function for reactive constraints.
  - [x] Do not add `reactive: false`; validators only track signals they actually read, while parameterized asynchronous validators provide explicit dependency control.
- [x] Allow `validators` to be a reactive function that returns validators conditionally.
- [x] In form() (or group()), allow also exposing all the .api properties, but giving priority to userDefined fields.
  - [x] Also provide a property called "controls" (or "fields") that contains only the sub-fields
- [x] Array
  - [x] Dynamic array primitives.
  - [x] in documentation (and in tests) ensure that passing a field directly is documented ( e.g. array([], field('Marco')) )
  - [x] Ensure signature allow [template/factory, initialValue, validators, options] and [template/factory, initialValue, options]
  - [x] Ensure that setting form.set({ myArray: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }] }) works properly and not weird behavior
    - [x] It should propagate the value properly
    - [x] It should create new nodes if needed
    - [x] It should delete nodes if needed
    -<i> This is not possible in FormArray of reactive forms
  - [x] Consider whether the initial value (or item count) should be passed as the first or second parameter of `array()`.
    - [x] maybe better in the second, so that it is optional, and initial value is empty array []
  - [x] Being accesible by myFormArray[0] // index
  - [x] implement map/filter etc methods, possibly implementing being an array by itself, all methods (without collision) [MAYBE NOT NEEDED, that is on the value, MAYBE YES NEEDED TO ITERATE THE FIELDS AND NOT THE VALUES]
- [x] Migrate `@Input` to `input()`
- [x] Migrate `@HostListener` to `host: { ... }`
- [x] Remove unnecessary explicit `void` return annotations and discarded-Promise `void` expressions.
- [x] Remove unnecessary `readonly` modifiers from members
- [x] Add keyInParent property to nodes
- [x] Validator framework roadmap
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
  - [x] Improve the validator model similarly to Angular 22 Signal Forms, while also allowing references to other fields and the form tree through arguments
  - [x] Export `validator()` for users to define validator functions without manually specifying the callback signature.
    - [x] Make this the recommended way to create a custom validator in a separate file where node-level contextual inference is unavailable.
      - [x] Accept the value model as a generic for `field()`, `array()`, or `form()` validators.
  - [x] Inline built-in validator option objects so `message` and date `parseAs` choices are visible directly at each call site.
  - [x] required should notify that it doesn't validate empty arrays (i think this is angular 22 signal forms behavior. in case is not, then it is not a good example)
- [x] directive
  - [x] Ensure that directive public api (in case it is referenced from the tempalte with #myFormNode), is nicely typed and useful, and hides non-public properties/methods
- [x] Add reactive internationalization support for built-in validator messages. The original guide is now consolidated in `website/docs/guides/validator-messages.md`.
- [x] Make that field(undefined) (i'd assume it'll go to null (maybe not)) also is declared as unknown
- [x] Restructure project folder structure, once project is solid and stable. think how to organize folders
- [x] Create repo to pass custom lintern rules in dlab
- [x] Allow defining global options
  - [x] example: createFormUtils({ ... globaloptionshere }) // Returns { form, field, array, group, etc... }
