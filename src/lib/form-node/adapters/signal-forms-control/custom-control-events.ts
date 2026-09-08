import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DestroyRef, getDebugNode, reflectComponentType, type Injector, type ModelSignal, type Type } from '@angular/core';

import { findModelTransport } from './model-transport';
import { createPairedTransport } from './paired-transport';
import type { FormNodeControl } from '../../form-node-control';
import { hasControlStateConsumer } from '../../../form-node-state/adapters/form-node';

export type CustomControlEvents = {
  control: FormNodeControl;
  model: ModelSignal<unknown>;
  connect(value: (value: unknown) => void, touch: () => void): void;
  disconnect(): void;
};

/** Reserves output subscription order before Angular registers consumer template listeners. */
export const prepareCustomControlEvents = (element: HTMLElement, injector: Injector): CustomControlEvents | undefined => {
  const tokens = getDebugNode(element)?.providerTokens ?? [];
  if (tokens.includes(NG_VALUE_ACCESSOR)) return;
  const type = tokens.find(token => typeof token === 'function' && reflectComponentType(token as Type<unknown>)) as Type<FormNodeControl> | undefined;
  if (!type) return;
  const mirror = reflectComponentType(type)!;
  if (mirror.inputs.some(input => input.templateName === 'formNode')) return;
  if (!['value', 'checked'].some(name => mirror.inputs.some(input => input.templateName === name) && mirror.outputs.some(output => output.templateName === `${name}Change`))) return;
  let control: FormNodeControl;
  try {
    control = injector.get(type);
  } catch (error) {
    // NG0200: preserve reentrant binding injection until the host finishes construction.
    if ((error as { code?: unknown } | null)?.code === -200) return;
    throw error;
  }
  const directModel = findModelTransport(control);
  const model = directModel === undefined ? createPairedTransport(control, injector, hasControlStateConsumer(element)) : directModel;
  let onValue: ((value: unknown) => void) | undefined;
  let onTouch: (() => void) | undefined;
  const valueSubscription = model.subscribe(value => onValue?.(value));
  const touchSubscription = control.touch?.subscribe(() => onTouch?.());
  const disconnect = () => {
    onValue = undefined;
    onTouch = undefined;
    valueSubscription.unsubscribe();
    touchSubscription?.unsubscribe();
  };
  injector.get(DestroyRef).onDestroy(disconnect);
  return {
    control,
    model,
    connect(value, touch) {
      onValue = value;
      onTouch = touch;
    },
    disconnect,
  };
};
