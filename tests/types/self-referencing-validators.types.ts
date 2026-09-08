import { signal, type Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, asyncValidator, createFormPrimitives, equalTo, field, form, group, oneOf, required, validator } from '../../src/public-api';

const allowedOption = (items: string[], valueType: number | null) => {
  return validator<string | null>(({ value }) => {
    return valueType !== null && items.includes(value() ?? '') ? null : { kind: 'unmatched' };
  });
};

class SelectionComponent {
  availableOptions = signal<string[]>([]);

  myForm = form({
    valueType: field<number>(null, [required]),
    value: field<string>(null, [
      required,
      () => allowedOption(this.availableOptions(), this.myForm.valueType()),
    ]),
  });
}

const component = new SelectionComponent();
type _FormValue = Expect<Equal<ReturnType<typeof component.myForm>, { valueType: number | null; value: string | null }>>;
type _FieldValue = Expect<Equal<ReturnType<typeof component.myForm.value>, string | null>>;
component.myForm.value.set('alpha');
component.myForm.valueType.set(1);
// @ts-expect-error The self-reference preserves the string field contract.
component.myForm.value.set(1);
// @ts-expect-error The sibling remains a numeric field.
component.myForm.valueType.set('1');
// @ts-expect-error Unknown children are not introduced by the self-reference.
component.myForm.missing();

const primitives = createFormPrimitives({ nullable: false });
class DeclarationVariants {
  response = signal<string[]>([]);

  model = form({
    valueType: field<number>(null),
    strict: field.strict('', [required, () => allowedOption(this.response(), this.model.valueType())]),
    nullable: field.nullable<string>(null, [required, () => allowedOption(this.response(), this.model.valueType())]),
    inferred: field('', [required, () => allowedOption(this.response(), this.model.valueType())]),
    unknown: field(null, [required, () => allowedOption(this.response(), this.model.valueType())]),
    options: field<string>(null, { validators: [required, () => allowedOption(this.response(), this.model.valueType())] }),
    undefined: field<string>(undefined, [required, () => allowedOption(this.response(), this.model.valueType())]),
    configured: primitives.field('', [required, () => allowedOption(this.response(), this.model.valueType())]),
    configuredNullable: primitives.field.nullable<string>(null, [required, () => allowedOption(this.response(), this.model.valueType())]),
  });
}
const variants = new DeclarationVariants();
type _Strict = Expect<Equal<ReturnType<typeof variants.model.strict>, string>>;
type _Nullable = Expect<Equal<ReturnType<typeof variants.model.nullable>, string | null>>;
type _Inferred = Expect<Equal<ReturnType<typeof variants.model.inferred>, string | null>>;
type _Unknown = Expect<Equal<ReturnType<typeof variants.model.unknown>, unknown>>;
type _Options = Expect<Equal<ReturnType<typeof variants.model.options>, string | null>>;
type _Undefined = Expect<Equal<ReturnType<typeof variants.model.undefined>, string | null | undefined>>;
type _Configured = Expect<Equal<ReturnType<typeof variants.model.configured>, string>>;
type _ConfiguredNullable = Expect<Equal<ReturnType<typeof variants.model.configuredNullable>, string | null>>;

class AggregateVariants {
  root = form({ name: field('') }, [() => this.root.name() ? null : { kind: 'missing' }]);

  options = form({ name: field('') }, { validators: [() => this.options.name() ? null : { kind: 'missing' }] });

  branch = group({ name: field('') }, [() => this.branch.name() ? null : { kind: 'missing' }]);

  rows = array({ name: field('') }, { validators: [() => this.rows().length ? null : { kind: 'empty' }] });

  configured = primitives.form({ name: field('') }, [() => this.configured.name() ? null : { kind: 'missing' }]);

  factoryRows = array(() => ({ name: field('') }), { validators: [() => this.factoryRows().length ? null : { kind: 'empty' }] });

