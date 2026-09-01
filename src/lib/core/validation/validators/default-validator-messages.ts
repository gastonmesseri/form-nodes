export const defaultValidatorMessages = {
  required(): string {
    return 'This field is required.';
  },
  email(): string {
    return 'Please enter a valid email address.';
  },
  url(): string {
    return 'Please enter a valid absolute URL.';
  },
  oneOf(): string {
    return 'Please enter one of the allowed values.';
  },
  min(minimum: number): string {
    return `Please enter a value greater than or equal to ${minimum}.`;
  },
  max(maximum: number): string {
    return `Please enter a value less than or equal to ${maximum}.`;
  },
  minLength(minimum: number): string {
    const unit = minimum === 1 ? 'character or item' : 'characters or items';
    return `Please provide at least ${minimum} ${unit}.`;
  },
  maxLength(maximum: number): string {
    const unit = maximum === 1 ? 'character or item' : 'characters or items';
    return `Please provide no more than ${maximum} ${unit}.`;
  },
  minWords(minimum: number): string {
    const unit = minimum === 1 ? 'word' : 'words';
    return `Please enter at least ${minimum} ${unit}.`;
  },
  maxWords(maximum: number): string {
    const unit = maximum === 1 ? 'word' : 'words';
    return `Please enter no more than ${maximum} ${unit}.`;
  },
  pattern(expression: RegExp): string {
    return `Please enter a value that matches ${expression.toString()}.`;
  },
  minDate(minimum: Date): string {
    return `Please enter a date on or after ${minimum.toISOString()}.`;
  },
  maxDate(maximum: Date): string {
    return `Please enter a date on or before ${maximum.toISOString()}.`;
  },
} as const;
