import { computed, type Signal } from '@angular/core';

import type { CallableNodeApi } from '../../types/callable-node-api.type';

export function createCallableNodeApi<TApi extends { value: Signal<any> }>(api: TApi): CallableNodeApi<TApi> {
  // Unlike Object.assign, descriptors can replace a function's non-writable length property.
  return Object.defineProperties(computed(() => api.value()), Object.getOwnPropertyDescriptors(api)) as CallableNodeApi<TApi>;
}
