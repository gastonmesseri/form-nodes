import { CSP_NONCE, DestroyRef, afterEveryRender, computed, effect, signal, untracked } from '@angular/core';

import type { FieldNode } from '../../../primitives/field';
import type { InternalNode, AnyNode, NodeValue } from '../../../types/node.type';
import type { ControlAdapterContext, ControlAdapterConnection } from '../control-adapter';
import type { ValidationErrorWithoutTargetNode } from '../../../validation/validation.type';
import { registerExternalValidationErrors } from '../../../validation/external-validation-errors';
import { nativeInputRequiresValidityTracking, watchNativeInputValidity } from './native-input-validity';
import { isNativeInput, isNativeSelect, parseNativeControlValue, writeNativeControlValue, type NativeFormNodeControl } from './native-control-value';

/** Owns native events, parsing errors, composition, and DOM value synchronization. */
export const connectNativeControlAdapter = <TNode extends AnyNode>({ binding, renderer }: ControlAdapterContext<TNode>, control: NativeFormNodeControl): ControlAdapterConnection => {
  const injector = binding.injector;
  const destroyRef = injector.get(DestroyRef);
  const cspNonce = injector.get(CSP_NONCE, null);
  const parsingOwner = {};
  let composing = false;
  let destroyed = false;
  destroyRef.onDestroy(() => { destroyed = true; });
  const getNativeField = (): FieldNode<NodeValue<TNode>> => {
    const node = binding.node() as unknown as Partial<FieldNode<NodeValue<TNode>>>;
    if (typeof node.setControlValue !== 'function') {
      throw new Error('formNode: native controls require a field node');
    }
    return node as FieldNode<NodeValue<TNode>>;
  };

  const parseErrors = signal<readonly ValidationErrorWithoutTargetNode[]>([]);
  const bindingParseErrors = computed(() => {
    return parseErrors().map(error => ({
      ...error,
      formNode: binding,
    }));
  });
  const commit = () => {
    if (composing || destroyed) return;
    if (isNativeInput(control) && control.type === 'radio' && !control.checked) return;
    const field = getNativeField();
    field.markAsDirty();
    const result = parseNativeControlValue(control, () => field.controlValue());
    parseErrors.set(result.error ? [result.error] : []);
    if ('value' in result) field.setControlValue(result.value as NodeValue<TNode>);
  };
  const unlistenInput = renderer.listen(control, 'input', commit);
  const unlistenChange = renderer.listen(control, 'change', commit);
  const unlistenBlur = renderer.listen(control, 'blur', () => {
    binding.node().$api.markAsTouched();
    (binding.node() as unknown as InternalNode).$api._flushControlValueOnBlur();
  });
  const unlistenCompositionStart = renderer.listen(control, 'compositionstart', () => { composing = true; });
  const unlistenCompositionEnd = renderer.listen(control, 'compositionend', () => {
    composing = false;
    commit();
  });
  destroyRef.onDestroy(() => {
    unlistenInput();
    unlistenChange();
    unlistenBlur();
    unlistenCompositionStart();
    unlistenCompositionEnd();
  });
  effect((onCleanup) => {
    const field = getNativeField();
    onCleanup(registerExternalValidationErrors(field, parsingOwner, bindingParseErrors, {
      onReset: () => {
        parseErrors.set([]);
        writeNativeControlValue(control, field.controlValue());
      },
    }));
  }, { injector });
  effect(() => {
    const value = getNativeField().controlValue();
    untracked(() => {
      parseErrors.set([]);
      writeNativeControlValue(control, value);
    });
  }, { injector });
  if (isNativeInput(control) && control.type === 'radio') {
    afterEveryRender(() => writeNativeControlValue(control, getNativeField().controlValue()), { injector });
  }
  if (isNativeInput(control) && nativeInputRequiresValidityTracking(control)) {
    const stopWatchingValidity = watchNativeInputValidity(control, commit, cspNonce ?? undefined);
    destroyRef.onDestroy(stopWatchingValidity);
  }
  if (isNativeSelect(control) && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => writeNativeControlValue(control, getNativeField().controlValue()));
    observer.observe(control, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    destroyRef.onDestroy(() => observer.disconnect());
  }
  return { inputNames: new Set() };
};
