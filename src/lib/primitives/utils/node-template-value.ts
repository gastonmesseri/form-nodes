import { isNode } from './node-marker';
import type { AnyNode } from '../../types/node.type';
import { cloneInitialValue } from './clone-initial-value';
import { isPlainObject } from '../../utils/is-plain-object';

const templateValues = new WeakMap<AnyNode, unknown>();

/** Retains declaration data independently of later edits and reset baselines. */
export function registerNodeTemplateValue(node: AnyNode, value: unknown) {
  templateValues.set(node, value);
}

/** Reads declaration data without constructing nodes or evaluating their signals. */
export function readDefinitionTemplateValue(definition: unknown): unknown {
  if (isNode(definition)) return templateValues.get(definition);
  if (definition !== null && typeof definition === 'object' && isPlainObject(definition)) {
    return Object.fromEntries(Object.entries(definition).map(([key, child]) => [key, readDefinitionTemplateValue(child)]));
  }
  return definition;
}

/** Captures data only, so a retained array does not retain the source node tree. */
export function createTemplateValueReader(definition: unknown): () => unknown {
  const value = cloneInitialValue(readDefinitionTemplateValue(definition));
  return () => cloneInitialValue(value);
}
