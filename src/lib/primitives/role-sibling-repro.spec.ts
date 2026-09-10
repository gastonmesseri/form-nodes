import { expect, expectTypeOf, it } from 'vitest';

import { array, field, form, required, type FieldNode, type GroupNode } from '../../public-api';

type RoleNode = GroupNode<{
  valueType: FieldNode<number | null>;
  value: FieldNode<string | null>;
}>;

class WithParent {
  myForm = form({
    roles: array({
      valueType: field<number>(null, [required]),
      value: field<string>(null, (ctx) => {
        const parent = ctx.parent() as RoleNode | null;
        const valueType = parent?.valueType();
        expectTypeOf(valueType).toEqualTypeOf<number | null | undefined>();
        return valueType !== null && valueType !== undefined && valueType > 10 ? { kind: 'someerror', message: 'lo' } : null;
      }),
    }, { initialValue: 2 }),
  });
}

class WithFactory {
  myForm = form({
    roles: array(() => {
      const valueType = field<number>(null, [required]);
      return {
        valueType,
        value: field<string>(null, (ctx) => {
          const type = valueType();
          expectTypeOf(type).toEqualTypeOf<number | null>();
          expectTypeOf(ctx.value()).toEqualTypeOf<string | null>();
          return type !== null && type > 10 ? { kind: 'someerror', message: 'lo' } : null;
        }),
      };
    }, { initialValue: 2 }),
  });
}

it.each([WithParent, WithFactory])('reads the sibling in its own array row with %s', (Component) => {
  const model = new Component().myForm;
  const [first, second] = model.roles.items();
  expect(first!.value.valid()).toBe(true);
  expect(second!.value.valid()).toBe(true);
  first!.valueType.set(11);
  expect(first!.value.hasError('someerror')).toBe(true);
  expect(second!.value.valid()).toBe(true);
  first!.valueType.set(5);
  expect(first!.value.valid()).toBe(true);
});
