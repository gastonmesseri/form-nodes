import type { AnyNode } from '../../types/node.type';

const nodeMarker = Symbol('form-node');

export const markAsNode = <TNode extends object>(node: TNode): TNode => {
  Object.defineProperty(node, nodeMarker, { value: true });
  return node;
};

export const isNode = (value: unknown): value is AnyNode => {
  return typeof value === 'function' && nodeMarker in value;
};
