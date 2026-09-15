import { cloneInitialValue } from './clone-initial-value';
import type { AnyNode, InternalNode } from '../../types/node.type';

/** Captures construction defaults before incoming row data becomes its reset baseline. */
export function createItemValueNormalizer(node: AnyNode): (value: any) => any {
  const api = node.$api;
  if (api.nodeType() !== 'form' && api.nodeType() !== 'group') return value => value;
  const defaults = cloneInitialValue((node as InternalNode).$api._value());
  const children = (api as typeof api & { children: Record<string, AnyNode> }).children;
  const normalizers = Object.entries(children).map(([key, child]) => [key, createItemValueNormalizer(child)] as const);
  return (value) => {
    if (value === null || typeof value !== 'object') return value;
    const result = { ...value };
    for (const [key, normalize] of normalizers) {
      result[key] = Object.prototype.hasOwnProperty.call(value, key)
        ? normalize(value[key])
        : cloneInitialValue(defaults[key]);
    }
    return result;
  };
}
