import type { FieldContext } from '../validation/validation.type';

const fieldContextMarker = Symbol('FieldContext');

type MarkedFieldContext = FieldContext<unknown> & {
  readonly [fieldContextMarker]: true;
};

/** Marks a field context without exposing the marker through its public type. */
export const markAsFieldContext = <TValue>(context: FieldContext<TValue>): FieldContext<TValue> => {
  Object.defineProperty(context, fieldContextMarker, { value: true });
  return context;
};

/** Checks whether a value was created as an internal field context. */
export const isFieldContext = (value: unknown): value is FieldContext<unknown> =>
  typeof value === 'object'
  && value !== null
  && (value as MarkedFieldContext)[fieldContextMarker] === true;
