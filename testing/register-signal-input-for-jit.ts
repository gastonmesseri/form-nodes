type DirectiveDefinition = {
  inputs: Record<string, unknown>;
  declaredInputs: Record<string, string>;
};

type DirectiveType = {
  readonly ɵdir: DirectiveDefinition;
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
  const definition = (directive as DirectiveType).ɵdir;
  definition.inputs = { ...definition.inputs, [publicName]: [classPropertyName, 1, null] };
  definition.declaredInputs = { ...definition.declaredInputs, [publicName]: classPropertyName };
};
