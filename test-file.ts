import { signal } from '@angular/core';

import { FormNode } from './dist/types/gem-ng-forms';
import { array, asyncValidator, createFormPrimitives, email, field, form, FormValueContract, group, min, minLength, oneOf, required, validator } from './src/public-api';

type Company = { companyId: number; companyName: string }
const appleCompany: Company = { companyId: 23, companyName: 'Apple' };
class Something { };
const somethingInstance = new Something();
// const field<T> = {} as any;

const myForm = form({
  api: field('something'),
  // $api: field('somethong'),
  name: field<string>('David'),
  age: field<number>(23),
  myArray: field.strict<string>(''),
  address: {
    city: field('Moscu'),
    country: field('Rusia'),
  },
  properties: array({
    city: field(''),
    country: field(''),
  }, [], {
    trackBy: v => v.city,
  }),
  // childs: [{
  //   city: field(''),
  //   country: field(''),
  // }],
  maybeName: field(null),
  sons1: array({
    name: field(''),
    age: field(0),
  }, {
    debounce: 200,
  }),
  sons2: array({
    name: field('', [required, oneOf(['a', 'b', 'c'])]),
    age: field(0),
  }, [], {
    // initialValue: 2,
    // trac
    // ini
    // initi
    // initialValue: [],
    trackBy: (_, i) => i,
    disabled: true,
    // submission: 
    
  }),
  // a: array()
  items: array({
    name: field(''),
    age: field(null),
  }, {
    initialValue: [{ name: 'Marco', age: 30 }],
    validators: [minLength(1)],
    trackBy: 'name',
  }),
  whatIsThis: field(undefined),
  something: field(''),
  // a: field(2)

  someNumber: 23,
  someGroup: {
    username: 'andres',
    age: 20,
  },

  someDate: new Date(),
  someNesting: {
    for: '',
    a: 2,
    test: true,
  },
  company: appleCompany,
  myMap: new Map(),
  somethingInstance: somethingInstance,
  someGroupy: group({
    a: field(''),
    b: field(2),
    c: field(true),
  }, [ctx => ctx.value() ? { kind: '' } : null]),
});


myForm.company;
myForm.someDate.value();
myForm.somethingInstance
myForm.someNesting.test()
// const a = myForm.company()
// myForm.company.


myForm.someGroup.username()
// claro creo que tampoco necesitariamos un arbol completo de FieldTree, es decir, solo con un nodo de FieldTree que se bindee a un [formField] yo creo que podriamos reflejar y recibir entre ese nodo y nuestro nodo de nuestra libreria

myForm.whatIsThis.set(23);
myForm.whatIsThis();
myForm.name.$field;
myForm.address.city();
myForm.$field();
myForm.$field().errorSummary;
myForm.$field.toString;
myForm.name.debouncing;
myForm.items[0]?.age.set(23);
myForm.items[0]?.name.set('');
myForm.items.set;
myForm.items.allErrors()

