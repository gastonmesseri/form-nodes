import type { Equal, Expect, HasKey } from './assert.types';
import { FormNode, createFormPrimitives, field, useFormNodeState, provideFormNodeConfig, type ControlState, type ControlStateError, type FormNodeBinding, type FormPrimitives, type FormPrimitivesOptions } from '../../src/public-api';

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

provideFormNodeConfig({
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
provideFormNodeConfig(classConfig);

declare const formNodeState: ControlState<string | null>;
const injectedControlState = useFormNodeState<string | null>();
const boundValue: string | null | undefined = formNodeState.value();
const boundErrors: readonly ControlStateError[] = injectedControlState.errors();
const boundErrorKind: string | undefined = boundErrors[0]?.kind;

void [markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions, boundValue, boundErrorKind, configuredForms];
