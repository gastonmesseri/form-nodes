import { ChangeDetectorRef, reflectComponentType, untracked, type Injector, type Type } from '@angular/core';

type InputSignalNodeLike = {
  transformFn?: (value: unknown) => unknown;
  applyValueToInputSignal(node: InputSignalNodeLike, value: unknown): void;
};

type ComponentDefLike = {
  setInput: ((
    instance: object,
    inputSignalNode: InputSignalNodeLike | null,
    value: unknown,
    publicName: string,
    privateName: string,
  ) => void) | null;
};

type ComponentTypeWithDef = Type<unknown> & {
  readonly ɵcmp?: ComponentDefLike;
};

const warnedInputs = new WeakMap<object, Set<string>>();

/** Warns once when a recognized Angular input cannot be synchronized through this boundary. */
export const warnFailedInputWrite = (control: object, name: string, usesControlState = false) => {
  let names = warnedInputs.get(control);
  if (!names) {
    names = new Set();
    warnedInputs.set(control, names);
  }
  if (names.has(name)) return;
  names.add(name);

  let controlName = 'custom control';
  try {
    const candidate = (control as { constructor?: { name?: unknown } }).constructor?.name;
    if (typeof candidate === 'string' && candidate) controlName = candidate;
  } catch {
    // Keep the generic control name when the instance cannot be inspected safely.
  }
  console.warn(
    `formNode: could not synchronize the '${name}' input on ${controlName} because its Angular input internals are incompatible. `
    + `The control remains connected, but this input may be stale.${usesControlState ? '' : ' Prefer useControlState() to consume bound state without writable state inputs;'} `
    + 'a ControlValueAccessor is also an option for value and disabled interoperability.',
  );
};

/**
 * Finds Angular's private input-signal node structurally so this boundary does not import its
 * private symbol or node type.
 */
const findInputSignalNode = (input: unknown): InputSignalNodeLike | null => {
  if (typeof input !== 'function') return null;
  try {
    for (const symbol of Object.getOwnPropertySymbols(input)) {
      let candidate: Partial<InputSignalNodeLike> | null;
      try {
        candidate = Reflect.get(input, symbol) as Partial<InputSignalNodeLike> | null;
      } catch {
        continue;
      }
      if (candidate && typeof candidate === 'object' && typeof candidate.applyValueToInputSignal === 'function') {
        return candidate as InputSignalNodeLike;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const applyInputSignalValue = (node: InputSignalNodeLike, value: unknown): boolean => {
  try {
    node.applyValueToInputSignal(node, value);
    return true;
  } catch {
    return false;
  }
};

/** Whether a value contains Angular's structurally recognizable private input-signal node. */
export const isInputSignal = (input: unknown): boolean => findInputSignalNode(input) !== null;

/** Writes an input signal through Angular's structurally discovered private node. */
export const writeInputSignal = (input: unknown, value: unknown): boolean => {
  const node = findInputSignalNode(input);
  if (!node) return false;
  const transformedValue = node.transformFn ? node.transformFn(value) : value;
  return applyInputSignalValue(node, transformedValue);
};

/**
 * Writes an existing Angular component input while preserving as much of Angular's input behavior
 * as the available runtime contracts allow.
 *
 * The input is first resolved through `reflectComponentType()`, including aliases, signal-input
 * metadata, and transforms. The value is then written using the following fallback order:
 *
 * 1. The component definition's private `setInput()` writer, which preserves behavior such as
 *    `ngOnChanges`.
 * 2. The structurally discovered input-signal node for a signal input.
 * 3. `Reflect.set()` for a decorator-based or plain writable input.
 *
 * Failures caused by missing or changed Angular runtime internals return `false` instead of
 * interrupting the form binding. A successful write returns `true`, even when `markForCheck()` is
 * unavailable. Input transforms are consumer code and their errors intentionally propagate.
 *
 * This is an internal compatibility boundary. Its fallback order must not be treated as a public
 * integration contract.
 */
export const writeComponentInput = (control: object, name: string, value: unknown, injector: Injector): boolean => {
  let componentType: ComponentTypeWithDef;
  let mirror: ReturnType<typeof reflectComponentType>;
  try {
    componentType = (control as { constructor: ComponentTypeWithDef }).constructor;
    mirror = reflectComponentType(componentType);
  } catch {
    return false;
  }
  const inputMetadata = mirror?.inputs.find(({ templateName }) => templateName === name);
  if (!inputMetadata) return false;

  const record = control as Record<PropertyKey, unknown>;
  let inputSignalNode: InputSignalNodeLike | null = null;
  try {
    inputSignalNode = inputMetadata.isSignal
      ? findInputSignalNode(record[inputMetadata.propName])
      : null;
  } catch {
    return false;
  }
  if (inputMetadata.isSignal && !inputSignalNode) return false;

  const written = untracked(() => {
    let transformedValue = value;
    if (inputSignalNode?.transformFn) transformedValue = inputSignalNode.transformFn(value);
    else if (inputMetadata.transform) transformedValue = inputMetadata.transform.call(control, value);

    try {
      const componentDef = componentType.ɵcmp;
      if (typeof componentDef?.setInput === 'function') {
        componentDef.setInput.call(componentDef, control, inputSignalNode, transformedValue, name, inputMetadata.propName);
        return true;
      }
    } catch {
      // Fall through to the smaller direct writer when Angular's definition contract changes.
    }

    if (inputSignalNode) return applyInputSignalValue(inputSignalNode, transformedValue);
    return Reflect.set(control, inputMetadata.propName, transformedValue);
  });
  if (!written) return false;

  try {
    injector.get(ChangeDetectorRef).markForCheck();
  } catch {
    // Input state has already been written; unavailable change-detection integration must not break the binding.
  }
  return true;
};
