import type { AnyNode, InternalNode } from '../types/node.type';
import type { NodeCallbackContext } from '../types/node-callback-context.type';

/** Reads the current position of the item containing a node in its nearest array ancestor. */
export const getClosestArrayIndex = (node: AnyNode): number | null => {
  let item = node as InternalNode;
  let parent = item.$api.parent() as InternalNode | null;
  while (parent) {
    if (parent.$api.nodeType() === 'array') {
      const key = item.$api.keyInParent();
      return typeof key === 'number' ? key : null;
    }
    item = parent;
    parent = item.$api.parent() as InternalNode | null;
  }
  return null;
};

/** Builds a transient callback view so its index is read only when the callback uses it. */
export const createNodeIndexContext = (node: AnyNode): NodeCallbackContext => ({
  get index() { return node.$api.index(); },
});
