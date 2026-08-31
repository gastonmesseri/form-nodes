import { getDebugNode, reflectComponentType, type Type } from '@angular/core';

import type { FormNodeControl } from '../form-node-control';

type ComponentCandidate = Record<PropertyKey, unknown> & { constructor: Type<unknown> };

const hasModel = (candidate: ComponentCandidate, name: 'value' | 'checked'): boolean => {
  const mirror = reflectComponentType(candidate.constructor);
  if (!mirror) return false;
  const input = mirror.inputs.find(({ templateName }) => templateName === name);
  const output = mirror.outputs.find(({ templateName }) => templateName === `${name}Change`);
  if (!input || !output) return false;
  const model = candidate[input.propName];
  return typeof model === 'function'
    && typeof (model as { set?: unknown }).set === 'function'
    && typeof (model as { subscribe?: unknown }).subscribe === 'function';
};

/** Discovers an Angular Signal Forms compatible component hosted on an element. */
export const discoverSignalControl = (element: HTMLElement): FormNodeControl | null => {
  const debugNode = getDebugNode(element);
  const candidate = debugNode?.componentInstance as ComponentCandidate | null;
  if (!candidate || !debugNode?.providerTokens.includes(candidate.constructor)) return null;
  if (hasModel(candidate, 'value') || hasModel(candidate, 'checked')) return candidate as unknown as FormNodeControl;
  return null;
};
