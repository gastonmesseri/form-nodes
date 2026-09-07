import type { Node } from '../types/node.type';
import type { MetadataContributions } from '../metadata/metadata';

/** @experimental Optional custom-control input synchronization, independent of value models. */
export type SyncInputs = boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] };

/** @experimental Supported custom-control state and constraint inputs; excludes value and checked models. */
export type SyncInputName = 'disabled' | 'disabledReasons' | 'dirty' | 'errors' | 'hidden' | 'invalid' | 'max' | 'maxLength' | 'min' | 'minLength' | 'name' | 'pattern' | 'pending' | 'readonly' | 'required' | 'touched';

type NodeInputConfig = {
  mode: SyncInputs | null | undefined;
  declared: ReadonlySet<string>;
  metadata: () => MetadataContributions;
};

const configurations = new WeakMap<Node, NodeInputConfig>();

export const registerNodeInputConfig = (
  node: Node,
  options: { syncInputs?: SyncInputs | null | undefined; disabled?: unknown; readonly?: unknown; hidden?: unknown } | undefined,
  metadata: () => MetadataContributions,
) => {
  const declared = new Set<string>();
  for (const name of ['disabled', 'readonly', 'hidden'] as const) {
    if (options?.[name] !== undefined) declared.add(name);
  }
  if (declared.has('disabled')) declared.add('disabledReasons');
  configurations.set(node, { mode: options?.syncInputs, declared, metadata });
};

export const getNodeInputConfig = (node: Node) => configurations.get(node)!;
