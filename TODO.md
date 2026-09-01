# TODO

## Up next

- Array
  - Check if array() supports having a null value (check if anything breaks if setting the value to null or undefined, myArray.set(null))
  - Document properly in intellisense that the first param is the template or factory , with examples
  - Array should have "patch" method? (probably not)
- <!> important. Consider including hidden access to .api that is not .api, (maybe $api, or _api) because user defined properties could collide with it
  and then the form() framework will not work because it uses it on the internal system
- Public api
  - Consider exporting types with some sort of prefix like NgValidator GemFormsValidator (or something similar)
  - Audit existing public configuration types and inline small consumer-relevant unions so IntelliSense shows the accepted values directly. Review validator options and other aliases that may currently hide useful choices, while retaining named types when they are independently valuable to consumers.
- Validators
  - Consider changing 'kind' to 'type' in validators
  - Implement basic validators (get from lab)
    - And add default messages for each
    - Review required overload and make it work like in lab
  - being reactive or not by default (probably yes but optionally with option that reactive: false)
    - in case is reactive, make it also tick when value has changed (in case i declared value as the value and not as a signal)
  - value probably is simpler to make it directly the value, and not a signal() wrapping the value
  - Each validator should have a very descriptive behavior in is JSDoc
   - e.g. required should notify that it doesn't validate empty arrays (i think this is angular 22 signal forms behavior. in case is not, then it is not a good example)
  - Improve validators model, similar to Angular 22 signal forms, but also allow referencing other fields, and also de form tree (as arguments)
  - Consider maybe exporting something like "validator()" function, for users to define validator functions without needing to specify signature
    - make this the recommended way of creating a custom validator in a separated file (without type inference)
      - maybe pass a generic with the value model (for field() array() or form())
  - Check how 1 validator maybe can set errors in several Nodes (remind of lab case)
   .  Also handle cases like in lab, like addErrors, and those
  - Check what model of errors() other libraries return, and decide for the best system
  - implement debounce for synchronous validators
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
  - Ensure that directive public api (in case it is referenced from the tempalte with #myFormNode), is nicely typed and useful, and hides non-public properties/methods
- Check if accessing angular signal node (e.g. mySignal[ɵSIGNAL]) is safe and public (it is exported in angular/core)
- Investigate how other angular libraries perform versioning,
  - e.g. do they use the version name as the same as angular current version?
  - do they support previous versions?
- Move interation-tests/type-tests/testing folders into a single folder (maybe called testing or tests)
- Implement ESLint
- Ensure that disabledReasons also doesn't fail when it references self form root, when it is declared with a reactive function
- Consider nesting disabledReasons in myForm.myField.disabled.reasons();
- Make our required() handling to be compatible with angular material (ensure angular material detects our required() handling to display the required mark)
  - maybe other ones that are not required, min(), max(), etc
- Add precise instructions on how to use the library (e.g. angular imports, etc)
- Consider @gemgular/forms name for library
- Add good docs about implementing a custom control (support for focus, etc, angular CVA, form value accessor, etc)
- Create useFormNode() utility (or inject(FormNode)) to allow a custom component to access easily the formNode or even better to access some sort of signal based api that allows handling
  both formNode and formField (access formNode or formField state, or even formControl), something useful for the consumer and generic. So that inside the component it can for example
  access the errors() or something like that
- Re-evaluate `FormValueControl` interoperability on every Angular upgrade. Replace the isolated `ɵSIGNAL`/`InputSignalNode` adapter with a public Angular mechanism as soon as one exists (for example, public access to the host component's `ComponentRef.setInput()` or a dedicated Signal Forms interoperability protocol). Preserve the AOT, SSR, hydration, OnPush, and real-browser test matrix during that migration. Until then, recommend `provideFormNodeControl()` when consumers require the explicit compatibility path.
- Add very descriptive intellisense for every property in public api, (options, calls, etc, properties)
- Ensure that disabled input on a custom component, works better than in reactive forms (message in console that it displays)
  - Although maybe it could have some collision with the new angular way of defining custom controls (for example, now disabled is passed as an input, and i suppose that the form() disabled will be there). Think about that.
- also add other missing properties besides of keyInParent (disabledReasons, etc)
- Create group() aside of form() (similar but without submit, maybe something else that i am missing to have into account)
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
- Add support for internationalization, (and also make it reactive) (e.g. also validator messages)
- Maybe, allow the components implementing it, to define errors inside the component into the field() (maybe, like the invalid date in the VtInputDateComponent)
- Make components easily hookable to the formField (of this library, e.g. to display errors, or display required, etc, nice custom component implementation api)
- Restructure project folder structure, once project is solid and stable. think how to organize folders
- Allow defining global options
  - example: createFormUtils({ ... globaloptionshere }) // Returns { form, field, array, group, etc... }
- Add support for validators defined by string (e.g. 'required|minLength:2') [like in vue]
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
- Check OTHER LIBRARIES, to see how can i improve the api, adding more features, etc
- Consider doing the following:
  maybeName: field(null),
  if field es initialized with null, then the inferred type of the field() value shouldn't 
  be 'null', but 'any'
- To make it safe to use (similar to what we did with self-referencing root in validators), ensure
  that disabled, readonly, etc, also allow referencing safely something that hasn't been created yet
  (e.g. referencing a signal that is at the bottom of the file [through a function]).
- gpt tasks alignment:
controlValue() en form() y array()
Angular lo expone en todos los nodos. Nosotros solo en field(). Conviene esperar a definir cómo se agregan valores pendientes de descendientes.
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

## Ideas

-

## Pending decisions

-

## Bugs

- [ ]

## I think is finished

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
- Make synchronous validators reactive to every signal read from their callback, including the field value.
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
