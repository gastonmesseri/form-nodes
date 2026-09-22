import { DestroyRef, Injector, untracked } from '@angular/core';

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

const deliverSubscription = (reference: WeakRef<ValueSubscription>) => {
  return () => reference.deref()?.deliver();
};

export class ValueSubscription {
  reference = new WeakRef(this);

  nodeInjector: Injector | undefined;

  nodeCleanup: (() => void) | undefined;

  consumerCleanup: (() => void) | undefined;

  watchCleanup: (() => void) | undefined;

  timer: ReturnType<typeof setTimeout> | undefined;

  pendingValue: unknown;

  constructor(
    public node: WeakRef<AnyNode>,
    public callback: ValueChangeCallback | undefined,
    public registry = valueSubscriptions,
    public onUnsubscribe?: () => void,
    public debounce = 0,
  ) {}

  notify(value: unknown, node: AnyNode) {
    const callback = this.callback;
    if (!callback) return;
    if (this.debounce === 0) {
      callback(value, node);
      return;
    }
    clearTimeout(this.timer);
    this.pendingValue = value;
    this.timer = setTimeout(deliverSubscription(this.reference), this.debounce);
  }

  deliver() {
    const value = this.pendingValue;
    this.timer = undefined;
    this.pendingValue = undefined;
    const node = this.node.deref();
    const callback = this.callback;
    if (node && callback) untracked(() => callback(value, node));
  }

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
    clearTimeout(this.timer);
    this.timer = undefined;
    this.pendingValue = undefined;
    const node = this.node.deref();
    if (node) {
      const subscriptions = this.registry.get(node)!;
      subscriptions.delete(this);
      if (subscriptions.size === 0) this.registry.delete(node);
    }
    this.nodeCleanup?.();
    this.consumerCleanup?.();
    this.watchCleanup?.();
    this.nodeCleanup = this.consumerCleanup = this.watchCleanup = undefined;
    this.nodeInjector = undefined;
    const dispose = this.onUnsubscribe;
    this.onUnsubscribe = undefined;
    dispose?.();
  }
}

export const subscribeToNodeValue = (node: AnyNode, callback: ValueChangeCallback, options?: { injector?: Injector; debounce?: number; emitCurrent?: boolean }, registry = valueSubscriptions, onUnsubscribe?: () => void): (() => void) => {
  const debounce = options?.debounce ?? 0;
  if (!Number.isFinite(debounce) || debounce < 0) throw new RangeError('onValueChange debounce must be a finite, non-negative number of milliseconds.');
  const subscription = new ValueSubscription(new WeakRef(node), callback, registry, onUnsubscribe, debounce);
  let subscriptions = registry.get(node);
  if (!subscriptions) registry.set(node, subscriptions = new Set());
  subscriptions.add(subscription);
  try {
    const consumer = options?.injector ?? getCurrentInjector();
    subscription.consumerCleanup = subscription.attach(consumer);
    subscription.setNodeInjector(resolveNodeInjector(node));
    subscription.watchCleanup = watchNodeInjector(node, updateSubscriptionOwner(subscription.reference));
    if (options?.emitCurrent) untracked(() => callback(node(), node));
  } catch (error) {
    subscription.unsubscribe();
    throw error;
  }
  return cancelSubscription(subscription.reference);
};