const shorthandForm = form({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const username = shorthandForm.username() // ''
const emailValue = shorthandForm.email() // ''
const password = shorthandForm.password() // ''
const confirmPassword = shorthandForm.confirmPassword() // ''
shorthandForm.username.nodeType() === 'field' // true

const addedWithShorthand = shorthandForm.add({
  someStringField: '',
  someNumberField: 23,
});
addedWithShorthand.someStringField();


// myForm.

// const boundControl = injectBoundControl();
// boundControl.required();

const addResult = myForm.add({ test: field('') })
myForm.remove('');
myForm.get('test')?.set('Lia');

const tota = myForm.children.nonExisting?.value();

myForm.sons1.insert(1)

myForm.sons1[0]?.getError('required');

const directiveInstance: FormNode<typeof myForm.age> = {} as any;
const nodeFromDirective = directiveInstance.node();
// directiveInstance.

myForm.name.focus;

myForm.address.city();

const maybeNameKeyInParent = myForm.maybeName.keyInParent();

const myFormKeyInParent = myForm.keyInParent();

const teto = null as string | null;

const to = {} as typeof myForm.properties;

const myBooleanSignal = signal(true);

const myForm2 = form({
  name: field<string>('David'),
  age: field<number>(23),
  address: {
    city: field.strict('Moscu'),
    country: field('Rusia'),
    subaddress: {
      city: field('Madrid'),
      country: field('Spain', { 
        validators: [
          // ctx => ctx.form()?.api.
        ],
      }),
    },
  },

  nested: {
    a: field.strict<string>(''),
    subForm: form({
      subField: 2,
      subGroup: {
        username: field(''),

        email: field('', [
          (ctx) => {
            if (myForm2.address.disabled()) return { kind: 'addressDisabled' };
            ctx.field().value();
            ctx.value();
          },
          validator((ctx) => {
            ctx.field().value();
            ctx.value();
          }),
          asyncValidator(async (ctx) => {
            ctx.field().value();
            ctx.value();
            ctx.value()?.trimEnd();
          }),
        ]),

      },
    }, [
      (ctx) => {
        ctx.field().value();
        ctx.value();
        ctx.value()?.subField?.toExponential();
      },
      validator((ctx) => {
        ctx.field().value();
        ctx.field().subField();
        ctx.node().subField();
        ctx.value();
      }),
      asyncValidator(async (ctx) => {
        ctx.field().value();
        ctx.value();
      }),
    ]),
  },

  somethingDisabled: field('', [], {
    disabled: () => myBooleanSignal(),
  }),
  somethingReadonly: field('', { readonly: myBooleanSignal }),
  disabled: field('toto'),

  sons: array(() => ({
    name: field<string>(null),
    age: field<number>(null),
  }), 2, [
    (ctx) => {
      ctx.field().value()
      ctx.value()
      ctx.value()[0]?.age?.toExponential();
    },
    validator((ctx) => {
      ctx.field().value();
      ctx.value();
    }),
    asyncValidator(async (ctx) => {
      ctx.field().value();
      ctx.value();
    }),
  ]),

  daughters: array({
    name: field<string>(null),
    age: field<number>(null),
  }, 1),
});

// myForm2.address.root().address

const _myForm2Value = myForm2();
myForm2.nested.subForm.subGroup.username.root().address()

export const { form: fForm, group: fGroup, field: fField, array: fArray } = createFormPrimitives({ nullable: false, });
export const { form: xForm, group: xGroup, field: xField, array: xArray } = createFormPrimitives({ nullable: false });
export const { form: aForm, group: aGroup, field: aField, array: aArray } = createFormPrimitives({ nullable: false });


const myValidatorCustom1 = validator<any>((ctx) => {
  // ctx.field().
  if (ctx.value()) return { kind: 'somo', message: '' }
});


// const field = {} as any;

const myFormNon = form({
  username: field(''),
  email: field.strict(''),
  company: field(2, [min(1)]),
  url: field.strict(''),
  subarray: array({
    username: field(''),
    email: field('', [email]),
  }, {
    validators: [minLength(2)],
  }),
  a: field(),
  b: field<string>(),
  c: field.nullable<string>(),
  // d: field.strict<string>(),
});
myFormNon.a()
myFormNon.b()
myFormNon.c()

// const fForm = form;
// const fField = field;
// const fArray = array;
// const fGroup = group;

const myFormHere = fForm({
  username: fField(''),
  email: fField(''),
});

const myFormThere = xForm({
  username: xField(''),
  email: xField(''),
});

const myFormSomewhere= aForm({
  username: aField(''),
  email: aField(''),
});

const myFormHereValue = myFormHere();

myForm2.address.api.errors().at(0)?.targetNode

myForm2.sons.at(0);
const t = myForm2.sons.value();
const myForm2Value = myForm2()
const myForm2SonsItem = myForm2.sons[0];
myForm2.sons.forEach(node => {
  node.age;
});
myForm2.name.disable;

myForm2.address.city.disabled();
myForm2.address.subaddress.city.disabled();
myForm2.address.pending();

type MyForm = {
  username: string | null;
  items: string[] | null;
}

const typedForm = form({
  username: field(''),
  items: field<string[]>(),
}) satisfies FormValueContract<MyForm>;

const mySuperForm = form({
  name: field(''),
  email: field.strict<number>(2),
})
const mySuperValue = mySuperForm();

function toto() {}


const myField1 = field('something', [required, null]);
// myForm2.address.city.parent()?.api.
// myForm2.address.city.form()?.address.

const myForm3 = form({
  name: field<string>(undefined, [required]),
  city: field('Madrid', [() => Math.random() > 0.5 ? minLength(1) : null]),
  age: field.strict(23, {
    validators: [
      ({ value, ...rest }) => {
        if (value()! > 0) return { kind: 'greater-than-zero' };
      },
      asyncValidator(({ value, node, ...rest }) => {
        node().dirty()
        node().value();
        rest.abortSignal;
        node().dirty();
        node().path()
        value();
        return new Promise<{ kind: string }>(() => {});
      }, {
        // debounce: 'blur'
      }),
      required,
      ctx => ctx.value()! < 18 ? { kind: 'notAdult' } : null,
      // {
      //   type: 'async',
      //   validate: ({ value }) => {

      //   },
      // }
    ],
    hidden: true,
  }),
});

const myFormTestSomething = form({
  name: field<string>(undefined, [required]),
  city: field('Madrid', [() => Math.random() > 0.5 ? minLength(1) : null]),
  age: field.strict(23, {
    validators: [
      required,
      ctx => ctx.value()! < 18 ? { kind: 'notAdult' } : null,
    ],
    hidden: true,
  }),
});

const myAsyncValidator = asyncValidator<string>(async ({ value }) => {
  const val = value();
  return { kind: '' };
});

class MyCompon {
  myForm3 = form({
    name: field<string>(undefined, [required]),
    age: field(23, {
      validators: [
        (context) => {
          if (this.myForm3.name()) return { kind: 'no-sibling-name' }
        },
      ],
    }),
  });
}
