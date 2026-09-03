import type { Equal, Expect } from './assert.types';
import { array, createFormPrimitives, field, form, type FieldOptions } from '../../src/public-api';

const nullable = field({ id: 1 }, {
  equal: (previous, next) => {
    type _Previous = Expect<Equal<typeof previous, { id: number } | null>>;
    type _Next = Expect<Equal<typeof next, { id: number } | null>>;
    return previous?.id === next?.id;
  },
});
const strict = field.strict({ id: 1 }, {
  equal: (previous, next) => previous.id === next.id,
});
const configured = createFormPrimitives({ nullable: false });
configured.field('Marco', { equal: (previous, next) => previous.toLowerCase() === next.toLowerCase() });
field.nullable('Marco', { equal: (previous, next) => previous?.toLowerCase() === next?.toLowerCase() });
field<number>(undefined, { equal: (previous, next) => previous === next });
field(null, { equal: (previous, next) => {
  type _Unknown = Expect<Equal<typeof previous, unknown>>;
  return previous === next;
} });
field('', [], { equal: 'deep' });
field('', { equal: 'shallow' });
form({ people: array(strict, { initialValue: 1 }), selected: nullable });
const options = { equal: (previous, next) => previous === next } satisfies FieldOptions<string>;
field.strict('Marco', options);

// @ts-expect-error Unsupported comparison strategy.
field('', { equal: 'loose' });
// @ts-expect-error Equality must return a boolean.
field('', { equal: () => 1 });
// @ts-expect-error A nullable field comparator must accept null.
field('Marco', { equal: (previous: string, next: string) => previous === next });
// @ts-expect-error Comparators cannot change the inferred field value type.
field.strict('Marco', { equal: (previous: number, next: number) => previous === next });
