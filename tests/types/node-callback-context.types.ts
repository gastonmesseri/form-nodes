import type { Equal, Expect } from './assert.types';
import { array, field, form, group, type NodeCallbackContext } from '../../src/public-api';

type _Index = Expect<Equal<NodeCallbackContext['index'], number | null>>;

const email = field('', {
  disabled: ({ index }) => {
    type _DisabledIndex = Expect<Equal<typeof index, number | null>>;
    return index === 0;
  },
  readonly: ({ index }) => {
    type _ReadonlyIndex = Expect<Equal<typeof index, number | null>>;
    return index === 1;
  },
  hidden: ({ index }) => {
    type _HiddenIndex = Expect<Equal<typeof index, number | null>>;
    return index === 2;
  },
  onValueChange(_value, _node, { index }) {
    type _CallbackIndex = Expect<Equal<typeof index, number | null>>;
  },
});
type _FieldIndex = Expect<Equal<ReturnType<typeof email.$api.index>, number | null>>;

email.onValueChange((_value, _node, { index }) => {
  type _CallbackIndex = Expect<Equal<typeof index, number | null>>;
});

const details = form({ email }, {
  disabled: ({ index }) => index === 0,
  readonly: ({ index }) => index === 1,
  hidden: ({ index }) => index === 2,
  onValueChange(_value, _node, { index }) {
    type _Index = Expect<Equal<typeof index, number | null>>;
  },
  onSubmit(_value, _node, { index }) {
    type _Index = Expect<Equal<typeof index, number | null>>;
  },
  onSubmitBlocked(_node, { index }) {
    type _Index = Expect<Equal<typeof index, number | null>>;
  },
});
type _FormIndex = Expect<Equal<ReturnType<typeof details.$api.index>, number | null>>;
details.onValueChange((_value, _node, { index }) => {
  type _Index = Expect<Equal<typeof index, number | null>>;
});

const row = group({ details }, {
  disabled: ({ index }) => index === 0,
  readonly: ({ index }) => index === 1,
  hidden: ({ index }) => index === 2,
  onValueChange(_value, _node, { index }) {
    type _Index = Expect<Equal<typeof index, number | null>>;
  },
});
type _GroupIndex = Expect<Equal<ReturnType<typeof row.$api.index>, number | null>>;
row.onValueChange((_value, _node, { index }) => {
  type _Index = Expect<Equal<typeof index, number | null>>;
});

const rows = array(row, {
  disabled: ({ index }) => index === 0,
  readonly: ({ index }) => index === 1,
  hidden: ({ index }) => index === 2,
  onValueChange(_value, _node, { index }) {
    type _Index = Expect<Equal<typeof index, number | null>>;
  },
});
type _ArrayIndex = Expect<Equal<ReturnType<typeof rows.$api.index>, number | null>>;
rows.onValueChange((_value, _node, { index }) => {
  type _Index = Expect<Equal<typeof index, number | null>>;
});
