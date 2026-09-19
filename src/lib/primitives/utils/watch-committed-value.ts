import { untracked, type Injector } from '@angular/core';

import type { AnyNode, InternalNode } from '../../types/node.type';
import { createReactiveWatch } from '../../utils/create-reactive-watch';
import { subscribeToNodeValue, type ValueSubscription } from './node-value-subscription';

const subscriptions = new WeakMap<AnyNode, Set<ValueSubscription>>();

// Router adapters observe committed data independently of public equality. The existing
// subscription ownership keeps this watcher alive only while its node and owners are alive.
export const watchCommittedValue = (node: AnyNode, callback: (value: any) => void, options: { injector: Injector; onDestroy: () => void }) => {
  return untracked(() => {
    let initial = true;
    const target = {
      run() {
        const value = (node as InternalNode).$api._value();
        if (initial) initial = false;
        else untracked(() => callback(value));
      },
      cleanup() {},
    };
    const watch = createReactiveWatch(target, null);
    const stop = subscribeToNodeValue(node, () => target.run(), options, subscriptions, () => {
      watch.destroy();
      options.onDestroy();
    });
    return stop;
  });
};
