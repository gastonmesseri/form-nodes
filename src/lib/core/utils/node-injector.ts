import { Injector, assertInInjectionContext, inject } from '@angular/core';

import type { InternalNode, Node } from '../types/node.type';

type NodeInjectorConfig = {
  readonly inherit: boolean;
  readonly own: Injector | undefined;
};

const configs = new WeakMap<Node, NodeInjectorConfig>();
const listeners = new WeakMap<Node, Set<(injector: Injector | undefined) => void>>();

const getCurrentInjector = (): Injector | undefined => {
  try {
    assertInInjectionContext(getCurrentInjector);
    return inject(Injector);
  } catch {
    return undefined;
  }
};

export const registerNodeInjector = (
  node: Node,
  injector: Injector | undefined,
  inherit: boolean,
) => {
  configs.set(node, { own: injector ?? getCurrentInjector(), inherit });
};

export const resolveNodeInjector = (node: Node): Injector | undefined => {
  let current: Node | null = node;
  while (current) {
    const config = configs.get(current);
    if (config?.own) return config.own;
    if (config && !config.inherit) return undefined;
    current = ((current as InternalNode).$api as unknown as { parent: () => Node | null }).parent();
  }
  return undefined;
};

export const watchNodeInjector = (
  node: Node,
  listener: (injector: Injector | undefined) => void,
): (() => void) => {
  let nodeListeners = listeners.get(node);
  if (!nodeListeners) {
    nodeListeners = new Set();
    listeners.set(node, nodeListeners);
  }
  nodeListeners.add(listener);
  listener(resolveNodeInjector(node));
  return () => { nodeListeners.delete(listener); };
};

export const refreshNodeInjector = (node: Node) => {
  listeners.get(node)?.forEach(listener => listener(resolveNodeInjector(node)));
};
