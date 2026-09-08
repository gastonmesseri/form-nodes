import { InjectionToken, assertInInjectionContext, inject, type Injector } from '@angular/core';

import type { AnyNode } from '../types/node.type';
import type { BuiltInValidationErrorMap, ValidationError } from './validation.type';
import { getGlobalValidatorMessages } from '../configuration/configure-global-form-nodes';

/** Structured built-in error data available to a configured message function. */
export type ValidatorMessageParameters<TKind extends keyof BuiltInValidationErrorMap> = Omit<
  BuiltInValidationErrorMap[TKind],
  keyof ValidationError | 'targetNode' | 'formNode'
>;

/**
 * Partial catalog used to replace built-in validator messages by error kind.
 *
 * A string is reused verbatim. A function receives that validator's typed constraint and actual
 * values, and may return `undefined` to continue searching parent, DI, and global catalogs.
 */
export type ValidatorMessages = {
  -readonly [TKind in keyof BuiltInValidationErrorMap]?: string | ((parameters: ValidatorMessageParameters<TKind>) => string | undefined);
};

type ValidatorMessagesSource = ValidatorMessages | (() => ValidatorMessages | undefined);
type ValidatorMessageResolver = <TKind extends keyof BuiltInValidationErrorMap>(
  kind: TKind,
  parameters: ValidatorMessageParameters<TKind>,
) => string | undefined;

export const VALIDATOR_MESSAGES = new InjectionToken<ValidatorMessages>('ValidatorMessages');
const nodeValidatorMessages = new WeakMap<AnyNode, ValidatorMessagesSource>();
const nodeDefaultValidatorMessages = new WeakMap<AnyNode, ValidatorMessagesSource>();
const nodeProvidedValidatorMessages = new WeakMap<AnyNode, ValidatorMessages>();
let activeValidatorMessageResolver: ValidatorMessageResolver | undefined;

const readMessages = (source: ValidatorMessagesSource): ValidatorMessages | undefined => {
  return typeof source === 'function' ? source() : source;
};

const resolveFromMessages = <TKind extends keyof BuiltInValidationErrorMap>(
  messages: ValidatorMessages | undefined,
  kind: TKind,
  parameters: ValidatorMessageParameters<TKind>,
): string | undefined => {
  const message = messages?.[kind] as string | ((value: ValidatorMessageParameters<TKind>) => string | undefined) | undefined;
  return typeof message === 'function' ? message(parameters) : message;
};

const getCurrentProvidedMessages = (injector?: Injector): ValidatorMessages | undefined => {
  if (injector) return injector.get(VALIDATOR_MESSAGES, null) ?? undefined;
  try {
    assertInInjectionContext(getCurrentProvidedMessages);
  } catch {
    return undefined;
  }
  return inject(VALIDATOR_MESSAGES, { optional: true }) ?? undefined;
};

const getParent = (node: AnyNode): AnyNode | null => {
  return (node as AnyNode & { $api: { parent: () => AnyNode | null } }).$api.parent();
};

export const registerNodeValidatorMessages = (
  node: AnyNode,
  messages: ValidatorMessagesSource | undefined,
  injector?: Injector,
) => {
  if (messages !== undefined) nodeValidatorMessages.set(node, messages);
  const providedMessages = getCurrentProvidedMessages(injector);
  if (providedMessages !== undefined) nodeProvidedValidatorMessages.set(node, providedMessages);
};

export const registerNodeDefaultValidatorMessages = (
  node: AnyNode,
  messages: ValidatorMessagesSource | undefined,
) => {
  if (messages !== undefined) nodeDefaultValidatorMessages.set(node, messages);
};

const createNodeValidatorMessageResolver = (targetNode: AnyNode): ValidatorMessageResolver => {
  return (kind, parameters) => {
    let currentNode: AnyNode | null = targetNode;
    while (currentNode !== null) {
      const source = nodeValidatorMessages.get(currentNode);
      const message = source === undefined ? undefined : resolveFromMessages(readMessages(source), kind, parameters);
      if (message !== undefined) return message;
      currentNode = getParent(currentNode);
    }

    currentNode = targetNode;
    while (currentNode !== null) {
      const source = nodeDefaultValidatorMessages.get(currentNode);
      const message = source === undefined ? undefined : resolveFromMessages(readMessages(source), kind, parameters);
      if (message !== undefined) return message;
      currentNode = getParent(currentNode);
    }

    currentNode = targetNode;
    while (currentNode !== null) {
      const message = resolveFromMessages(nodeProvidedValidatorMessages.get(currentNode), kind, parameters);
      if (message !== undefined) return message;
      currentNode = getParent(currentNode);
    }

    return resolveFromMessages(readMessages(getGlobalValidatorMessages()), kind, parameters);
  };
};

export const runWithValidatorMessages = <TResult>(targetNode: AnyNode, callback: () => TResult): TResult => {
  const previousResolver = activeValidatorMessageResolver;
  activeValidatorMessageResolver = createNodeValidatorMessageResolver(targetNode);
  try {
    return callback();
  } finally {
    activeValidatorMessageResolver = previousResolver;
  }
};

export const resolveConfiguredValidatorMessage = <TKind extends keyof BuiltInValidationErrorMap>(
  kind: TKind,
  parameters: ValidatorMessageParameters<TKind>,
): string | undefined => {
  return activeValidatorMessageResolver?.(kind, parameters);
};
