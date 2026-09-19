import { DestroyRef, Injector } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import { getCurrentInjector, resolveNodeInjector, watchNodeInjector } from '../../utils/node-injector';

export type ValueChangeCallback = (value: any, node: any) => void;

export const valueSubscriptions = new WeakMap<AnyNode, Set<ValueSubscription>>();

const cancelSubscription = (reference: WeakRef<ValueSubscription>) => {
  return () => reference.deref()?.unsubscribe();
};

const updateSubscriptionOwner = (reference: WeakRef<ValueSubscription>) => {
  return (injector: Injector | undefined) => reference.deref()?.setNodeInjector(injector);
};

export class ValueSubscription {
  reference = new WeakRef(this);

  nodeInjector: Injector | undefined;

  nodeCleanup: (() => void) | undefined;

  consumerCleanup: (() => void) | undefined;

  watchCleanup: (() => void) | undefined;

  constructor(public node: WeakRef<AnyNode>, public callback: ValueChangeCallback | undefined) {}

  attach(injector: Injector | undefined) {
    return injector?.get(DestroyRef).onDestroy(cancelSubscription(this.reference));
  }

  setNodeInjector(injector: Injector | undefined) {
    if (injector === this.nodeInjector) return;
    this.nodeCleanup?.();
    this.nodeCleanup = undefined;
    this.nodeInjector = injector;
    this.nodeCleanup = this.attach(injector);
  }

  unsubscribe() {
    if (!this.callback) return;
    this.callback = undefined;
    const node = this.node.deref();
    if (node) {
      const subscriptions = valueSubscriptions.get(node)!;
      subscriptions.delete(this);
      if (subscriptions.size === 0) valueSubscriptions.delete(node);
    }
    this.nodeCleanup?.();
    this.consumerCleanup?.();
    this.watchCleanup?.();
    this.nodeCleanup = this.consumerCleanup = this.watchCleanup = undefined;
    this.nodeInjector = undefined;
  }
}

export const subscribeToNodeValue = (node: AnyNode, callback: ValueChangeCallback, options?: { injector?: Injector }): (() => void) => {
  const subscription = new ValueSubscription(new WeakRef(node), callback);
  let subscriptions = valueSubscriptions.get(node);
  if (!subscriptions) valueSubscriptions.set(node, subscriptions = new Set());
  subscriptions.add(subscription);
  try {
    const consumer = options?.injector ?? getCurrentInjector();
    subscription.consumerCleanup = subscription.attach(consumer);
    subscription.setNodeInjector(resolveNodeInjector(node));
    subscription.watchCleanup = watchNodeInjector(node, updateSubscriptionOwner(subscription.reference));
  } catch (error) {
    subscription.unsubscribe();
    throw error;
  }
  return cancelSubscription(subscription.reference);
};
