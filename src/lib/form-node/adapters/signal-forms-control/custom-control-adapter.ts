import { DestroyRef, effect, signal, untracked, type Injector, type WritableSignal } from '@angular/core';

import { findModelTransport } from './model-transport';
import { createPairedTransport } from './paired-transport';
import { connectControlInputs } from '../sync-control-inputs';
import type { FormNodeControl } from '../../form-node-control';
import type { ControlAdapterConnection } from '../control-adapter';
import { FORM_NODE_SYNC_INPUTS } from '../../provide-form-nodes-config';
import type { InternalNode, Node, NodeValue } from '../../../types/node.type';
import { getNodeInputConfig } from '../../../configuration/node-input-config';
import { getGlobalSyncInputs } from '../../../configuration/configure-global-form-nodes';
import { registerExternalValidationErrors } from '../../../validation/external-validation-errors';

/** Connects a provided signal-based custom control to a field, form, or array node. */
export const connectCustomControlAdapter = <TNode extends Node>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
): ControlAdapterConnection => {
  const directModel = findModelTransport(control);
  const experimental = directModel === undefined;
  const model = directModel === undefined ? createPairedTransport(control, injector, usesControlState) : directModel;
  const inheritedMode = injector.get(FORM_NODE_SYNC_INPUTS, null) ?? getGlobalSyncInputs();
  const enabled = () => {
    if (!experimental) return true;
    const ownMode = getNodeInputConfig(node()).mode;
    const mode = ownMode === undefined ? inheritedMode : ownMode;
    return mode !== false && mode !== null && mode !== 'only-signal-controls';
  };
  let lastWrittenNode: TNode | undefined;
  const nodeInput = control.node as WritableSignal<TNode | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  const { inputNames } = connectControlInputs(control, node, injector, usesControlState, !experimental);

  const valueSubscription = model.subscribe((value) => {
    if (enabled() && !writingControlValue) (node() as unknown as InternalNode).$api._setControlValue(value);
  });
  const touchSubscription = control.touch?.subscribe(() => {
    if (!enabled()) return;
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
    if (!enabled()) {
      lastWrittenNode = undefined;
      return;
    }
    const value = (currentNode as unknown as InternalNode).$api._controlValue();
    untracked(() => {
      nodeInput?.set(currentNode);
      if ((!experimental || lastWrittenNode === currentNode) && Object.is(model(), value)) return;
      writingControlValue = true;
      try {
        model.set(value);
        lastWrittenNode = currentNode;
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
