import { field } from './field';
import { group } from './group';
import { isNode } from '../utils/node-marker';
import { isPlainObject } from '../utils/is-plain-object';
import type { Node } from '../types/node.type';
import type { ObjectNodeDefinitions } from './form.type';

export const normalizeObjectDefinition = (definition: unknown): Node => {
  if (isNode(definition)) return definition;
  if (Array.isArray(definition)) {
    throw new Error('Array shorthand is ambiguous; wrap the value with field([...]) or declare a dynamic array with array(...).');
  }
  if (definition !== null && typeof definition === 'object') {
    if (definition instanceof Date) return field(definition);
    if (isPlainObject(definition)) return group(definition as ObjectNodeDefinitions);
  }
  return field(definition);
};
