import { DestroyRef, effect, reflectComponentType, signal, untracked, type Injector, type ModelSignal, type Type, type WritableSignal } from '@angular/core';

import type { FormNodeControl } from './form-node-control';
import type { InternalNode, Node, NodeValue } from '../../types/node.type';
import { connectSignalControlInputs } from './utils/signal-control-inputs';
import { warnFailedInputWrite, writeComponentInput } from './angular-internals/component-input-writer';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';

export type SignalControlConnection = {
  focus?: (options?: FocusOptions) => void;
  inputNames: ReadonlySet<string>;
};

type ModelCandidate<TValue> = (() => TValue) & {
  set?: (value: TValue) => void;
  subscribe?: (listener: (value: TValue) => void) => { unsubscribe(): void };
};

const getControlModel = <TNode extends Node>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  injector: Injector,
  usesControlState: boolean,
): ModelSignal<NodeValue<TNode>> => {
  const candidate = control as unknown as Record<PropertyKey, unknown>;
  const mirror = reflectComponentType((control as unknown as { constructor: Type<unknown> }).constructor);
  const valueCandidate = candidate['value'] as ModelCandidate<NodeValue<TNode>> | undefined;
  const hasValueModel = typeof valueCandidate === 'function' && typeof valueCandidate.set === 'function' && typeof valueCandidate.subscribe === 'function';
  const name = hasValueModel || mirror?.inputs.some(({ templateName }) => templateName === 'value') ? 'value' : 'checked';
  const currentModel = candidate[name] as ModelCandidate<NodeValue<TNode>> | undefined;
  if (typeof currentModel === 'function' && typeof currentModel.set === 'function' && typeof currentModel.subscribe === 'function') {
    return currentModel as ModelSignal<NodeValue<TNode>>;
  }
  const inputMetadata = mirror?.inputs.find(({ templateName }) => templateName === name);
  const outputMetadata = mirror?.outputs.find(({ templateName }) => templateName === `${name}Change`);
  const output = outputMetadata ? candidate[outputMetadata.propName] as { subscribe(listener: (value: NodeValue<TNode>) => void): { unsubscribe(): void } } : undefined;
  if (!inputMetadata || !output?.subscribe) throw new Error(`formNode: a signal custom control requires a '${name}' model or '${name}'/'${name}Change' input-output pair`);
  let lastValue: NodeValue<TNode> | symbol = Symbol('unset');
  const model = (() => lastValue as NodeValue<TNode>) as ModelSignal<NodeValue<TNode>>;
  model.set = (value) => {
    lastValue = value;
    if (!writeComponentInput(control, name, value, injector)) warnFailedInputWrite(control, name, usesControlState);
  };
  model.subscribe = listener => output.subscribe((value) => {
    lastValue = value;
    listener(value);
  });
  return model;
};

/** Connects a provided signal-based custom control to a field, form, or array node. */
export const connectSignalControl = <TNode extends Node>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
): SignalControlConnection => {
  const model = getControlModel(control, injector, usesControlState);
  const nodeInput = control.node as WritableSignal<TNode | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  const { inputNames } = connectSignalControlInputs(control, node, injector, usesControlState);

  const valueSubscription = model.subscribe((value) => {
    if (!writingControlValue) (node() as unknown as InternalNode).$api._setControlValue(value);
  });
  const touchSubscription = control.touch?.subscribe(() => {
    const currentNode = node() as unknown as InternalNode;
    currentNode.$api.markAsTouched();
    currentNode.$api._flushControlValueOnBlur();
  });

  injector.get(DestroyRef).onDestroy(() => {
    valueSubscription.unsubscribe();
    touchSubscription?.unsubscribe();
    nodeInput?.set(null);
  });

  effect(() => {
    const currentNode = node();
    const value = (currentNode as unknown as InternalNode).$api._controlValue();
    untracked(() => {
      nodeInput?.set(currentNode);
      if (Object.is(model(), value)) return;
      writingControlValue = true;
      try {
        model.set(value);
      } finally {
        writingControlValue = false;
      }
    });
  }, { injector });

  const reset = control.reset?.bind(control);
  if (reset) {
    effect((onCleanup) => {
      onCleanup(registerExternalValidationErrors(node(), validationOwner, noErrors, { onReset: reset }));
    }, { injector });
  }

  return control.focus ? { focus: control.focus.bind(control), inputNames } : { inputNames };
};
