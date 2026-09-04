import { field } from './field';
import { group } from './group';
import { isNode } from '../utils/node-marker';
import { isPlainObject } from '../utils/is-plain-object';
import type { Node } from '../types/node.type';
import type { ObjectNodeDefinitions } from './form.type';

type ObjectNodeKind = 'array' | 'form' | 'group';

const FIELD_VALUE_HINT = 'if this object is intended as a field value, wrap it with field(value)';

const formatDefinitionPath = (path: readonly string[]): string => {
  return path.map((segment, index) => /^[A-Za-z_$][\w$]*$/.test(segment)
    ? `${index === 0 ? '' : '.'}${segment}`
    : `[${JSON.stringify(segment)}]`,
  ).join('');
};

const definitionError = (
  nodeType: ObjectNodeKind,
  path: readonly string[],
  message: string,
  resolution: string,
): Error => {
  return new Error(`${nodeType}: ${message} at ${JSON.stringify(formatDefinitionPath(path))}; ${resolution}`);
};

const assertDefinitionValue = (definition: unknown, nodeType: ObjectNodeKind, path: readonly string[]) => {
  if (isNode(definition)) return;
  if (Array.isArray(definition)) return;
  if (definition !== null && typeof definition === 'object' && isPlainObject(definition)) {
    assertValidObjectDefinition(definition as ObjectNodeDefinitions, nodeType, path);
  }
};

/** Validates the own enumerable declaration surface before any values are normalized. */
export const assertValidObjectDefinition = (
  definitions: ObjectNodeDefinitions,
  nodeType: ObjectNodeKind,
  parentPath: readonly string[] = [],
) => {
  Reflect.ownKeys(definitions).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(definitions, key)!;
    if (!descriptor.enumerable) return;
    if (typeof key === 'symbol') {
      throw new Error(
        `${nodeType}: symbol child key ${String(key)} is not supported; use a string key, or ${FIELD_VALUE_HINT}`,
      );
    }
    const path = [...parentPath, key];
    if (key === '__proto__') {
      throw definitionError(
        nodeType,
        path,
        'unsafe child key "__proto__" is not supported',
        FIELD_VALUE_HINT,
      );
    }
    if (!('value' in descriptor)) {
      throw definitionError(
        nodeType,
        path,
        'accessor shorthand is not supported',
        `declare a data property with an explicit node or, ${FIELD_VALUE_HINT}`,
      );
    }
    assertDefinitionValue(descriptor.value, nodeType, path);
  });
};

export const normalizeObjectDefinition = (definition: unknown): Node => {
  if (isNode(definition)) return definition;
  if (Array.isArray(definition)) return field(definition);
  if (definition !== null && typeof definition === 'object') {
    if (definition instanceof Date) return field(definition);
    if (isPlainObject(definition)) return group(definition as ObjectNodeDefinitions);
  }
  return field(definition);
};
