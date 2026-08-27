import { untracked } from '@angular/core';

export type NativeFormNodeControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const isNativeInput = (element: NativeFormNodeControl): element is HTMLInputElement =>
  element.tagName === 'INPUT';

export const isNativeSelect = (element: NativeFormNodeControl): element is HTMLSelectElement =>
  element.tagName === 'SELECT';

export const isNativeFormNodeControl = (element: HTMLElement): element is NativeFormNodeControl =>
  element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA';

const readSelectedValues = (select: HTMLSelectElement): string[] =>
  Array.from(select.selectedOptions, (option) => option.value);

export const readNativeControlValue = (
  element: NativeFormNodeControl,
  currentValue: () => unknown,
): unknown => {
  if (isNativeSelect(element) && element.multiple) return readSelectedValues(element);
  if (!isNativeInput(element)) return element.value;

  switch (element.type) {
    case 'checkbox':
      return element.checked;
    case 'radio':
      return element.checked ? element.value : untracked(currentValue);
    case 'number':
    case 'range':
    case 'datetime-local': {
      const value = untracked(currentValue);
      return typeof value === 'number' || value === null
        ? element.value === '' ? null : element.valueAsNumber
        : element.value;
    }
    case 'date':
    case 'month':
    case 'time':
    case 'week': {
      const value = untracked(currentValue);
      if (value === null || value instanceof Date) return element.valueAsDate;
      if (typeof value === 'number') return element.valueAsNumber;
      return element.value;
    }
    case 'text': {
      const value = untracked(currentValue);
      if (typeof value !== 'number' && value !== null) return element.value;
      if (element.value === '') return null;
      const parsed = Number(element.value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    default:
      return element.value;
  }
};

const writeNumber = (element: HTMLInputElement, value: number): void => {
  if (Number.isNaN(value)) element.value = '';
  else element.valueAsNumber = value;
};

const writeSelectedValues = (select: HTMLSelectElement, value: unknown): void => {
  const selectedValues = new Set(Array.isArray(value) ? value.map(String) : []);
  Array.from(select.options).forEach((option) => { option.selected = selectedValues.has(option.value); });
};

export const writeNativeControlValue = (element: NativeFormNodeControl, value: unknown): void => {
  if (isNativeSelect(element) && element.multiple) {
    writeSelectedValues(element, value);
    return;
  }
  if (!isNativeInput(element)) {
    element.value = value == null ? '' : String(value);
    return;
  }

  switch (element.type) {
    case 'checkbox':
      element.checked = Boolean(value);
      return;
    case 'radio':
      element.checked = Object.is(value, element.value);
      return;
    case 'number':
    case 'range':
    case 'datetime-local':
      if (typeof value === 'number') writeNumber(element, value);
      else element.value = value == null ? '' : String(value);
      return;
    case 'date':
    case 'month':
    case 'time':
    case 'week':
      if (value === null || value instanceof Date) element.valueAsDate = value;
      else if (typeof value === 'number') writeNumber(element, value);
      else element.value = value == null ? '' : String(value);
      return;
    default:
      element.value = value == null ? '' : String(value);
  }
};
