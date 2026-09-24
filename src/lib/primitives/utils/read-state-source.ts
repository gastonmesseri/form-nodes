import type { AnyNode } from '../../types/node.type';
import { createNodeIndexContext } from '../../utils/node-array-index';
import type { NodeCallbackContext } from '../../types/node-callback-context.type';

export const getInitialMutableState = (source?: boolean | ((context: NodeCallbackContext) => any)): boolean => {
  return typeof source === 'boolean' ? source : false;
};

export const readStateSource = (source: boolean | ((context: NodeCallbackContext) => any) | undefined, node: AnyNode): boolean => {
  return typeof source === 'function' ? source(createNodeIndexContext(node)) : false;
};
