import { InjectionToken, inject, type Injector } from '@angular/core';

import { FormNodeNgControl } from './form-node-ng-control';
import type { FormNodeBinding } from '../types/form-node-binding.type';

/** Shares lazy NgControl ownership without constructing the binding from a control constructor. */
export const FORM_NODE_INTEROP = new InjectionToken<ReturnType<typeof createFormNodeInterop>>('FORM_NODE_INTEROP');

export const createFormNodeInterop = (injector: Injector) => {
  let binding: FormNodeBinding;
  let control: FormNodeNgControl | undefined;
  return {
    connect(current: FormNodeBinding) {
      binding = current;
      if (control) control._binding = current;
    },
    peek() { return control; },
    get() {
      return (control ??= new FormNodeNgControl(() => binding.node(), injector, binding));
    },
  };
};

export const injectFormNodeNgControl = () => inject(FORM_NODE_INTEROP).get();
