const nonReactiveValidators = new WeakMap<Function, Function>();

/** Retains the source for metadata while giving each helper call its own tracking policy. */
export const markNonReactiveValidator = <TValidator extends Function>(wrapper: TValidator, source: Function): TValidator => {
  nonReactiveValidators.set(wrapper, nonReactiveValidators.get(source) ?? source);
  return wrapper;
};

export const getNonReactiveValidator = (validator: Function): Function | undefined => nonReactiveValidators.get(validator);
