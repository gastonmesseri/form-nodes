import { signal, untracked, type Signal, type WritableSignal } from '@angular/core';

import type { Node } from '../types/node.type';
import type { ValidationError } from './validation.type';

type ExternalErrorSource<TNode extends Node> = Signal<readonly ValidationError.WithOptionalTargetNode<TNode>[]>;
type ExternalErrorSources = ReadonlyMap<object, ExternalErrorSource<Node>>;

const registries = new WeakMap<Node, WritableSignal<ExternalErrorSources>>();

const getRegistry = (node: Node): WritableSignal<ExternalErrorSources> => {
  let registry = registries.get(node);
  if (!registry) {
    registry = signal(new Map());
    registries.set(node, registry);
  }
  return registry;
};

/** Reads errors contributed by integrations outside the node's configured validators. */
export const readExternalValidationErrors = <TNode extends Node>(
  node: TNode,
): readonly ValidationError.WithTargetNode<TNode>[] =>
  Array.from(getRegistry(node)().values()).flatMap((source) =>
    (source() as readonly ValidationError.WithOptionalTargetNode<TNode>[]).map((error) =>
      ({ ...error, targetNode: error.targetNode ?? node }),
    ),
  );

/**
 * Registers a reactive external error source for a node and returns its idempotent cleanup.
 * The weak registry does not keep an otherwise unreachable node or its integration owner alive.
 */
export const registerExternalValidationErrors = <TNode extends Node>(
  node: TNode,
  owner: object,
  source: ExternalErrorSource<TNode>,
): (() => void) => {
  const registry = getRegistry(node);
  const sources = new Map(untracked(registry));
  sources.set(owner, source as ExternalErrorSource<Node>);
  registry.set(sources);
  let registered = true;

  return () => {
    if (!registered) return;
    registered = false;
    const current = untracked(registry);
    if (current.get(owner) !== source) return;
    const remaining = new Map(current);
    remaining.delete(owner);
    registry.set(remaining);
  };
};
