import { computed, type Signal } from '@angular/core';

import type { NodeValueSignal } from '../../types/node-value-signal.type';

export function createNodeValueSignal<TValue, TSet>(exposed: Signal<TValue>, committed: Signal<TValue>, control: Signal<TValue>, setCommitted: (value: TSet) => void, setControl: (value: TSet) => void): NodeValueSignal<TValue, TSet> {
  return Object.assign(computed(() => exposed()), {
    committed: Object.assign(computed(() => committed()), { set: setCommitted }),
    control: Object.assign(computed(() => control()), { set: setControl }),
  }) as NodeValueSignal<TValue, TSet>;
}
