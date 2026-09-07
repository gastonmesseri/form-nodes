import { APP_ID, effect } from '@angular/core';

import type { Field } from '../../../primitives/field';
import { getFormNodeName } from '../../utils/form-node-name';
import type { Node, NodeValue } from '../../../types/node.type';
import type { ControlAdapterContext } from '../control-adapter';
import { isNativeFormNodeControl, elementAcceptsMinMax, formatNativeLimit, formatNativePattern, isTextualFormElement } from './native-control-value';

/** Synchronizes host accessibility and native inputs not owned by a custom component. */
export const syncNativeControlState = <TNode extends Node>({ binding, renderer }: ControlAdapterContext<TNode>, inputNames: ReadonlySet<string>) => {
  const { element, injector } = binding;
  const appId = injector.get(APP_ID);
  const nativeControl = isNativeFormNodeControl(element) ? element : null;

  effect(() => {
    const node = binding.node();
    const field = node as unknown as Partial<Field<NodeValue<TNode>>>;
    if (nativeControl && !inputNames.has('name')) renderer.setProperty(nativeControl, 'name', getFormNodeName(node, appId));
    if (nativeControl && !inputNames.has('disabled')) renderer.setProperty(nativeControl, 'disabled', node.$api.disabled());
    if (nativeControl && !inputNames.has('readonly') && 'readOnly' in nativeControl) renderer.setProperty(nativeControl, 'readOnly', node.$api.readonly());
    if (nativeControl && !inputNames.has('required') && 'required' in nativeControl) renderer.setProperty(nativeControl, 'required', node.$api.required());
    if (elementAcceptsMinMax(element)) {
      if (!inputNames.has('min')) renderer.setProperty(element, 'min', formatNativeLimit(field.min?.(), element.type) ?? '');
      if (!inputNames.has('max')) renderer.setProperty(element, 'max', formatNativeLimit(field.max?.(), element.type) ?? '');
    }
    if (isTextualFormElement(element)) {
      const value = field.minLength?.();
      if (!inputNames.has('minLength')) {
        if (value === null) renderer.removeAttribute(element, 'minlength');
        else renderer.setProperty(element, 'minLength', value);
      }
      const maximumValue = field.maxLength?.();
      if (!inputNames.has('maxLength')) {
        if (maximumValue === null) renderer.removeAttribute(element, 'maxlength');
        else renderer.setProperty(element, 'maxLength', maximumValue);
      }
    }
    if (!inputNames.has('pattern') && 'pattern' in element) renderer.setProperty(element, 'pattern', formatNativePattern(field.pattern?.() ?? []));
    renderer.setAttribute(element, 'aria-invalid', String(node.$api.invalid()));
  }, { injector });
};
