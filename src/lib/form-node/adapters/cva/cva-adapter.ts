import type { ControlValueAccessor } from '@angular/forms';
import { DestroyRef, effect, untracked } from '@angular/core';

import { connectLegacyValidators } from './legacy-validators';
import { connectControlInputs } from '../sync-control-inputs';
import type { InternalNode, Node } from '../../../types/node.type';
import { hasControlStateConsumer } from '../../../form-node-state/adapters/form-node';
import type { ControlAdapterContext, ControlAdapterConnection } from '../control-adapter';

/** Connects either an NG_VALUE_ACCESSOR provider or a directly assigned NgControl accessor. */
export const connectCvaAdapter = <TNode extends Node>(context: ControlAdapterContext<TNode>, accessor: ControlValueAccessor): ControlAdapterConnection => {
  const { binding, getNgControl } = context;
  const injector = binding.injector;
  let destroyed = false;
  let writingAccessorValue = false;
  let lastViewValue: unknown = Symbol('unset');
  injector.get(DestroyRef).onDestroy(() => { destroyed = true; });

  getNgControl().valueAccessor = accessor;
  accessor.registerOnChange((value: unknown) => {
    if (destroyed || writingAccessorValue) return;
    lastViewValue = value;
    (binding.node() as unknown as InternalNode).$api._setControlValue(value);
  });
  accessor.registerOnTouched(() => {
    if (destroyed) return;
    binding.node().$api.markAsTouched();
    (binding.node() as unknown as InternalNode).$api._flushControlValueOnBlur();
  });
  effect(() => {
    const value = (binding.node() as unknown as InternalNode).$api._controlValue();
    if (Object.is(value, lastViewValue)) return;
    lastViewValue = value;
    untracked(() => {
      writingAccessorValue = true;
      try {
        accessor.writeValue(value);
      } finally {
        writingAccessorValue = false;
      }
    });
  }, { injector });
  if (accessor.setDisabledState) {
    effect(() => {
      const disabled = binding.node().$api.disabled();
      untracked(() => accessor.setDisabledState!(disabled));
    }, { injector });
  }
  connectLegacyValidators(context);
  return connectControlInputs(accessor, binding.node, injector, hasControlStateConsumer(binding.element));
};
