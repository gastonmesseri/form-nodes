import { InjectionToken, assertInInjectionContext, inject, makeEnvironmentProviders, signal, type EnvironmentProviders, type Injector } from '@angular/core';

import type { Node } from '../types/node.type';
import type { BuiltInValidationErrorMap, ValidationError } from './validation.type';

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

const VALIDATOR_MESSAGES = new InjectionToken<ValidatorMessages>('ValidatorMessages');
const globalValidatorMessages = signal<ValidatorMessagesSource>({});
const nodeValidatorMessages = new WeakMap<Node, ValidatorMessagesSource>();
const nodeProvidedValidatorMessages = new WeakMap<Node, ValidatorMessages>();
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

const getParent = (node: Node): Node | null => {
  return (node as Node & { $api: { parent: () => Node | null } }).$api.parent();
};

/**
 * Configures the process-wide fallback catalog used outside or below Angular configuration.
 *
 * A source function is evaluated reactively during failing validation. Calling the returned
 * function restores the catalog that was active before this call. Prefer scoped providers or form
 * configuration for concurrent SSR requests, where module state is shared between requests.
 *
 * @reactive Tracks signals read by the catalog source and its selected message function.
 *
 * @param messages Static or reactive partial message catalog.
 * @returns A function that restores the previous global catalog when this configuration is current.
 */
export const configureGlobalValidatorMessages = (
  messages: ValidatorMessages | (() => ValidatorMessages | undefined),
): (() => void) => {
  const previousMessages = globalValidatorMessages();
  globalValidatorMessages.set(messages);
  return () => {
    if (globalValidatorMessages() === messages) globalValidatorMessages.set(previousMessages);
  };
};

/**
 * Provides an application- or route-scoped validator message catalog through Angular DI.
 *
 * The factory runs in an injection context and may inject a translation service. Message functions
 * returned by it are evaluated reactively while their validators are failing.
 *
 * @param factory Factory returning a partial validator message catalog.
 */
export const provideValidatorMessages = (factory: () => ValidatorMessages): EnvironmentProviders => {
  return makeEnvironmentProviders([{ provide: VALIDATOR_MESSAGES, useFactory: factory }]);
};

export const registerNodeValidatorMessages = (
  node: Node,
  messages: ValidatorMessagesSource | undefined,
  injector?: Injector,
) => {
  if (messages !== undefined) nodeValidatorMessages.set(node, messages);
  const providedMessages = getCurrentProvidedMessages(injector);
  if (providedMessages !== undefined) nodeProvidedValidatorMessages.set(node, providedMessages);
};

const createNodeValidatorMessageResolver = (targetNode: Node): ValidatorMessageResolver => {
  return (kind, parameters) => {
    let currentNode: Node | null = targetNode;
    while (currentNode !== null) {
      const source = nodeValidatorMessages.get(currentNode);
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

    return resolveFromMessages(readMessages(globalValidatorMessages()), kind, parameters);
  };
};

export const runWithValidatorMessages = <TResult>(targetNode: Node, callback: () => TResult): TResult => {
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
