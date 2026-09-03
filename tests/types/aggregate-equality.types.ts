import type { Equal, Expect } from './assert.types';
import { array, createFormPrimitives, field, form, group, type ArrayOptions, type FormOptions, type GroupOptions } from '../../src/public-api';

const profile = form({
  name: field('Marco'),
  details: { active: field.strict<boolean>(true) },
  people: array({ email: field('') }),
}, {
  equal: (previous, next) => {
    type Expected = { name: string | null; details: { active: boolean }; people: { email: string | null }[] };
    type _Previous = Expect<Equal<typeof previous, Expected>>;
    type _Next = Expect<Equal<typeof next, Expected>>;
    return previous.name === next.name;
  },
});
type _Value = Expect<Equal<ReturnType<typeof profile>, {
  name: string | null;
  details: { active: boolean };
  people: { email: string | null }[];
}>>;
group({ name: field('') }, [], { equal: (a, b) => a.name === b.name });
form({ name: field('') }, [], { equal: 'shallow' });
group({ name: field('') }, { equal: 'deep' });
const configured = createFormPrimitives({ nullable: false });
configured.form({ name: configured.field('') }, { equal: (a, b) => a.name.toLowerCase() === b.name.toLowerCase() });
configured.group({ name: configured.field.nullable('') }, { equal: (a, b) => a.name?.toLowerCase() === b.name?.toLowerCase() });
const options = { equal: (a, b) => a.name === b.name } satisfies FormOptions<{ name: string }>;
const groupOptions: GroupOptions<{ name: string }> = { equal: options.equal };
group({ name: field.strict<string>('') }, groupOptions);

// @ts-expect-error The comparator cannot change the inferred node value.
form({ name: field('') }, { equal: (a: { name: number }, b: { name: number }) => a.name === b.name });
// @ts-expect-error A nullable child remains nullable in the aggregate comparator.
group({ name: field('') }, { equal: (a: { name: string }, b: { name: string }) => a.name === b.name });
// @ts-expect-error Equality must return a boolean.
form({ name: field('') }, { equal: () => 1 });
// @ts-expect-error Unsupported comparison mode.
group({ name: field('') }, { equal: 'loose' });

array(field(''), { equal: 'deep' });
configured.array({ name: field('') }, { equal: 'shallow' });
array({
  name: field(''),
  details: { active: field.strict<boolean>(true) },
  tags: array(field('')),
}, {
  equal: (previous, next) => {
    type Expected = { name: string | null; details: { active: boolean }; tags: (string | null)[] }[];
    type _Previous = Expect<Equal<typeof previous, Expected>>;
    type _Next = Expect<Equal<typeof next, Expected>>;
    return previous.length === next.length;
  },
  validators: (ctx) => {
    type _Value = Expect<Equal<ReturnType<typeof ctx.value>, { name: string | null; details: { active: boolean }; tags: (string | null)[] }[]>>;
    return null;
  },
});
array(() => field.strict<number>(0), [1, 2], [], {
  equal: (a, b) => {
    type _Value = Expect<Equal<typeof a, number[]>>;
    return a.every((value, index) => value === b[index]);
  },
});
array(array(field.strict<boolean>(true)), { equal: (a, b) => {
  type _Value = Expect<Equal<typeof a, boolean[][]>>;
  return a.length === b.length;
} });
configured.array({ name: configured.field('') }, {
  equal: (a, b) => {
    type _Value = Expect<Equal<typeof a, { name: string }[]>>;
    return a[0]?.name.toLowerCase() === b[0]?.name.toLowerCase();
  },
});
const arrayOptions = { equal: (a, b) => a.length === b.length } satisfies ArrayOptions<(string | null)[]>;
array(field(''), arrayOptions);
// @ts-expect-error Equality receives the complete collection, not one item.
array(field(''), { equal: (a: string, b: string) => a === b });
// @ts-expect-error Nullable item values remain nullable in the comparator.
array(field(''), { equal: (a: string[], b: string[]) => a.length === b.length });
// @ts-expect-error The comparator cannot change the inferred item value.
array({ name: field('') }, { equal: (a: { name: number }[], b: { name: number }[]) => a.length === b.length });
// @ts-expect-error Equality must return a boolean.
array(field(''), { equal: () => 1 });
// @ts-expect-error Unsupported comparison mode.
configured.array(field(''), { equal: 'loose' });
