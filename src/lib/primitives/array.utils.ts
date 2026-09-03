import { isNil } from '../utils/is-nil';
import type { ObjectNodeDefinitions } from './form.type';
import { assertValidObjectDefinition } from './form-group-node.utils';

export const looksLikeValidatorSource = (value: unknown): boolean => {
  return typeof value === 'function'
    || (Array.isArray(value)
    && value.some(entry => typeof entry === 'function')
    && value.every(entry => isNil(entry) || typeof entry === 'function'));
};

export const assertArrayObjectTemplate = (definition: unknown, source: 'factory' | 'template') => {
  if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new Error(
      `array: ${source} must be a node or object definition; use field([...]) for an array-valued item`,
    );
  }
  assertValidObjectDefinition(definition as ObjectNodeDefinitions, 'array');
};
