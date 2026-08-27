# TODO

## Up next

- Array
  - Add here topics to Array
  - Check if array() supports having a null value (check if anything breaks if setting the value to null or undefined, myArray.set(null))
  - Document properly in intellisense that the first param is the template or factory , with examples
  - Array should have "patch" method? (probably not)
- <!> important. Consider including hidden access to .api that is not .api, (maybe $api, or _api) because user defined properties could collide with it
  and then the form() framework will not work because it uses it on the internal system
- Public api
  - Consider exporting types with some sort of prefix like NgValidator GemFormsValidator (or something similar)
- Validators
  - Implement getError() function in the node, similar to angular 22 signal forms
  - Consider changing 'kind' to 'type' in validators
  - Implement other params in validator function (right now is only value)
  - Implement basic validators (get from lab)
    - And add default messages for each
    - Review required overload and make it work like in lab
  - being reactive or not by default (probably yes but optionally with option that reactive: false)
    - in case is reactive, make it also tick when value has changed (in case i declared value as the value and not as a signal)
  - value probably is simpler to make it directly the value, and not a signal() wrapping the value
  - Each validator should have a very descriptive behavior in is JSDoc
   - e.g. required should notify that it doesn't validate empty arrays (i think this is angular 22 signal forms behavior. in case is not, then it is not a good example)
  - Improve validators model, similar to Angular 22 signal forms, but also allow referencing other fields, and also de form tree (as arguments)
  - In validator function, allow returning an object { kind: string; message: string }, but also allow not returning anything (undefined)
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
  V- Shortcut for group() // done
