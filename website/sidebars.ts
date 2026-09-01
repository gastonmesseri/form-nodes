import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  consumerDocs: [
    'index',
    {
      type: 'category',
      label: 'Getting started',
      items: ['getting-started/installation', 'getting-started/first-form'],
    },
    {
      type: 'category',
      label: 'Core concepts',
      items: [
        'concepts/form-nodes',
        'concepts/creating-nodes',
        'concepts/values-and-state',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/validation',
        'guides/async-validation',
        'guides/dynamic-arrays',
        'guides/control-binding',
        'guides/custom-controls',
        'guides/submission',
        'guides/validator-messages',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/built-in-validators',
        'reference/node-api',
      ],
    },
  ],
};

export default sidebars;
