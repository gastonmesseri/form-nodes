import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  consumerDocs: [
    'index',
    'playground',
    {
      type: 'category',
      label: 'Getting started',
      items: ['getting-started/installation', 'getting-started/first-form'],
    },
    {
      type: 'category',
      label: 'Tutorial',
      link: { type: 'doc', id: 'tutorial/index' },
      items: [
        'tutorial/model',
        'tutorial/bind-controls',
        'tutorial/validation',
        'tutorial/nesting-and-state',
        'tutorial/dynamic-arrays',
        'tutorial/async-validation',
        'tutorial/submission',
      ],
    },
    {
      type: 'category',
      label: 'Core concepts',
      items: [
        'concepts/form-nodes',
        'concepts/creating-nodes',
        'concepts/tree-and-api',
        'concepts/values-and-state',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/choosing-a-primitive',
        'guides/form-modeling-patterns',
        'guides/validation',
        'guides/errors-and-status',
        'guides/async-validation',
        'guides/value-flow-and-debounce',
        'guides/interaction-and-availability',
        'guides/dynamic-object-children',
        'guides/dynamic-arrays',
        'guides/control-binding',
        'guides/custom-controls',
        'guides/submission',
        'guides/validator-messages',
        'guides/testing',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api-overview',
        'reference/configuration',
        'reference/form',
        'reference/field',
        'reference/array',
        'reference/group',
        'reference/built-in-validators',
        'reference/custom-validators',
        'reference/async-validator',
        'reference/form-node-binding',
        'reference/control-state',
        'reference/node-api',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: ['advanced/behavior-details'],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: ['integrations/angular-material', 'integrations/primeng'],
    },
    {
      type: 'category',
      label: 'Help',
      items: ['help/common-mistakes', 'help/troubleshooting'],
    },
    {
      type: 'category',
      label: 'Project',
      items: [
        'project/versioning',
        'project/compatibility',
        'project/changelog',
        'project/migrations',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: ['examples/executable-examples', 'examples/complex-form'],
    },
    {
      type: 'category',
      label: 'Cookbook',
      link: { type: 'doc', id: 'cookbook/index' },
      items: [
        'cookbook/password-confirmation',
        'cookbook/conditional-fields',
        'cookbook/edit-server-data',
        'cookbook/reorderable-arrays',
        'cookbook/remote-validation',
        'cookbook/multi-step-form',
        'cookbook/localized-messages',
        'cookbook/custom-rating-control',
      ],
    },
  ],
};

export default sidebars;
