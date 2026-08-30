type DirectiveDefinition = {
  inputs: Record<string, unknown>;
  declaredInputs: Record<string, string>;
  outputs?: Record<string, string>;
};

type DirectiveType = {
  readonly ɵcmp?: DirectiveDefinition;
  readonly ɵdir?: DirectiveDefinition;
};

const getDefinition = (directive: object): DirectiveDefinition => {
  const type = directive as DirectiveType;
  const definition = type.ɵcmp ?? type.ɵdir;
  if (!definition) throw new Error('Expected an Angular component or directive definition.');
  return definition;
};

/**
 * Registers signal-input metadata omitted by plain Vitest TypeScript transpilation.
 * Production builds receive the same metadata from the Angular compiler.
 */
export const registerSignalInputForJit = (
  directive: object,
  publicName: string,
  classPropertyName: string,
) => {
  const definition = getDefinition(directive);
  definition.inputs = { ...definition.inputs, [publicName]: [classPropertyName, 1, null] };
  definition.declaredInputs = { ...definition.declaredInputs, [publicName]: classPropertyName };
};

/** Registers signal-model metadata omitted by plain Vitest TypeScript transpilation. */
export const registerSignalModelForJit = (
  component: object,
  publicName: string,
  classPropertyName = publicName,
) => {
  registerSignalInputForJit(component, publicName, classPropertyName);
  const definition = getDefinition(component);
  const outputName = `${publicName}Change`;
  definition.outputs = { ...definition.outputs, [outputName]: outputName };
};

/** Registers signal-output metadata omitted by plain Vitest TypeScript transpilation. */
export const registerSignalOutputForJit = (
  component: object,
  publicName: string,
  classPropertyName = publicName,
) => {
  const definition = getDefinition(component);
  definition.outputs = { ...definition.outputs, [publicName]: classPropertyName };
};
