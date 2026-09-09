import type { ControlValueAccessor } from '@angular/forms';
import { DestroyRef, effect, untracked, ChangeDetectorRef } from '@angular/core';

import { connectLegacyValidators } from './legacy-validators';
import { connectControlInputs } from '../sync-control-inputs';
import type { InternalNode, AnyNode } from '../../../types/node.type';
import { hasControlStateConsumer } from '../../../form-node-state/adapters/form-node';
import type { ControlAdapterContext, ControlAdapterConnection } from '../control-adapter';

/**
 * Connects a provided or directly assigned CVA. Initial value and disabled state are written
 * synchronously before child initialization; later model-to-view writes run through effects.
 */
export const connectCvaAdapter = <TNode extends AnyNode>(context: ControlAdapterContext<TNode>, accessor: ControlValueAccessor): ControlAdapterConnection => {
  const { binding, getNgControl } = context;
  const injector = binding.injector;
  // Some CVAs only assign plain properties; effect-driven writes must refresh their view.
  const changeDetector = injector.get(ChangeDetectorRef);
  let destroyed = false;
  let writingAccessorValue = false;
  let lastViewValue: unknown = Symbol('unset');
  injector.get(DestroyRef).onDestroy(() => { destroyed = true; });

  const writeValue = (value: unknown, force = false) => {
    if (!force && Object.is(value, lastViewValue)) return;
    lastViewValue = value;
    untracked(() => {
      writingAccessorValue = true;
      try {
        accessor.writeValue(value);
        changeDetector.markForCheck();
      } finally {
        writingAccessorValue = false;
      }
    });
  };
  let lastDisabled: boolean | undefined;
  const writeDisabled = (disabled: boolean, force = false) => {
    if (!force && disabled === lastDisabled) return;
    lastDisabled = disabled;
    untracked(() => {
      accessor.setDisabledState?.(disabled);
      changeDetector.markForCheck();
    });
  };

  let lastWrittenNode = binding.node();
  let lastDisabledNode = lastWrittenNode;

  getNgControl().valueAccessor = accessor;
  // CVAs must receive initial state before child controls run their initialization hooks.
  // Later model writes remain scheduled through effects, following signal-based rendering.
  untracked(() => {
    writeValue((binding.node() as unknown as InternalNode).$api._controlValue());
    writeDisabled(binding.node().$api.disabled());
  });
  accessor.registerOnChange((value: unknown) => {
    if (destroyed || writingAccessorValue) return;
    lastViewValue = value;
    context.receiveValue(value);
  });
  accessor.registerOnTouched(() => {
    if (destroyed) return;
    binding.node().$api.markAsTouched();
    (binding.node() as unknown as InternalNode).$api._flushControlValueOnBlur();
  });
  effect(() => {
    const node = binding.node();
    const changedNode = node !== lastWrittenNode;
    lastWrittenNode = node;
    writeValue((node as unknown as InternalNode).$api._controlValue(), changedNode);
  }, { injector });
  if (accessor.setDisabledState) {
    effect(() => {
      const node = binding.node();
      const changedNode = node !== lastDisabledNode;
      lastDisabledNode = node;
      writeDisabled(node.$api.disabled(), changedNode);
    }, { injector });
  }
  connectLegacyValidators(context);
  return {
    ...connectControlInputs(accessor, binding.node, injector, hasControlStateConsumer(binding.element)),
    reset: () => writeValue((binding.node() as unknown as InternalNode).$api._controlValue(), true),
  };
};
