import type { Provider } from '@angular/core';

import type { Equal, Expect, HasKey } from './assert.types';
import { FormNodeDirective, createFormPrimitives, field, useFormNodeState, provideFormNodesConfig, configureGlobalFormNodes, type GlobalFormNodesConfig, type ControlState, type ControlStateError, type FormNodeBinding, type FormNodesConfig, type FormPrimitives, type FormPrimitivesOptions } from '../../src/public-api';

const name = field.strict('David');
const configuredForms: FormPrimitives<false> = createFormPrimitives({ nullable: false } satisfies FormPrimitivesOptions<false>);
declare const nameBinding: FormNodeBinding<typeof name>;
declare const nameDirective: FormNodeDirective<typeof name>;

type _BindingNode = Expect<Equal<ReturnType<typeof nameBinding.node>, typeof name>>;
type _DirectiveNode = Expect<Equal<ReturnType<typeof nameDirective.node>, typeof name>>;
type _NoDirectiveInput = Expect<Equal<HasKey<typeof nameDirective, '_formNodeInput'>, false>>;
type _NoDirectiveNgControl = Expect<Equal<HasKey<typeof nameDirective, '_ngControl'>, false>>;

nameBinding.errors()[0]?.targetNode.set('Daniel');
nameBinding.focus({ preventScroll: true });
nameBinding.flush();
nameBinding.reset();
nameDirective.errors();
nameDirective.focus();
// @ts-expect-error internal implementation helpers are not public
import { appendMetadataContributions, createNodeDefinitionFactory, createReactiveWatch, markAsAsyncValidator } from '../../src/public-api';

provideFormNodesConfig({
  classes: {
    invalid: (binding: FormNodeBinding) => binding.node().$api.invalid(),
  },
});

const classConfig = {
  classes: {
    touched: (binding: FormNodeBinding) => binding.node().$api.touched(),
  },
};
classConfig.classes.touched = () => true;
provideFormNodesConfig(classConfig);

declare const formNodeState: ControlState<string | null>;
const injectedControlState = useFormNodeState<string | null>();
const boundValue: string | null | undefined = formNodeState.value();
const boundErrors: readonly ControlStateError[] = injectedControlState.errors();
const boundErrorKind: string | undefined = boundErrors[0]?.kind;
const queriedError = injectedControlState.getError('required');
const hasRequiredError = injectedControlState.hasError('required');
type _StateErrorQuery = Expect<Equal<typeof queriedError, ControlStateError | undefined>>;
type _StateHasErrorQuery = Expect<Equal<typeof hasRequiredError, boolean>>;
// @ts-expect-error Error kinds must be strings.
injectedControlState.getError(1);
// @ts-expect-error Error kinds must be strings.
injectedControlState.hasError(null);
if (queriedError) {
  // @ts-expect-error Normalized errors are read-only.
  queriedError.kind = 'changed';
}


void [markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions, boundValue, boundErrorKind, configuredForms];

const combinedConfig: FormNodesConfig = {
  validatorMessages: () => ({
    required: 'Required',
    minLength: ({ minLength }) => `At least ${minLength} characters`,
  }),
  syncInputs: false,
  classes: classConfig.classes,
};
const combinedProviders: Provider[] = provideFormNodesConfig(combinedConfig);
void combinedProviders;
const objectConfig: FormNodesConfig = {
  validatorMessages: {
    required: 'Required',
    minLength: ({ minLength }) => `At least ${minLength} characters`,
  },
};
provideFormNodesConfig(objectConfig);
provideFormNodesConfig({ validatorMessages: { min: ({ min }) => `Minimum: ${min}` } });
// @ts-expect-error Message entries must be strings or message callbacks.
provideFormNodesConfig({ validatorMessages: { required: 123 } });

const resetConfig: FormNodesConfig = {
  validatorMessages: null,
  classes: null,
  syncInputs: null,
};
provideFormNodesConfig(resetConfig);
provideFormNodesConfig({ validatorMessages: null, classes: null, syncInputs: null });

provideFormNodesConfig({ validatorMessages: undefined, classes: undefined, syncInputs: undefined });

const globalConfig: GlobalFormNodesConfig = {
  validatorMessages: () => ({ min: ({ min }) => `Minimum ${min}` }),
  classes: { invalid: binding => binding.node().$api.invalid() },
  syncInputs: false,
};
const restoreGlobal: () => void = configureGlobalFormNodes(globalConfig);
configureGlobalFormNodes({ validatorMessages: null, classes: null, syncInputs: null });
configureGlobalFormNodes({ validatorMessages: undefined, classes: undefined, syncInputs: undefined });
configureGlobalFormNodes({ validatorMessages: () => undefined });
// @ts-expect-error Global message callbacks must return messages or undefined.
configureGlobalFormNodes({ validatorMessages: { required: () => 123 } });
void restoreGlobal;

// Experimental synchronization modes are available on every configuration scope.
field('', { syncInputs: 'declared' });
field('', { syncInputs: 'declared', disabled: false });
configureGlobalFormNodes({ syncInputs: 'all' });
provideFormNodesConfig({ syncInputs: 'declared' });
createFormPrimitives({ syncInputs: 'all' }).form({ name: field('') }, { syncInputs: null });
// @ts-expect-error Only documented synchronization modes are accepted.
field('', { syncInputs: 'sometimes' });

declare const requiredReference: unknown;
const hasValidatorResult = injectedControlState.hasValidator(requiredReference);
type _StateHasValidator = Expect<Equal<typeof hasValidatorResult, boolean | undefined>>;
injectedControlState.hasValidator(null);
injectedControlState.hasValidator({});

const resolvedValidatorResult = injectedControlState.hasValidator(requiredReference, { resolve: true });
type _ResolvedStateValidator = Expect<Equal<typeof resolvedValidatorResult, boolean | undefined>>;
injectedControlState.hasValidator(requiredReference, { resolve: false });
injectedControlState.hasValidator(requiredReference, {});
// @ts-expect-error Resolution must be a boolean.
injectedControlState.hasValidator(requiredReference, { resolve: 'yes' });