  positionalRows = array({ name: field('') }, 1, [() => this.positionalRows().length ? null : { kind: 'empty' }]);

  configuredGroup = primitives.group({ name: field('') }, [() => this.configuredGroup.name() ? null : { kind: 'missing' }]);

  configuredRows = primitives.array({ name: field('') }, { validators: [() => this.configuredRows().length ? null : { kind: 'empty' }] });

}
const aggregates = new AggregateVariants();
type _Root = Expect<Equal<ReturnType<typeof aggregates.root>, { name: string | null }>>;
type _FormOptions = Expect<Equal<ReturnType<typeof aggregates.options>, { name: string | null }>>;
type _Group = Expect<Equal<ReturnType<typeof aggregates.branch>, { name: string | null }>>;
type _Array = Expect<Equal<ReturnType<typeof aggregates.rows>, { name: string | null }[]>>;
type _ConfiguredRoot = Expect<Equal<ReturnType<typeof aggregates.configured>, { name: string | null }>>;

// Explicitly omitted options retain the existing positional call signatures.
field('', [required], undefined);
field('', undefined, undefined);
field.strict('', [required], undefined);
field.nullable('', [required], undefined);
form({ name: field('') }, [required], undefined);
array({ name: field('') }, 1, [required], undefined);
primitives.field('', [required], undefined);
// @ts-expect-error Options objects cannot occupy the positional validator argument of a three-argument call.
field('', { disabled: true }, { hidden: true });
// @ts-expect-error Form options cannot be supplied twice.
form({ name: field('') }, { disabled: true }, { hidden: true });
// @ts-expect-error Array options cannot be supplied twice after positional initial data.
array({ name: field('') }, 1, { disabled: true }, { hidden: true });

type _FactoryRows = Expect<Equal<ReturnType<typeof aggregates.factoryRows>, { name: string | null }[]>>;
type _PositionalRows = Expect<Equal<ReturnType<typeof aggregates.positionalRows>, { name: string | null }[]>>;
type _ConfiguredGroup = Expect<Equal<ReturnType<typeof aggregates.configuredGroup>, { name: string | null }>>;
type _ConfiguredRows = Expect<Equal<ReturnType<typeof aggregates.configuredRows>, { name: string | null }[]>>;

const status = field<'draft' | 'published' | 'archived'>('archived', [
  oneOf(['draft', 'published']),
  equalTo('draft'),
]);
type _Status = Expect<Equal<ReturnType<typeof status>, 'draft' | 'published' | 'archived' | null>>;
field<1 | 2>(2, [equalTo(1), oneOf([1])]);
field<'draft' | 'published'>('draft', { validators: [oneOf(['draft']), equalTo('published')] });
const standaloneOptions = oneOf(['draft', 'published'], { when: ({ value }) => {
  type _Value = Expect<Equal<ReturnType<typeof value>, string | null | undefined>>;
  return value() !== null;
} });
const standaloneEquality = equalTo('draft', { when: ({ value }) => {
  type _Value = Expect<Equal<ReturnType<typeof value>, string | null | undefined>>;
  return value() !== '';
} });
field('archived', [standaloneOptions]);
field.strict('archived', [standaloneEquality]);
// @ts-expect-error Standalone string constraints remain incompatible with numeric fields.
field(1, [standaloneOptions]);
// @ts-expect-error Standalone string equality remains incompatible with numeric fields.
field.strict(1, [standaloneEquality]);

const matchedId = (ids: any[], valueType: any) => validator<string | null>(({ value }) => {
  const id = ids.find(entry => entry === value());
  return !id && valueType > 3 ? { kind: 'unmatched' } : null;
});

const getSomeError = (a: any, b: any) => ({ kind: 'something' });

class CompleteSelfReference {
  ids = signal(['1', '2', '3']);

