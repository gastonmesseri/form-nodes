export const defaultRequiredMessage = (): string => {
  return 'This field is required.';
};

export const defaultEmailMessage = (): string => {
  return 'Please enter a valid email address.';
};

export const defaultUrlMessage = (): string => {
  return 'Please enter a valid absolute URL.';
};

export const defaultEqualToMessage = (): string => {
  return 'Please enter the matching value.';
};

export const defaultUniqueItemsMessage = (): string => {
  return 'Please ensure every item is unique.';
};

export const defaultOneOfMessage = (): string => {
  return 'Please enter one of the allowed values.';
};

export const defaultMinMessage = (minimum: number): string => {
  return `Please enter a value greater than or equal to ${minimum}.`;
};

export const defaultMaxMessage = (maximum: number): string => {
  return `Please enter a value less than or equal to ${maximum}.`;
};

export const defaultBetweenMessage = (minimum: number, maximum: number): string => {
  return `Please enter a value between ${minimum} and ${maximum}.`;
};

export const defaultIntegerMessage = (): string => {
  return 'Please enter a safe integer.';
};

export const defaultMinLengthMessage = (minimum: number): string => {
  const unit = minimum === 1 ? 'character or item' : 'characters or items';
  return `Please provide at least ${minimum} ${unit}.`;
};

export const defaultMaxLengthMessage = (maximum: number): string => {
  const unit = maximum === 1 ? 'character or item' : 'characters or items';
  return `Please provide no more than ${maximum} ${unit}.`;
};

export const defaultMinWordsMessage = (minimum: number): string => {
  const unit = minimum === 1 ? 'word' : 'words';
  return `Please enter at least ${minimum} ${unit}.`;
};

export const defaultMaxWordsMessage = (maximum: number): string => {
  const unit = maximum === 1 ? 'word' : 'words';
  return `Please enter no more than ${maximum} ${unit}.`;
};

export const defaultPatternMessage = (expression: RegExp): string => {
  return `Please enter a value that matches ${expression.toString()}.`;
};

export const defaultMinDateMessage = (minimum: Date): string => {
  return `Please enter a date on or after ${minimum.toISOString()}.`;
};

export const defaultMaxDateMessage = (maximum: Date): string => {
  return `Please enter a date on or before ${maximum.toISOString()}.`;
};

export const defaultDateBetweenMessage = (minimum: Date, maximum: Date): string => {
  return `Please enter a date between ${minimum.toISOString()} and ${maximum.toISOString()}.`;
};
