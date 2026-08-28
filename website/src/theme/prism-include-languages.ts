import type * as PrismNamespace from 'prismjs';
import type { Optional } from 'utility-types';

import siteConfig from '@generated/docusaurus.config';

const addAngularInlineTemplate = (Prism: typeof PrismNamespace) => {
  Prism.languages.insertBefore('typescript', 'template-string', {
    'angular-inline-template': {
      pattern: /(\btemplate\s*:\s*)`(?:\\[\s\S]|\$\{[^{}]*\}|[^\\`])*`/,
      lookbehind: true,
      greedy: true,
      alias: ['language-markup'],
      inside: {
        'template-punctuation': {
          pattern: /^`|`$/,
          alias: 'string',
        },
        rest: Prism.languages.markup,
      },
    },
  });
};

export default function prismIncludeLanguages(Prism: typeof PrismNamespace) {
  const {
    themeConfig: { prism },
  } = siteConfig;
  const { additionalLanguages } = prism as { additionalLanguages: string[] };
  const previousPrism = globalThis.Prism;

  globalThis.Prism = Prism;

  additionalLanguages.forEach(language => {
    require(`prismjs/components/prism-${language}`);
  });

  addAngularInlineTemplate(Prism);

  if (typeof previousPrism !== 'undefined') {
    globalThis.Prism = previousPrism;
  } else {
    delete (globalThis as Optional<typeof globalThis, 'Prism'>).Prism;
  }
}