  myForm = form({
    valueType: field<number>(null, [required]),
    value: field<string>(null, [
      required,
      () => matchedId(this.ids(), this.myForm.valueType()),
      () => this.myForm.valueType() ? { kind: '' } : null,
      () => ({ kind: '', message: '' }),
      () => ({ kind: '' }),
    ]),
    value2: field<string>(null, [
      required,
      () => matchedId(this.ids(), this.myForm.valueType()),
      () => this.myForm.valueType() ? { kind: '' } : null,
      () => ({ kind: '', message: '' }),
      () => ({ kind: '' }),
      () => ({ kind: '', message: '' }),
    ]),
    value3: field<string>(null, [
      required,
      () => this.myForm.valueType() ? { kind: '' } : null,
      () => ({ kind: '' }),
      () => ({ kind: '', message: '' }),
      () => matchedId(this.ids(), this.myForm.valueType()),
    ]),
    value4: field<string>(null, [
      required,
      () => this.myForm.valueType() ? { kind: '' } : null,
      () => ({ kind: '' }),
      () => ({ kind: '', message: '' }),
      () => matchedId(this.ids(), this.myForm.valueType()),
      validator(() => getSomeError(this.ids(), this.myForm.valueType())),
    ]),
    value5: field<string>(null, [
      required,
      () => this.myForm.valueType() ? { kind: '' } : null,
      () => ({ kind: '' }),
      () => ({ kind: '', message: '' }),
      () => matchedId(this.ids(), this.myForm.valueType()),
      validator(() => getSomeError(this.ids(), this.myForm.valueType())),
      validator(() => matchedId(this.ids(), this.myForm.valueType())),
      asyncValidator(async () => ({ kind: '' })),
      asyncValidator(async () => {
        return matchedId(this.ids(), this.myForm.valueType()) ? { kind: '' } : null;
      }),
    ]),
    some: field('', () => {
      if (this.myForm.valueType()) return { kind: '' };
      return null;
    }),
    some1: field('', () => this.myForm.valueType() ? { kind: '' } : null),
    some2: field('', [() => {
      if (this.myForm.valueType()) return { kind: '' };
      return null;
    }]),
    some3: field('', [() => this.myForm.valueType() ? { kind: '' } : null]),
    some4: field<string>(null, () => {
      const valueType = this.myForm.valueType();
      const ids = this.ids();
      return [required, matchedId(ids, valueType)];
    }),
    some5: field('', {
      validators: [
        required,
        () => matchedId(this.ids(), this.myForm.valueType()),
        () => this.myForm.valueType() ? { kind: '' } : null,
      ],
    }),
  });
}
const complete = new CompleteSelfReference();
type _CompleteForm = Expect<Equal<ReturnType<typeof complete.myForm>, {
  valueType: number | null;
  value: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null;
  value5: string | null;
  some: string | null;
  some1: string | null;
  some2: string | null;
  some3: string | null;
  some4: string | null;
  some5: string | null;
}>>;
// @ts-expect-error Returning a validator array must preserve the field's string value contract.
complete.myForm.some4.set(123);

// Explicit callback contexts remain usable when helpers are declared outside a node.
const annotatedSync = validator(({ value }: { value: Signal<string | null> }) => value() ? null : { kind: 'empty' });
const annotatedAsync = asyncValidator(async ({ value }: { value: Signal<string | null> }) => value() ? null : { kind: 'empty' });
field('', [annotatedSync, annotatedAsync]);

type _AnnotatedSync = Expect<Equal<Parameters<typeof annotatedSync>[0]['value'], Signal<string | null>>>;
type _AnnotatedAsync = Expect<Equal<Parameters<typeof annotatedAsync>[0]['value'], Signal<string | null>>>;
// @ts-expect-error Context-taking asynchronous callbacks must return asynchronous results.
asyncValidator<string>((_context) => null);
// @ts-expect-error An explicitly annotated reusable validator keeps its value compatibility.
field(1, [annotatedSync]);
