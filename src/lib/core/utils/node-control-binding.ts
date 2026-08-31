import type { NodeControlBinding } from '../types/node.type';

const DOCUMENT_POSITION_PRECEDING = 2;

export const firstControlBindingInDom = (
  first: NodeControlBinding | undefined,
  second: NodeControlBinding | undefined,
): NodeControlBinding | undefined => {
  if (!first) return second;
  if (!second) return first;
  const position = first.element.compareDocumentPosition(second.element);
  return position & DOCUMENT_POSITION_PRECEDING ? second : first;
};

export const findFirstControlBindingInDom = (
  bindings: Iterable<NodeControlBinding>,
): NodeControlBinding | undefined =>
  Array.from(bindings).reduce(firstControlBindingInDom, undefined);
