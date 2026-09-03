import type { ObjectNodeDefinitions } from './form.type';
import { assertValidObjectDefinition } from './form.utils';

export const assertArrayObjectTemplate = (definition: unknown, source: 'factory' | 'template') => {
  if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new Error(
      `array: ${source} must be a node or object definition; use field([...]) for an array-valued item`,
    );
  }
  assertValidObjectDefinition(definition as ObjectNodeDefinitions, 'array');
};
