import { DestroyRef, effect, signal, untracked, type Injector, type ModelSignal, type WritableSignal } from '@angular/core';

import type { FormNodeControl } from './form-node-control';
import type { InternalNode, Node, NodeValue } from '../../types/node.type';
import { connectSignalControlInputs } from './utils/signal-control-inputs';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';

export type SignalControlConnection = {
  focus?: (options?: FocusOptions) => void;
  inputNames: ReadonlySet<string>;
};

const getControlModel = <TNode extends Node>(control: FormNodeControl<NodeValue<TNode>, TNode>): ModelSignal<NodeValue<TNode>> =>
  ('value' in control && control.value !== undefined ? control.value : control.checked) as ModelSignal<NodeValue<TNode>>;

/** Connects a provided signal-based custom control to a field, form, or array node. */
export const connectSignalControl = <TNode extends Node>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  node: () => TNode,
  injector: Injector,
): SignalControlConnection => {
  const model = getControlModel(control);
  const nodeInput = control.node as WritableSignal<TNode | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  const { inputNames } = connectSignalControlInputs(control, node, injector);

  const valueSubscription = model.subscribe((value) => {
    if (!writingControlValue) (node() as unknown as InternalNode).$api._setControlValue(value);
  });
  const touchSubscription = control.touch?.subscribe(() => node().$api.markAsTouched());

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
