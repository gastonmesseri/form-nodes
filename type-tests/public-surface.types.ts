// @ts-expect-error internal implementation helpers are not public
import { appendMetadataContributions, createNodeDefinitionFactory, createReactiveWatch, markAsAsyncValidator } from '../src/public-api';

void [markAsAsyncValidator, createReactiveWatch, createNodeDefinitionFactory, appendMetadataContributions];
