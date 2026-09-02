import { CheckboxControlValueAccessor, DefaultValueAccessor, NumberValueAccessor, RadioControlValueAccessor, RangeValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, type ControlValueAccessor, type ValidationErrors, type Validator, type ValidatorFn } from '@angular/forms';

import type { ValidationError } from '../validation/validation.type';

const builtInAccessors = [
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  NumberValueAccessor,
  RadioControlValueAccessor,
  RangeValueAccessor,
  SelectControlValueAccessor,
  SelectMultipleControlValueAccessor,
];

const isBuiltInAccessor = (accessor: ControlValueAccessor): boolean => {
  return builtInAccessors.some(accessorType => accessor instanceof accessorType);
};

export const selectValueAccessor = (accessors: readonly ControlValueAccessor[] | null): ControlValueAccessor | null => {
  if (!accessors || accessors.length === 0) return null;
  let defaultAccessor: ControlValueAccessor | undefined;
  let builtInAccessor: ControlValueAccessor | undefined;
  let customAccessor: ControlValueAccessor | undefined;

  accessors.forEach((accessor) => {
    if (accessor instanceof DefaultValueAccessor) {
      if (defaultAccessor) throw new Error('formNode: more than one default ControlValueAccessor matches the host');
      defaultAccessor = accessor;
    } else if (isBuiltInAccessor(accessor)) {
      if (builtInAccessor) throw new Error('formNode: more than one built-in ControlValueAccessor matches the host');
      builtInAccessor = accessor;
    } else {
      if (customAccessor) throw new Error('formNode: more than one custom ControlValueAccessor matches the host');
      customAccessor = accessor;
    }
  });

  return customAccessor ?? builtInAccessor ?? defaultAccessor!;
};

export const isValidatorObject = (validator: ValidatorFn | Validator): validator is Validator => {
  return typeof validator === 'object' && validator !== null;
};

export const toControlErrors = (errors: ValidationErrors | null): readonly ValidationError.WithoutTargetNode[] => {
  return errors ? Object.entries(errors).map(([kind, context]) => ({ kind, context })) : [];
};

export const elementAcceptsMinMax = (element: HTMLElement): element is HTMLInputElement => {
  if (element.tagName !== 'INPUT') return false;
  const type = (element as HTMLInputElement).type;
  return type === 'number' || type === 'range' || type === 'date' || type === 'month';
};

export const isTextualFormElement = (element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement => {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
};

export const formatNativeLimit = (value: unknown, type: string): unknown => {
  if (!(value instanceof Date) || (type !== 'date' && type !== 'month')) return value;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  if (type === 'month') return `${year}-${month}`;
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatNativePattern = (patterns: readonly RegExp[]): string => {
  if (patterns.length <= 1) return patterns[0]?.source ?? '';
  return `${patterns.map(pattern => `(?=(?:${pattern.source})$)`).join('')}.*`;
};
