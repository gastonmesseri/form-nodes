import { Injector, assertInInjectionContext, inject } from '@angular/core';

import type { InternalNode, Node } from '../types/node.type';

type NodeInjectorConfig = {
  readonly adoptBinding: boolean;
  readonly inherit: boolean;
  readonly own: Injector | undefined;
};

const configs = new WeakMap<Node, NodeInjectorConfig>();
const bindingInjectors = new WeakMap<Node, Map<object, Injector>>();
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
  adoptBinding: boolean,
) => {
  configs.set(node, { own: injector ?? getCurrentInjector(), inherit, adoptBinding });
};

export const resolveNodeInjector = (node: Node): Injector | undefined => {
  let current: Node | null = node;
  while (current) {
    const config = configs.get(current);
    if (config?.own) return config.own;
    if (config?.adoptBinding) {
      const bindingInjector = bindingInjectors.get(current)?.values().next().value;
      if (bindingInjector) return bindingInjector;
    }
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

export const registerNodeBindingInjector = (node: Node, injector: Injector): (() => void) => {
  let nodeBindings = bindingInjectors.get(node);
  if (!nodeBindings) {
    nodeBindings = new Map();
    bindingInjectors.set(node, nodeBindings);
  }
  const lease = {};
  const leaseInjector = Injector.create({ providers: [], parent: injector });
  nodeBindings.set(lease, leaseInjector);
  (node as InternalNode).$api._refreshInjector();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    nodeBindings.delete(lease);
    (node as InternalNode).$api._refreshInjector();
    leaseInjector.destroy();
  };
};
