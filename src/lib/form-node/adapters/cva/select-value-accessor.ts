import { CheckboxControlValueAccessor, DefaultValueAccessor, NumberValueAccessor, RadioControlValueAccessor, RangeValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, type ControlValueAccessor } from '@angular/forms';

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
