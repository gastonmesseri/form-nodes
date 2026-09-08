import { reflectComponentType, type Type } from '@angular/core';

import type { FormNodeControl } from '../../form-node-control';

/** Output callbacks owned exclusively by the selected custom-control adapter. */
export type CustomControlEvents = {
  valueChange?: (value: unknown) => void;
  checkedChange?: (value: unknown) => void;
  touch?: () => void;
};

/** Routes only the selected value transport and declared touch output through host listeners. */
export const createCustomControlEvents = (
  control: FormNodeControl,
  model: (() => unknown) | undefined,
  onValue: (value: unknown) => void,
  onTouch: () => void,
): CustomControlEvents => {
  const mirror = reflectComponentType(control.constructor as Type<unknown>);
  const record = control as unknown as Record<string, unknown>;
  const events: CustomControlEvents = {};
  for (const name of ['value', 'checked'] as const) {
    const input = mirror?.inputs.find(({ templateName }) => templateName === name);
    const output = mirror?.outputs.find(({ templateName }) => templateName === `${name}Change`);
    if (!input || !output) continue;
    const emitter = record[output.propName] as { subscribe?: unknown } | undefined;
    if (typeof emitter?.subscribe !== 'function') continue;
    if (model !== undefined && record[input.propName] !== model) continue;
    events[`${name}Change`] = onValue;
    break;
  }
  if (mirror?.outputs.some(output => output.templateName === 'touch' && record[output.propName] === control.touch)) {
    events.touch = onTouch;
  }
  return events;
};
