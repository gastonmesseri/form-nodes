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
      items: ['concepts/form-nodes'],
    },
  ],
};

export default sidebars;
