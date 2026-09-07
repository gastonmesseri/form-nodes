import type { Node } from '../types/node.type';
import type { MetadataContributions } from '../metadata/metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { hasValidatorMetadata } from '../validation/validator-metadata';
import { MIN_METADATA, MAX_METADATA, MIN_DATE_METADATA, MAX_DATE_METADATA, MIN_LENGTH_METADATA, MAX_LENGTH_METADATA, PATTERN_METADATA } from '../validation/constraint-metadata';

/** @experimental Optional custom-control input synchronization, independent of value models. */
export type SyncInputs = boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] };

/** @experimental Supported custom-control state and constraint inputs; excludes value and checked models. */
export type SyncInputName = 'disabled' | 'disabledReasons' | 'dirty' | 'errors' | 'hidden' | 'invalid' | 'max' | 'maxLength' | 'min' | 'minLength' | 'name' | 'pattern' | 'pending' | 'readonly' | 'required' | 'touched';

const constraints = {
  required: [REQUIRED_METADATA],
  min: [MIN_METADATA, MIN_DATE_METADATA],
  max: [MAX_METADATA, MAX_DATE_METADATA],
  minLength: [MIN_LENGTH_METADATA],
  maxLength: [MAX_LENGTH_METADATA],
  pattern: [PATTERN_METADATA],
};

type NodeInputConfig = {
  mode: SyncInputs | null | undefined;
  declared: ReadonlySet<string>;
  metadata: () => MetadataContributions;
};

const configurations = new WeakMap<Node, NodeInputConfig>();

export const registerNodeInputConfig = (
  node: Node,
  options: { syncInputs?: SyncInputs | null | undefined; disabled?: unknown; readonly?: unknown; hidden?: unknown } | undefined,
  validators: readonly Function[],
  metadata: () => MetadataContributions,
) => {
  const declared = new Set<string>();
  for (const name of ['disabled', 'readonly', 'hidden'] as const) {
    if (options?.[name] !== undefined) declared.add(name);
  }
  if (declared.has('disabled')) declared.add('disabledReasons');
  Object.entries(constraints).forEach(([name, keys]) => {
    if (validators.some(validator => keys.some(key => hasValidatorMetadata<unknown, unknown>(validator, key)))) declared.add(name);
  });
  configurations.set(node, { mode: options?.syncInputs, declared, metadata });
};

export const getNodeInputConfig = (node: Node) => configurations.get(node)!;