- directive
  - define name
    - [formNode] // top, i am really passing a form-node to the directive
    - [bindField]
    - [fieldControl]
    - [formBind]
    - [ngField]
    - [field]
    - [gemField]
  - Ensure that the angular "@for" in the template, supports iterating the myForm.myArray
    - e.g. 
      @for (house of form.houses) {
        <input type="text" [formNode]="house.city">
        <input type="text" [formNode]="house.country">
      }
      // maybe better name for the example "houseNode"
  - allow alternative predefined names for directive
  - allow dynamic name for directive (in case is possible for example creating a form)
    . e.g. providers: [MyFormField.withName('myCustomDirectiveName')]
  - Allow hooking to existing angular apis
    - control value accesor
    - new angular ways of defining custom controls (maybe [value] input? i don't remember)
  - Make the directive sync disabled/readonly/required attributes like in angular signal forms 22.
    - maybe there are more attributes synced, check in angular implementation
    - (from angular docs) The [formField] directive also syncs field state for attributes like required, disabled, and readonly when appropriate.
    - Have into account that a custom component can have an input called [disabled] and maybe this should be also used? (or maybe not and it should be implemented explicitly in the custom control component)
    - It seems my implementation already binds from formNode to the attributes, but probably is also reasonable to bind from the attributes (or other inputs like [disabled] in the component) to the node
  - Control-value-accessor or template directives.
  - Ensure that directive public api (in case it is referenced from the tempalte with #myFormNode), is nicely typed and useful, and hides non-public properties/methods
  - Ensure whether we need to have angular forms as package dependency, or we can create an abstraction like we did with isObservableLike....
  - Ensure all types of defining custom controls are documented and handled by the directive
- Add very descriptive intellisense for every property in public api, (options, calls, etc, properties)
- Add keyInParent property to nodes
  - also add other missing properties (disabledReasons, etc)
- Create group() aside of form() (similar but without submit, maybe something else that i am missing to have into account)
- Think about what is a good name to use in the examples for the form instance
  - e.g.
  form = form({ 
    name: field(''),
    age: field(23),
  });
  // later in the template <input type="text" [formNode]="form.name">
  // 'form' is good for the instance? maybe formModel, maybe myForm? maybe personForm?
- Request chat to implement or aim to a test coverage 100% at least in form() array() field()
- Implement shorthand for required in the field options similar to disbled
- Investigate difference in angular 22 signal forms between controlValue and value properties
- initial value should be null or undefined? (for field())
  - and for array?
- Rename to something generic like @ng-tools/forms (maybe)
- In the future allow something like dynamic forms from a JSON or object definition
  - Schema-driven form generation from JSON definitions.
- Allow always myForm.$api in form()/group() in case the user wants to declare de property api (always user priority)
- Submission state.
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
- Document properly how to implement a custom control (preferably with angular native way)
- Docuemnt that test coverability is high
- Check with chatgpt, how to improve as max as possible a nice package.json metadata for this project
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
- Consider implementing update() (like in signal.update) for the nodes
- Consider an alternative name for ".api"
- Add debounce to synchronous validators, probably also with a factory function validator(() => ...)
- TRY TO MAKE ASYNC VALIDATORS ALSO BEING THE RESULT OF A COMPOSABLE VALIDATION FUNCTION.
  - at the moment this is not possible.
- Consider cleaning the form() array() field() files, (maybe a class?)
- Also consider exporting the main functions with the following names: ngForm, ngField, ngArray
- Add support for submit in the form object, something like onSubmit. maybe look for the parent form with the directive formField (or my name of the directive)
  - maybe allow another directive for setting the form in a <form [formField]="myForm">
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
- gpt tasks alignment:
controlValue() en form() y array()
Angular lo expone en todos los nodos. Nosotros solo en field(). Conviene esperar a definir cómo se agregan valores pendientes de descendientes.
- Add ESLINt with vt rules

Debounce más general
Nosotros admitimos milisegundos en field(). Angular permite debouncers asíncronos cancelables, herencia desde ancestros y estrategias como blur. Nuestra implementación ya cancela timers correctamente, pero es menos expresiva.

Forma pública de controlValue
Angular expone un WritableSignal; nosotros un Signal readonly más setControlValue(). Es una diferencia deliberada de API y prefiero nuestra versión porque distingue claramente el origen del cambio:
field.set(value);             // aplicación
field.setControlValue(value); // control

Identidad en array.set()
Nosotros reconciliamos por índice. Angular conserva automáticamente la identidad de elementos objeto cuando se reordenan.

Nodos eliminados
Nosotros convertimos un nodo eliminado en un nodo raíz independiente y utilizable. Angular lo considera orphan. Hay que decidir qué comportamiento resulta más útil.

errorSummary()
Angular diferencia:
errors();       // errores propios
errorSummary(); // propios y descendientes
Nosotros solo tenemos errors(), aunque invalid() sí agrega el estado descendiente.

disabledReasons()
Angular conserva las reglas y ancestros responsables del estado disabled. Nosotros solo exponemos el booleano.

Debounce agregado en forms y arrays
Relacionado con el primer punto. Si se implementa:
form.flush();
probablemente debería hacer flush sobre todos los descendientes, como ya dejamos planteado en behavior.md.

Tracking estructural desde el modelo
Angular crea y elimina nodos automáticamente según el array almacenado en el signal. Nosotros usamos template/factory y métodos estructurales. Es una diferencia arquitectónica deliberada que no intentaría eliminar.

## Ideas

-

## Pending decisions

-

## Bugs

- [ ]

## Completed

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
- Implement debounce for the field value
- rename variable name internalApi (i think it is not internal, but actually external exposed)
- Separate types in validation.type, (e.g. observableLike should probably has its own file)
- Add support for debounce in field()
- normal validators
  - when { value } is accesed, then revalidate
  - pass parent
  - think on way of passing the root form, typed
  - pass path (string[])
  - pass way of getting something from the siblings, or the form itself
  - maybe allow passing a function to validators property (or array in arguments) that takes api as argument, and returns an array of validators, maybe... (this allows typing properly the asyncValidator for example)
- to FieldContext PASS THE form() in the context, like the root, like passing the root node (thinking
  that form() will not be the same as group())
- In form() (or group()), allow also exposing all the .api properties, but giving priority to userDefined fields. 
  - Also provide a property called "controls" (or "fields") that contains only the sub-fields
- form/group deberian llevar algo llamado controls/fields, para que uno pueda acceder, quiza como un proxy, a los controles de manera segura, cuando typescript pierde el tipado
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