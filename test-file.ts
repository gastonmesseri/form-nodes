import { signal } from '@angular/core';

import { FormNode } from './dist/types/gem-ng-forms';
import { array, asyncValidator, field, form, minLength, oneOf, required } from './src/public-api';


const myForm = form({
  api: field('something'),
  // $api: field('somethong'),
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
    age: field(0),
  }, {
    initialValue: [{ name: 'Marco', age: 30 }],
    validators: [minLength(1)],
    trackBy: 'name',
  }),
  whatIsThis: field(null),
});

myForm.whatIsThis.set(23);
myForm.whatIsThis();

myForm.sons1.insert(1)

myForm.sons1[0]?.getError('')

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
myForm2.name.disable;

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