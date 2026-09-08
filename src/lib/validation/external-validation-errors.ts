import { signal, untracked, type Signal, type WritableSignal } from '@angular/core';

import type { Node } from '../types/node.type';
import type { ValidationErrorWithTargetNode, ValidationErrorWithOptionalTargetNode } from './validation.type';

type ExternalErrorSource<TNode extends Node> = Signal<readonly ValidationErrorWithOptionalTargetNode<TNode>[]>;
type ExternalErrorRegistration = {
  readonly source: ExternalErrorSource<Node>;
  readonly onReset?: () => void;
};
type ExternalErrorSources = ReadonlyMap<object, ExternalErrorRegistration>;

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
): readonly ValidationErrorWithTargetNode<TNode>[] => {
  return Array.from(getRegistry(node)().values()).flatMap(({ source }) => {
    return (source() as readonly ValidationErrorWithOptionalTargetNode<TNode>[]).map(error =>
      ({ ...error, targetNode: error.targetNode ?? node }),
    );
  });
};

/** Notifies external validation integrations that their node was reset. */
export const notifyExternalValidationReset = (node: Node) => {
  Array.from(untracked(getRegistry(node)).values()).forEach(({ onReset }) => onReset?.());
};

/**
 * Registers a reactive external error source for a node and returns its idempotent cleanup.
 * The weak registry does not keep an otherwise unreachable node or its integration owner alive.
 */
export const registerExternalValidationErrors = <TNode extends Node>(
  node: TNode,
  owner: object,
  source: ExternalErrorSource<TNode>,
  options?: { readonly onReset?: () => void },
): (() => void) => {
  const registry = getRegistry(node);
  const sources = new Map(untracked(registry));
  const registration: ExternalErrorRegistration = {
    source: source as ExternalErrorSource<Node>,
    ...(options?.onReset ? { onReset: options.onReset } : {}),
  };
  sources.set(owner, registration);
  registry.set(sources);
  let registered = true;

  return () => {
    if (!registered) return;
    registered = false;
    const current = untracked(registry);
    if (current.get(owner) !== registration) return;
    const remaining = new Map(current);
    remaining.delete(owner);
    registry.set(remaining);
  };
};
