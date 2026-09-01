import { getDebugNode, reflectComponentType, type Type } from '@angular/core';

import type { FormNodeControl } from '../form-node-control';

type ComponentCandidate = Record<PropertyKey, unknown> & { constructor: Type<unknown> };

const getComponentCandidate = (element: HTMLElement): ComponentCandidate | null => {
  const debugNode = getDebugNode(element);
  const candidate = debugNode?.componentInstance as ComponentCandidate | null;
  return candidate && debugNode?.providerTokens.includes(candidate.constructor) ? candidate : null;
};

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
  const candidate = getComponentCandidate(element);
  if (!candidate) return null;
  if (hasModel(candidate, 'value') || hasModel(candidate, 'checked')) return candidate as unknown as FormNodeControl;
  return null;
};

/** Detects a wrapper component that consumes the public `formNode` input itself. */
export const componentAcceptsFormNode = (element: HTMLElement): boolean => {
  const candidate = getComponentCandidate(element);
  return !!candidate && !!reflectComponentType(candidate.constructor)?.inputs.some(({ templateName }) => templateName === 'formNode');
};
