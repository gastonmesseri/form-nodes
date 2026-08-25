import { provideFormNodeConfig, type FormNodeBinding } from '../src/public-api';

// @ts-expect-error internal implementation helpers are not public
import { appendMetadataContributions, createNodeDefinitionFactory, createReactiveWatch, markAsAsyncValidator } from '../src/public-api';

provideFormNodeConfig({
  classes: {
    invalid: (binding: FormNodeBinding) => binding.node().$api.invalid(),
  },
});

void [markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions];
