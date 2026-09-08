import { isNode } from './utils/node-marker';
import type { AnyNode } from '../types/node.type';

/**
 * Checks whether a value is a field, form, group, or array created by this package instance.
 * Uses the internal node marker without calling the value or reading its signals.
 * Ordinary Angular signals, node API objects, and structural lookalikes are not nodes.
 *
 * @example
 * ```ts
 * const profile = form({ name: field('Marco') });
 * isFormNode(profile); // true
 * isFormNode(profile.name); // true
 * isFormNode({ name: 'Marco' }); // false
 * ```
 *
 * @param value The value to check.
 * @returns Whether the value is a Form Nodes node, narrowing it to `AnyNode`.
 */
export function isFormNode(value: unknown): value is AnyNode {
  return isNode(value);
}
