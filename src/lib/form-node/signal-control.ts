import { DestroyRef, effect, reflectComponentType, signal, untracked, type Injector, type ModelSignal, type Type, type WritableSignal } from '@angular/core';

import type { FormNodeControl } from './form-node-control';
import { FORM_NODE_SYNC_INPUTS } from './provide-form-nodes-config';
import type { InternalNode, Node, NodeValue } from '../types/node.type';
import { getNodeInputConfig } from '../configuration/node-input-config';
import { connectSignalControlInputs } from './utils/signal-control-inputs';
import { getGlobalSyncInputs } from '../configuration/configure-global-form-nodes';
import { registerExternalValidationErrors } from '../validation/external-validation-errors';
import { warnFailedInputWrite, writeComponentInput } from './angular-internals/component-input-writer';

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
): { model: ModelSignal<NodeValue<TNode>>; experimental: boolean } => {
  for (const name of ['value', 'checked'] as const) {
    const candidate = control[name] as ModelCandidate<NodeValue<TNode>> | undefined;
    if (typeof candidate === 'function' && typeof candidate.set === 'function' && typeof candidate.subscribe === 'function') {
      return { model: candidate as ModelSignal<NodeValue<TNode>>, experimental: false };
    }
  }
  const mirror = reflectComponentType((control as unknown as { constructor: Type<unknown> }).constructor);
  const record = control as unknown as Record<string, unknown>;
  for (const name of ['value', 'checked'] as const) {
    const input = mirror?.inputs.find(({ templateName }) => templateName === name);
    const output = mirror?.outputs.find(({ templateName }) => templateName === `${name}Change`);
    if (!input || !output) continue;
    const emitter = record[output.propName] as { subscribe?: ModelSignal<NodeValue<TNode>>['subscribe'] } | undefined;
    if (typeof emitter?.subscribe !== 'function') continue;
    let lastValue: unknown = Symbol('unset');
    const model = (() => lastValue) as ModelSignal<NodeValue<TNode>>;
    model.set = (value) => {
      if (writeComponentInput(control, name, value, injector)) lastValue = value;
      else warnFailedInputWrite(control, name, usesControlState);
    };
    model.subscribe = listener => emitter.subscribe!(listener);
    return { model, experimental: true };
  }
  throw new Error('formNode: a custom control requires a \'value\' or \'checked\' model, or a matching input-output pair');
};

/** Connects a provided signal-based custom control to a field, form, or array node. */
export const connectSignalControl = <TNode extends Node>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
): SignalControlConnection => {
  const { model, experimental } = getControlModel(control, injector, usesControlState);
  const inheritedMode = injector.get(FORM_NODE_SYNC_INPUTS, null) ?? getGlobalSyncInputs();
  const enabled = () => {
    if (!experimental) return true;
    const ownMode = getNodeInputConfig(node()).mode;
    const mode = ownMode === undefined ? inheritedMode : ownMode;
    return mode !== false && mode !== null;
  };
  let lastWrittenNode: TNode | undefined;
  const nodeInput = control.node as WritableSignal<TNode | null> | undefined;
  const validationOwner = {};
  const noErrors = signal<readonly []>([]);
  let writingControlValue = false;

  const { inputNames } = connectSignalControlInputs(control, node, injector, usesControlState);

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
