import type { Provider } from '@angular/core';

import type { Equal, Expect, HasKey } from './assert.types';
import { FormNode, createFormPrimitives, field, useFormNodeState, provideFormNodesConfig, configureGlobalFormNodes, type GlobalFormNodesConfig, type ControlState, type ControlStateError, type FormNodeBinding, type FormNodesConfig, type FormPrimitives, type FormPrimitivesOptions } from '../../src/public-api';

const name = field.strict('David');
const configuredForms: FormPrimitives<false> = createFormPrimitives({ nullable: false } satisfies FormPrimitivesOptions<false>);
declare const nameBinding: FormNodeBinding<typeof name>;
declare const nameDirective: FormNode<typeof name>;

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

void [markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions, boundValue, boundErrorKind, configuredForms];

const combinedConfig: FormNodesConfig = {
  validatorMessages: () => ({
    required: 'Required',
    minLength: ({ minLength }) => `At least ${minLength} characters`,
  }),
  syncControlInputs: false,
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
  syncControlInputs: null,
};
provideFormNodesConfig(resetConfig);
provideFormNodesConfig({ validatorMessages: null, classes: null, syncControlInputs: null });

provideFormNodesConfig({ validatorMessages: undefined, classes: undefined, syncControlInputs: undefined });

const globalConfig: GlobalFormNodesConfig = {
  validatorMessages: () => ({ min: ({ min }) => `Minimum ${min}` }),
  classes: { invalid: binding => binding.node().$api.invalid() },
  syncControlInputs: false,
};
const restoreGlobal: () => void = configureGlobalFormNodes(globalConfig);
configureGlobalFormNodes({ validatorMessages: null, classes: null, syncControlInputs: null });
configureGlobalFormNodes({ validatorMessages: undefined, classes: undefined, syncControlInputs: undefined });
configureGlobalFormNodes({ validatorMessages: () => undefined });
// @ts-expect-error Global message callbacks must return messages or undefined.
configureGlobalFormNodes({ validatorMessages: { required: () => 123 } });
void restoreGlobal;
