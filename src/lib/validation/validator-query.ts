import type { Signal } from '@angular/core';

import type { Validators } from './validation.type';

/** Adds an explicit resolution call while retaining the registered list's Angular signal identity. */
export const createValidatorQuery = <TValue>(
  registered: Signal<Validators<TValue>>,
  resolved: () => Validators<TValue>,
): Signal<Validators<TValue>> & { (options: { resolve?: boolean }): Validators<TValue> } => {
  return new Proxy(registered, {
    apply: (target, _receiver, args: [{ resolve?: boolean }?]) => args[0]?.resolve === true ? resolved() : target(),
  });
};
