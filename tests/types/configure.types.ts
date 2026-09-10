import { expectTypeOf } from 'vitest';
import type { Signal } from '@angular/core';

import { array, field, form, group, createFormPrimitives, type ArrayItemNode, type FieldNode, type GroupNode } from '../../src/public-api';

const profile = form({
  roles: array(group({
    valueType: field<number>(null),
    value: field<string>(null),
  }, {
    configure: ({ children }) => {
      expectTypeOf(children.valueType()).toEqualTypeOf<number | null>();
      children.value.setValidators(() => {
        const type = children.valueType();
        return type !== null && type > 10 ? { kind: 'invalidRole' } : null;
      });
      // @ts-expect-error Known siblings retain their value contracts.
      children.valueType.set('wrong');
    },
  }), {
    configure: ({ items }) => {
      expectTypeOf(items()[0]!.value()).toEqualTypeOf<string | null>();
    },
  }),
}, {
  configure: ({ children }) => {
    expectTypeOf(children.roles.at(0)!.valueType()).toEqualTypeOf<number | null>();
  },
});
type Role = ArrayItemNode<typeof profile.roles>;
expectTypeOf<Role>().toEqualTypeOf<NonNullable<typeof profile.roles[number]>>();
// @ts-expect-error Only array nodes have an item type.
type InvalidItem = ArrayItemNode<typeof profile>;

type Parent = GroupNode<{ valueType: FieldNode<number | null> }>;
field('', (ctx) => {
  const parent = ctx.parent<Parent>();
  expectTypeOf(parent?.valueType()).toEqualTypeOf<number | null | undefined>();
  const signal: Signal<unknown> = ctx.parent;
  // @ts-expect-error A field cannot be a structural parent.
  ctx.parent<FieldNode>();
  return signal() && parent?.valueType() ? null : undefined;
});
field.strict(1, { configure: api => expectTypeOf(api()).toEqualTypeOf<number>() });
field.nullable('x', { configure: api => expectTypeOf(api()).toEqualTypeOf<string | null>() });
const configured = createFormPrimitives();
configured.group({ count: field(1) }, {
  configure: ({ children }) => expectTypeOf(children.count()).toEqualTypeOf<number | null>(),
});
