import type { Node } from '../../types/node.type';

const rootNames = new WeakMap<Node, string>();
let nextRootId = 0;

/** Returns the stable Angular-compatible control name for a node binding. */
export const getFormNodeName = (node: Node, appId: string): string => {
  const root = node.$api.root();
  let rootName = rootNames.get(root);
  if (!rootName) {
    rootName = `${appId}.form${nextRootId++}`;
    rootNames.set(root, rootName);
  }

  const path = node.$api.path();
  return path.length ? `${rootName}.${path.join('.')}` : rootName;
};
