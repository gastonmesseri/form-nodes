import { field, type FieldNode } from '@ngblocks/form-nodes';

const myFieldNodeTyped: FieldNode = field('');
myFieldNodeTyped.value.committed(); // '' (typed as any)
myFieldNodeTyped.value.control(); // '' (typed as any)
myFieldNodeTyped.value.committed.set('Ada');
if (myFieldNodeTyped.value.committed() !== 'Ada' || myFieldNodeTyped.value.control() !== 'Ada') {
  throw new Error('A bare FieldNode annotation must retain both nested value views.');
}

const name: FieldNode<string> = field.strict('Ada');
name.value.committed(); // 'Ada' (typed as string)
name.value.control(); // 'Ada' (typed as string)
name.value.control.set('Grace');
if (name.value.committed() !== 'Grace' || name.value.control() !== 'Grace') {
  throw new Error('Typed value views must retain their read and write behavior.');
}
