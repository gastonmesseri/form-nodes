import type { Node } from '../../types/node.type';
import type { Field } from '../../primitives/field';

const rootNames = new WeakMap<Node, string>();
let nextRootId = 0;

/** Returns the stable Angular-compatible control name for a field binding. */
export const getFormNodeName = <TValue>(field: Field<TValue>, appId: string): string => {
  const root = field.form() ?? field;
  let rootName = rootNames.get(root);
  if (!rootName) {
    rootName = `${appId}.form${nextRootId++}`;
    rootNames.set(root, rootName);
  }

  const path = field.path();
  return path.length ? `${rootName}.${path.join('.')}` : rootName;
};
