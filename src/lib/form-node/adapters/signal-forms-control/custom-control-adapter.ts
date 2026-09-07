import { DestroyRef, effect, signal, untracked, type Injector, type WritableSignal } from '@angular/core';

import { findModelTransport } from './model-transport';
import { createPairedTransport } from './paired-transport';
import { connectControlInputs } from '../sync-control-inputs';
import type { FormNodeControl } from '../../form-node-control';
import type { ControlAdapterConnection } from '../control-adapter';
import type { InternalNode, Node, NodeValue } from '../../../types/node.type';
import { getNodeInputConfig } from '../../../configuration/node-input-config';
import { FORM_NODE_BIND_INPUT_OUTPUT_PAIRS } from '../../provide-form-nodes-config';
import { registerExternalValidationErrors } from '../../../validation/external-validation-errors';
import { getGlobalBindInputOutputPairs } from '../../../configuration/configure-global-form-nodes';

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
  const inheritedPairs = injector.get(FORM_NODE_BIND_INPUT_OUTPUT_PAIRS, null) ?? getGlobalBindInputOutputPairs();
  const enabled = () => {
    if (!experimental) return true;
    const ownPairs = getNodeInputConfig(node()).bindInputOutputPairs;
    return ownPairs === undefined ? inheritedPairs : ownPairs === true;
  };
  let lastWrittenNode: TNode | undefined;
  const nodeInput = control.node as WritableSignal<TNode | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  const { inputNames } = connectControlInputs(control, node, injector, usesControlState, experimental ? 'pairs' : 'signal-controls', enabled);

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
      untracked(() => nodeInput?.set(null));
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
      if (enabled()) onCleanup(registerExternalValidationErrors(node(), validationOwner, noErrors, { onReset: reset }));
    }, { injector });
  }

  return control.focus ? {
    focus: (options) => {
      if (enabled()) control.focus!(options);
    },
    inputNames,
  } : { inputNames };
};
