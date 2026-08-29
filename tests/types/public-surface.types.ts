import type { Equal, Expect, HasKey } from './assert.types';
import { FormNode, field, provideFormNodeConfig, type FormNodeBinding } from '../../src/public-api';

const name = field('David', { nullable: false });
declare const nameBinding: FormNodeBinding<typeof name>;
declare const nameDirective: FormNode<typeof name>;

type _BindingNode = Expect<Equal<ReturnType<typeof nameBinding.node>, typeof name>>;
type _DirectiveNode = Expect<Equal<ReturnType<typeof nameDirective.node>, typeof name>>;
type _NoBindingField = Expect<Equal<HasKey<typeof nameBinding, 'field'>, false>>;
type _NoDirectiveField = Expect<Equal<HasKey<typeof nameDirective, 'field'>, false>>;
type _NoDirectiveOnInit = Expect<Equal<HasKey<typeof nameDirective, 'ngOnInit'>, false>>;
type _NoDirectiveInput = Expect<Equal<HasKey<typeof nameDirective, '_formNodeInput'>, false>>;
type _NoDirectiveNgControl = Expect<Equal<HasKey<typeof nameDirective, '_ngControl'>, false>>;

nameBinding.errors()[0]?.targetNode.set('Daniel');
nameBinding.focus({ preventScroll: true });
nameBinding.flush();
nameBinding.reset();
nameDirective.errors();
nameDirective.focus();
// @ts-expect-error native form behavior is provided by FormNode
import { FormRoot } from '../../src/public-api';

// @ts-expect-error native form behavior is provided by FormNode
import { FormRootDirective } from '../../src/public-api';

// @ts-expect-error internal implementation helpers are not public
import { appendMetadataContributions, createNodeDefinitionFactory, createReactiveWatch, markAsAsyncValidator } from '../../src/public-api';

provideFormNodeConfig({
  classes: {
    invalid: (binding: FormNodeBinding) => binding.node().$api.invalid(),
  },
});

void [FormRoot, FormRootDirective, markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions];
