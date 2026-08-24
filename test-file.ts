import { signal } from '@angular/core';

import { array, asyncValidator, field, form, minLength, required } from './src/public-api';

const myForm = form({
  name: field<string>('David'),
  age: field<number>(23),
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
});

const no = myForm.name

const teto = null as string | null;

const to = {} as typeof myForm.properties;

const myBooleanSignal = signal(true);

const myForm2 = form({
  name: field<string>('David'),
  age: field<number>(23),
  address: {
    city: field('Moscu', { nullable: false }),
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
  somethingDisabled: field('', [], {
    disabled: () => myBooleanSignal(),
  }),
  somethingReadonly: field('', { readonly: myBooleanSignal }),
  disabled: field('toto'),
  sons: array(() => ({
    name: field<string>(null),
    age: field<number>(null),
  }), 2),
  daughters: array({
    name: field<string>(null),
    age: field<number>(null),
  }, 1),
});

myForm2.address.api.errors().at(0)?.targetNode

myForm2.sons.at(0);
const t = myForm2.sons.value();
const myForm2Value = myForm2()
const myForm2SonsItem = myForm2.sons[0];
myForm2.sons.forEach(node => {
  node.age;
});
myForm2.name

myForm2.address.city.disabled();
myForm2.address.subaddress.city.disabled();
myForm2.address.pending();

function toto() {}


const myField1 = field('something', [required, null]);
// myForm2.address.city.parent()?.api.
// myForm2.address.city.form()?.address.

const myForm3 = form({
  name: field<string>(undefined, [required]),
  city: field('Madrid', [() => Math.random() > 0.5 ? minLength(1) : null]),
  age: field(23, {
    validators: [
      ({ value, ...rest }) => {
        // rest.api.form()?.api
        // rest.field();
        if (value()! > 0) return { kind: 'greater-than-zero' };
      },
      asyncValidator(({ api, value, ...rest }) => {
        api.dirty()
        api.value();
        rest.abortSignal;
        api.dirty();
        api.path()
        value();
        return new Promise<{ kind: string }>(() => {});
      }, {
        
      }),
      // {
      //   type: 'async',
      //   validate: ({ value }) => {

      //   },
      // }
    ],
    hidden: true,
    nullable: false,
  }),
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