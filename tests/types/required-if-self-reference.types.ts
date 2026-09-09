import { computed, type Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, required, requiredIf, type FieldNode } from '../../src/public-api';

class Model {
  form = form({
    other: field<number>(23, [required]),
    subType: field<string>(null, [requiredIf(() => this.visible())]),
  });

  visible = computed(() => (this.form.other() ?? 0) > 30);
}
const model = new Model();
type _Boolean = Expect<Equal<typeof model.visible, Signal<boolean>>>;
type _Value = Expect<Equal<ReturnType<typeof model.form>, { other: number | null; subType: string | null }>>;
const node: FieldNode<string | null> = model.form.subType;
// @ts-expect-error self-references must not erase field write types
model.form.other.set('wrong');
// @ts-expect-error requiredIf still requires a callable condition
requiredIf(true);
void node;
