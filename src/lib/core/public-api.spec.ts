import { signal, type Signal } from '@angular/core';
import { describe, expectTypeOf, it } from 'vitest';

import { form } from './primitives/form';
import { field } from './primitives/field';
import { group } from './primitives/group';
import { array } from './primitives/array';
import { min } from './validation/validators/min';
import type { DynamicNode, Node } from './types/node.type';
import { required } from './validation/validators/required';
import { asyncValidator } from './validation/async-validator';
import { requiredIf } from './validation/validators/required-if';
import type { ComposableValidator, FieldContext, ValidationError, ValidatorApi, ValidatorContext } from './validation/validation.type';

describe('types', () => {
  it('infers concise field definitions and nested groups', () => {
    const profile = form({
      name: '',
      age: null,
      siblings: 2,
      birthday: new Date(),
      sister: undefined,
      address: { city: 'Zurich' },
    });

    expectTypeOf(profile.name()).toEqualTypeOf<string | null>();
    expectTypeOf(profile.age()).toEqualTypeOf<unknown>();
    expectTypeOf(profile.siblings()).toEqualTypeOf<number | null>();
    expectTypeOf(profile.birthday()).toEqualTypeOf<Date | null>();
    expectTypeOf(profile.sister()).toEqualTypeOf<unknown>();
    expectTypeOf(profile.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(profile()).toEqualTypeOf<{
      name: string | null;
      age: unknown;
      siblings: number | null;
      birthday: Date | null;
      sister: unknown;
      address: { city: string | null };
    }>();

    const arrays = form({ roles: ['admin'], empty: [] });
    expectTypeOf(arrays.roles()).toEqualTypeOf<string[] | null>();
    expectTypeOf(arrays.empty()).toEqualTypeOf<unknown[] | null>();
    expectTypeOf(arrays.roles.nodeType()).toEqualTypeOf<'field'>();
    expectTypeOf(arrays.empty.nodeType()).toEqualTypeOf<'field'>();
  });

  it('contextually types built-in validator when callbacks', () => {
    min(18, {
      when: ({ value, touched, path }) => {
        expectTypeOf(value()).toEqualTypeOf<number | null>();
        expectTypeOf(touched()).toEqualTypeOf<boolean>();
        expectTypeOf(path()).toEqualTypeOf<readonly string[]>();
        return true;
      },
    });
  });

  it('types requiredIf as a reactive validator with message options', () => {
    const condition = signal(true);
    const validator = requiredIf(() => condition(), { message: () => 'Required now.' });

    expectTypeOf(validator).toMatchTypeOf<ComposableValidator<unknown>>();
    field('', [validator]);
  });

  it('infers dynamic array values, items, parents, and root form', () => {
    const profile = form({
      sons: array(() => ({ name: field(''), age: field(23) }), [{ name: 'Mono', age: 11 }]),
    });
    const son = profile.sons.at(0)!;

    expectTypeOf(profile.sons()).toEqualTypeOf<{ name: string | null; age: number | null }[]>();
    expectTypeOf(son.name()).toEqualTypeOf<string | null>();
    expectTypeOf(son.parent()).toEqualTypeOf<typeof profile.sons | null>();
    expectTypeOf(son.name.form()).toEqualTypeOf<typeof profile | null>();
    expectTypeOf(profile.sons.push).toBeCallableWith({ name: 'Lia', age: 7 });
    expectTypeOf(profile.sons.push()).toEqualTypeOf<typeof son>();
  });

  it('infers dynamic arrays declared from a shorthand template', () => {
    const profile = form({
      sons: array({ name: field(''), age: field(23) }, 2),
    });
    const son = profile.sons.at(0)!;

    expectTypeOf(profile.sons()).toEqualTypeOf<{ name: string | null; age: number | null }[]>();
    expectTypeOf(son.name()).toEqualTypeOf<string | null>();
    expectTypeOf(son.parent()).toEqualTypeOf<typeof profile.sons | null>();
    expectTypeOf(profile.sons.push).toBeCallableWith({ name: 'Lia', age: 7 });
    expectTypeOf(profile.sons[0]?.name()).toEqualTypeOf<string | null | undefined>();
    profile.sons.forEach((item, index, owner) => {
      expectTypeOf(item.name()).toEqualTypeOf<string | null>();
      expectTypeOf(index).toEqualTypeOf<number>();
      expectTypeOf(owner).toEqualTypeOf<typeof profile.sons>();
    });
    expectTypeOf([...profile.sons]).toEqualTypeOf<(typeof son)[]>();
    expectTypeOf(profile.sons.map(item => item.name())).toEqualTypeOf<(string | null)[]>();
    expectTypeOf(profile.sons.filter(item => item.age()! > 18)).toEqualTypeOf<(typeof son)[]>();
    expectTypeOf(profile.sons.find(item => item.age()! > 18)).toEqualTypeOf<typeof son | undefined>();
    expectTypeOf(profile.sons.findIndex(item => item.age()! > 18)).toEqualTypeOf<number>();
    expectTypeOf(profile.sons.some(item => item.invalid())).toEqualTypeOf<boolean>();
    expectTypeOf(profile.sons.every(item => item.valid())).toEqualTypeOf<boolean>();
    expectTypeOf(profile.sons.includes(son)).toEqualTypeOf<boolean>();
    expectTypeOf(profile.sons.indexOf(son)).toEqualTypeOf<number>();
    if (false) {
      // @ts-expect-error numeric item access is readonly
      profile.sons[0] = son;
    }
  });

  it('types dynamic array initial values, validator shorthand, and options', () => {
    const validate = ({ value }: FieldContext<readonly (string | null)[]>) =>
      value().length === 0 ? { kind: 'empty' } : null;
    const names = array(field(''), ['Mono'], [validate], { disabled: true });
    const emptyNames = array(field(''), validate, { readonly: true });

    expectTypeOf(names()).toEqualTypeOf<(string | null)[]>();
    expectTypeOf(emptyNames()).toEqualTypeOf<(string | null)[]>();
    expectTypeOf(names.disabled()).toEqualTypeOf<boolean>();
  });

  it('contextually types array initial values from the template', () => {
    const locations = array(
      { city: field(''), country: field('') },
      [{ city: 'Zurich', country: 'Switzerland' }],
    );

    expectTypeOf(locations()).toEqualTypeOf<{ city: string | null; country: string | null }[]>();

    if (false) {
      // @ts-expect-error every property declared by the template is required
      array({ city: field(''), country: field('') }, [{ city: 'Zurich' }]);
      // @ts-expect-error initial values cannot contain properties absent from the template
      array({ city: field(''), country: field('') }, [{ city: 'Zurich', country: 'Switzerland', zip: 8000 }]);
    }
  });

  it('contextually types array trackBy values from the template', () => {
    array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }],
      {
        trackBy: (value, index) => {
          expectTypeOf(value).toEqualTypeOf<{ id: string; name: string | null }>();
          expectTypeOf(index).toEqualTypeOf<number>();
          return value.id;
        },
      },
    );

    array(
      { city: field(''), country: field('') },
      [],
      { trackBy: value => value.city },
    );
  });

  it('infers primitive and nested dynamic arrays', () => {
    const matrix = array(() => array(() => field(0), 2), 2);
    const names = array(field('Marco'), []);

    expectTypeOf(matrix()).toEqualTypeOf<(number | null)[][]>();
    expectTypeOf(matrix.at(0)!.at(0)!()).toEqualTypeOf<number | null>();
    expectTypeOf(names()).toEqualTypeOf<(string | null)[]>();
    expectTypeOf(names.push()()).toEqualTypeOf<string | null>();
    expectTypeOf(names.push).toBeCallableWith('Lia');
  });

  it('contextually types node update callbacks', () => {
    const age = field(23);
    const profile = form({ name: field('Marco'), age });
    const names = array(field(''), ['Marco']);

    age.update((value) => {
      expectTypeOf(value).toEqualTypeOf<number | null>();
      return (value ?? 0) + 1;
    });
    profile.update((value) => {
      expectTypeOf(value).toEqualTypeOf<{ name: string | null; age: number | null }>();
      return { ...value, name: 'Mark' };
    });
    names.update((value) => {
      expectTypeOf(value).toEqualTypeOf<(string | null)[]>();
      return [...value, 'Lia'];
    });
  });

  it('does not expose internal parent mutation through Node', () => {
    type ExposesSetParent = '_setParent' extends keyof Node['$api'] ? true : false;
    type ExposesClone = '_clone' extends keyof Node['$api'] ? true : false;

    expectTypeOf<ExposesSetParent>().toEqualTypeOf<false>();
    expectTypeOf<ExposesClone>().toEqualTypeOf<false>();
  });

  it('hides native function members from validator tree nodes', () => {
    field('David', {
      validators: [({ api }) => {
        const parent = api.parent();
        const rootForm = api.form();
        if (parent && rootForm) {
          expectTypeOf(parent).toBeCallableWith();
          expectTypeOf(rootForm).toBeCallableWith();
          // @ts-expect-error native function members are intentionally hidden
          parent.apply(null);
          // @ts-expect-error native function members are intentionally hidden
          rootForm.bind(null);
        }
        return null;
      }],
      nullable: false,
    });
  });

  it('hides native function members unless a form child uses the same key', () => {
    const fieldNode = field('David');
    const plainForm = form({ age: field(23) });

    if (false) {
      // @ts-expect-error native function members are intentionally hidden
      fieldNode.apply;
      // @ts-expect-error native function members are intentionally hidden
      fieldNode.name;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.arguments;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.bind;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.call;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.caller;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.length;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.prototype;
      // @ts-expect-error native function members are intentionally hidden
      plainForm.toString;
    }

    const colliding = form({
      apply: field('apply'),
      arguments: field('arguments'),
      bind: field('bind'),
      call: field('call'),
      caller: field('caller'),
      length: field('length'),
      name: field('name'),
      prototype: field('prototype'),
      toString: field('toString'),
    });

    expectTypeOf(colliding.apply()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.arguments()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.bind()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.call()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.caller()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.length()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.name()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.prototype()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.toString()).toEqualTypeOf<string | null>();
  });

  it('types each parent through the form that owns the node', () => {
    const profile = form({
      name: field('David'),
      address: { city: field('Zurich') },
    });

    const nameParent = profile.name.api.parent();
    const addressParent = profile.address.api.parent();
    const cityParent = profile.address.city.api.parent();
    if (nameParent && addressParent && cityParent) {
      expectTypeOf(nameParent.name()).toEqualTypeOf<string | null>();
      expectTypeOf(addressParent.address.city()).toEqualTypeOf<string | null>();
      expectTypeOf(cityParent.city()).toEqualTypeOf<string | null>();
    }
  });

  it('types the root form from every node in its tree', () => {
    const profile = form({
      name: field('David'),
      address: { city: field('Zurich') },
    });

    expectTypeOf(profile.api.form()).toEqualTypeOf<typeof profile>();
    expectTypeOf(profile.name.api.form()).toEqualTypeOf<typeof profile | null>();
    expectTypeOf(profile.address.api.form()).toEqualTypeOf<typeof profile>();
    expectTypeOf(profile.address.city.api.form()).toEqualTypeOf<typeof profile | null>();
  });

  it('retains the exact root form type through ten parent levels', () => {
    const root = form({
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  level7: {
                    level8: {
                      level9: {
                        value: field('deep'),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expectTypeOf(root.level1.level2.level3.level4.level5.level6.level7.level8.level9.value.api.form())
      .toEqualTypeOf<typeof root | null>();
  });

  it('types the root form in an async validator given the refined field API', () => {
    const profile = form({ name: field('David'), age: field(23) });

    profile.age.setValidators([
      asyncValidator<number | null, typeof profile.age.api>(async ({ api }) => {
        expectTypeOf(api.form()).toEqualTypeOf<typeof profile | null>();
        return null;
      }),
    ]);
  });

  it('infers the value of each field', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
      address: form({ city: field('Zurich') }),
    });
    expectTypeOf(formGroup.age()).toEqualTypeOf<number | null>();
    expectTypeOf(formGroup.name.value()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup()).toEqualTypeOf<{
      name: string | null;
      age: number | null;
      address: { city: string | null };
    }>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string | null;
      age: number | null;
      address: { city: string | null };
    }>();
  });

  it('types control-originated value buffering on fields', () => {
    const fieldNode = field('David', { debounce: 100 });

    expectTypeOf(fieldNode.controlValue()).toEqualTypeOf<string | null>();
    expectTypeOf(fieldNode.api.controlValue()).toEqualTypeOf<string | null>();
    expectTypeOf(fieldNode.debouncing()).toEqualTypeOf<boolean>();
    expectTypeOf(fieldNode.setControlValue).toBeCallableWith('Daniel');
    expectTypeOf(fieldNode.flush).toBeCallableWith();
  });

  it('exposes form api members directly while child types win on collisions', () => {
    const formGroup = form({
      age: field(23),
      readonly: field(false),
      disabled: field('child'),
      reset: field('reset child'),
    });

    expectTypeOf(formGroup.value()).toEqualTypeOf<{
      age: number | null;
      readonly: boolean | null;
      disabled: string | null;
      reset: string | null;
    }>();
    expectTypeOf(formGroup.disabled()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.readonly()).toEqualTypeOf<boolean | null>();
    expectTypeOf(formGroup.reset()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.api.disabled()).toEqualTypeOf<boolean>();
    expectTypeOf(formGroup.api.readonly()).toEqualTypeOf<boolean>();
    expectTypeOf(formGroup.api.reset).toBeCallableWith({
      age: 30,
      readonly: true,
      disabled: 'updated',
      reset: 'updated reset',
    });
    expectTypeOf(form({ age: field(23) }).disabled()).toEqualTypeOf<boolean>();
    expectTypeOf(form({ age: field(23) }).required()).toEqualTypeOf<boolean>();
    expectTypeOf(form({ age: field(23) }).patch).toBeCallableWith({ age: 30 });
  });

  it('types required as a boolean signal while a colliding child wins', () => {
    const fieldNode = field('', [required]);
    const colliding = form({ required: field('child') });

    expectTypeOf(fieldNode.required()).toEqualTypeOf<boolean>();
    expectTypeOf(fieldNode.api.required()).toEqualTypeOf<boolean>();
    expectTypeOf(colliding.required()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.api.required()).toEqualTypeOf<boolean>();
  });

  it('types getError with its literal kind and exact target node', () => {
    const fieldNode = field('', [required]);
    const formGroup = form({ name: field('David') }, [() => ({ kind: 'formError' })]);
    const colliding = form({ getError: field('child') });
    const fieldError = fieldNode.getError('required');
    const formError = formGroup.getError('formError');

    expectTypeOf(fieldError?.kind).toEqualTypeOf<'required' | undefined>();
    expectTypeOf(fieldError?.targetNode).toEqualTypeOf<typeof fieldNode | undefined>();
    expectTypeOf(formError?.kind).toEqualTypeOf<'formError' | undefined>();
    expectTypeOf(formError?.targetNode).toEqualTypeOf<typeof formGroup | undefined>();
    expectTypeOf(formError?.applicationData).toEqualTypeOf<unknown>();
    expectTypeOf(colliding.getError()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.api.getError('missing')?.kind).toEqualTypeOf<'missing' | undefined>();
  });

  it('types form children explicitly and preserves a child collision', () => {
    const profile = form({
      name: field('David'),
      address: { city: field('Zurich') },
    });
    const colliding = form({ children: field('child'), age: field(23) });

    expectTypeOf(profile.children.name()).toEqualTypeOf<string | null>();
    expectTypeOf(profile.children.address.children.city()).toEqualTypeOf<string | null>();
    expectTypeOf(profile.api.children).toEqualTypeOf<typeof profile.children>();
    // @ts-expect-error the explicit children map is readonly
    profile.api.children.name = field('other');
    expectTypeOf(colliding.children()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.api.children.children()).toEqualTypeOf<string | null>();
    expectTypeOf(colliding.api.children.age()).toEqualTypeOf<number | null>();
  });

  it('infers shorthand nested groups', () => {
    const formGroup = form({
      name: field('David'),
      address: {
        city: field('Moscow'),
        location: {
          latitude: field(55.7558),
        },
      },
    });
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.address.location.latitude()).toEqualTypeOf<number | null>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string | null;
      address: { city: string | null; location: { latitude: number | null } };
    }>();
    expectTypeOf(formGroup.api.patch).toBeCallableWith({
      address: { location: { latitude: 47.3769 } },
    });
  });

  it('types groups as structural object nodes without submission', () => {
    const address = group({ city: field('Zurich') });

    expectTypeOf(address()).toEqualTypeOf<{ city: string | null }>();
    expectTypeOf(address.city.parent()).toEqualTypeOf<typeof address | null>();
    expectTypeOf(address.submitting()).toEqualTypeOf<boolean>();
  });

  it('types field errors as a readonly error array', () => {
    const required = ({ value }: FieldContext<string>) =>
      value() === '' ? { kind: 'required' } : null;
    const fieldNode = field('', [required], { nullable: false });
    expectTypeOf(fieldNode.errors()).toEqualTypeOf<
      readonly ValidationError.WithTargetNode<typeof fieldNode>[]
    >();
  });

  it('types form errors as a readonly error array', () => {
    const formGroup = form({ age: field(23) });
    expectTypeOf(formGroup.api.errors()).toEqualTypeOf<
      readonly ValidationError.WithTargetNode<typeof formGroup>[]
    >();
  });

  it('accepts validators on a field declared without them', () => {
    const required = ({ value }: FieldContext<string>) =>
      value() === '' ? { kind: 'required' } : null;
    const fieldNode = field('David', { nullable: false });
    expectTypeOf(fieldNode.setValidators).toBeCallableWith([required]);
    expectTypeOf(fieldNode.setValidators).toBeCallableWith(required);
  });

  it('accepts one validator or a validator returning an array', () => {
    const required = ({ value }: FieldContext<string>) => value() === '' ? { kind: 'required' } : null;
    const fieldNode = field('', { validators: required, nullable: false });

    fieldNode.setValidators(() => [required, () => ({ kind: 'second' })]);
    fieldNode.setValidators(() => [required, null, undefined]);
    fieldNode.setValidators([required, null, undefined]);
    expectTypeOf(fieldNode.validators()).toEqualTypeOf<readonly ComposableValidator<string>[]>();
  });

  it('types validators inside field options', () => {
    field('David', {
      validators: [(context) => {
        expectTypeOf(context).toEqualTypeOf<ValidatorContext<string>>();
        expectTypeOf(context.value()).toEqualTypeOf<string>();
        expectTypeOf(context.api).toEqualTypeOf<ValidatorApi<string>>();
        expectTypeOf(context.api.value()).toEqualTypeOf<string>();
        expectTypeOf(context.api.path()).toEqualTypeOf<readonly string[]>();
        expectTypeOf(context.field).toEqualTypeOf<Node>();
        expectTypeOf(context.form()).toEqualTypeOf<ReturnType<ValidatorApi<string>['form']>>();
        expectTypeOf(context.path()).toEqualTypeOf<readonly string[]>();
        expectTypeOf(context.disabled()).toEqualTypeOf<boolean>();
        return null;
      }],
      nullable: false,
      disabled: false,
    });
  });

  it('accepts a synchronous validator returned by another validator', () => {
    field('David', {
      validators: [context => context.dirty() ? required : null],
      nullable: false,
    });
  });

  it('infers explicit asynchronous validator params', () => {
    const country = signal('Switzerland');
    field('David', [asyncValidator({
      params: ({ value }) => ({ country: country(), name: value() }),
      validate: async ({ params }) => {
        expectTypeOf(params).toEqualTypeOf<{ country: string; name: string | null }>();
        return null;
      },
    })]);
  });

  it('types the context a form validator receives', () => {
    const formGroup = form({
      city: field('Zurich'),
      age: field(23),
    });
    formGroup.api.setValidators([
      (context) => {
        expectTypeOf(context.value()).toEqualTypeOf<{
          city: string | null;
          age: number | null;
        }>();
        return null;
      },
    ]);
  });

  it('types validators inside form options', () => {
    form(
      { city: field('Moscow'), age: field(23) },
      {
        validators: [(context) => {
          expectTypeOf(context.value()).toEqualTypeOf<{
            city: string | null;
            age: number | null;
          }>();
          return null;
        }],
        readonly: false,
      },
    );
  });

  it('rejects a third argument after second-argument options', () => {
    // @ts-expect-error options must be passed either as the second or third argument
    field('David', { disabled: true }, { hidden: true });
    // @ts-expect-error options must be passed either as the second or third argument
    form({ name: field('David') }, { disabled: true }, { hidden: true });
  });

  it('requires every key on set but not on patch', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    // @ts-expect-error 'city' is missing
    expectTypeOf(formGroup.api.set).toBeCallableWith({ age: 30 });
    expectTypeOf(formGroup.api.patch).toBeCallableWith({ age: 30 });
  });

  it('types complete dynamic array replacement through form.set', () => {
    const profile = form({
      owner: field('Marco'),
      sons: array({ name: field(''), age: field(0) }),
    });

    expectTypeOf(profile.set).toBeCallableWith({
      owner: 'Marcos',
      sons: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }],
    });
    // @ts-expect-error every array item must match the template value
    expectTypeOf(profile.set).toBeCallableWith({ owner: 'Marcos', sons: [{ name: 'son1' }] });
  });

  it('rejects wrong types and unknown keys', () => {
    const formGroup = form({ age: field(23) });
    // @ts-expect-error 'age' is a number
    expectTypeOf(formGroup.api.set).toBeCallableWith({ age: '30' });
    // @ts-expect-error 'nope' does not exist
    expectTypeOf(formGroup.api.patch).toBeCallableWith({ nope: 1 });
  });

  it('types dynamic object-node children safely', () => {
    const profile = form({ name: field('David') });
    const age = profile.add('age', field(23));
    const added = profile.add({
      nickname: field('Dave'),
      address: { city: field('Zurich') },
    });

    expectTypeOf(age()).toEqualTypeOf<number | null>();
    expectTypeOf(age.parent()).toEqualTypeOf<typeof profile | null>();
    expectTypeOf(profile.get('age')).toEqualTypeOf<DynamicNode | undefined>();
    const dynamicKey: string = 'age';
    expectTypeOf(profile.children[dynamicKey]).toEqualTypeOf<DynamicNode | undefined>();
    expectTypeOf(added.nickname()).toEqualTypeOf<string | null>();
    expectTypeOf(added.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(added.address.parent()).toEqualTypeOf<typeof profile | null>();
    expectTypeOf(profile.remove('age')).toEqualTypeOf<DynamicNode | undefined>();

    expectTypeOf(profile.get('nonExistingPropertyOrDynamic')?.value).toEqualTypeOf<Signal<any> | undefined>();
    expectTypeOf(profile.get('nonExistingPropertyOrDynamic')?.disabled).toEqualTypeOf<Signal<boolean> | undefined>();
    expectTypeOf(profile.get('nonExistingPropertyOrDynamic')?.$field).toEqualTypeOf<any>();

    if (false) {
      // @ts-expect-error native callable members remain hidden
      profile.get('nonExistingPropertyOrDynamic')?.apply;
      // @ts-expect-error submit is specific to forms
      profile.get('nonExistingPropertyOrDynamic')?.submit;
      // @ts-expect-error direct patch is not common to every node
      profile.get('nonExistingPropertyOrDynamic')?.patch;
      // @ts-expect-error dynamic children are not direct properties
      profile.nonExistingPropertyOrDynamic;
    }

    if (false) {
      // @ts-expect-error initially declared children cannot be added again
      profile.add('name', field('Mark'));
      // @ts-expect-error '$api' is reserved
      profile.add('$api', field(1));
      // @ts-expect-error batches cannot replace initially declared children
      profile.add({ name: field('Mark') });
    }

    const address = group({ city: field('Zurich') });
    const zip = address.add('zip', field('8001'));
    expectTypeOf(zip.parent()).toEqualTypeOf<typeof address | null>();
    expectTypeOf(address.get('missing')).toEqualTypeOf<DynamicNode | undefined>();
    if (false) {
      // @ts-expect-error dynamic children are not direct properties
      address.missing;
    }
  });

  it('allows api as a child name and reserves $api', () => {
    const withApiChild = form({ api: field(1) });
    expectTypeOf(withApiChild.api()).toEqualTypeOf<number | null>();
    expectTypeOf(withApiChild.$api.value()).toEqualTypeOf<{ api: number | null }>();

    // @ts-expect-error '$api' is reserved
    form({ $api: field(1) });
  });

  it('does not expose patch on the field root', () => {
    const fieldNode = field('David');
    // @ts-expect-error patch lives on api only
    expectTypeOf(fieldNode.patch).toBeCallableWith('Ana');
  });

  it('requires every key on reset when a value is passed', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expectTypeOf(formGroup.api.reset).toBeCallableWith();
    expectTypeOf(formGroup.api.reset).toBeCallableWith({ age: 30, city: 'Madrid' });
    // @ts-expect-error 'city' is missing
    expectTypeOf(formGroup.api.reset).toBeCallableWith({ age: 30 });
  });

  it('types the value a field reset accepts', () => {
    const fieldNode = field(23);
    expectTypeOf(fieldNode.reset).toBeCallableWith();
    expectTypeOf(fieldNode.reset).toBeCallableWith(30);
    // @ts-expect-error the field holds a number
    expectTypeOf(fieldNode.reset).toBeCallableWith('30');
  });

  it('includes null in field values by default', () => {
    const fieldNode = field<string>(null, []);
    expectTypeOf(fieldNode()).toEqualTypeOf<string | null>();
    expectTypeOf(fieldNode.set).toBeCallableWith(null);
    expectTypeOf(fieldNode.reset).toBeCallableWith(null);
  });

  it('accepts a direct string as required configuration', () => {
    if (false) {
      field('David', [required('Name is required')]);
    }
  });

  it('removes null from the field type when nullable is false', () => {
    const fieldNode = field('David', { nullable: false });
    expectTypeOf(fieldNode()).toEqualTypeOf<string>();
    expectTypeOf(fieldNode.set).toBeCallableWith('Ana');
    // @ts-expect-error a non-nullable field cannot be set to null
    expectTypeOf(fieldNode.set).toBeCallableWith(null);
    // @ts-expect-error a non-nullable field cannot be initialized with null
    field<string>(null, { nullable: false });
  });

  it('accepts initial disabled options', () => {
    field('David', undefined, { disabled: true });
    form(
      { name: field('David') },
      undefined,
      { disabled: true },
    );
  });

  it('accepts initial readonly options', () => {
    field('David', undefined, { readonly: true });
    form(
      { name: field('David') },
      undefined,
      { readonly: true },
    );
  });

  it('accepts initial hidden options', () => {
    field('David', undefined, { hidden: true });
    form(
      { name: field('David') },
      undefined,
      { hidden: true },
    );
  });

  it('accepts signals and functions as state sources', () => {
    const state = signal(false);
    field('David', undefined, {
      disabled: state,
      readonly: () => state(),
      hidden: () => false,
    });
  });

  it('allows typed state functions to reference their containing form', () => {
    const formGroup = form({
      age: field(17, { nullable: false }),
      guardian: field('', undefined, {
        hidden: (): boolean => formGroup.age() >= 18,
      }),
    });
    expectTypeOf(formGroup.guardian.hidden()).toEqualTypeOf<boolean>();
  });
});
