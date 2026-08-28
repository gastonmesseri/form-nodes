import type { Config } from '@docusaurus/types';
import type { Options, ThemeConfig } from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Gem Forms',
  tagline: 'Typed, signal-based forms for Angular',
  favicon: 'img/favicon.svg',
  url: process.env.DOCS_URL ?? 'https://gastonmesseri.github.io',
  baseUrl: process.env.DOCS_BASE_URL ?? '/ng-forms/',
  organizationName: 'gastonmesseri',
  projectName: 'ng-forms',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  trailingSlash: false,
  presets: [
    [
      'classic',
      {
        blog: false,
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Gem Forms',
      hideOnScroll: true,
      logo: {
        alt: 'Gem Forms',
        src: 'img/favicon.svg',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'consumerDocs', position: 'left', label: 'Docs' },
        { to: '/guides/validation', position: 'left', label: 'Guides' },
        { to: '/reference/node-api', position: 'left', label: 'API' },
        { href: 'https://github.com/gastonmesseri/ng-forms', position: 'right', label: 'GitHub' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting started', to: '/getting-started/installation' },
            { label: 'Core concepts', to: '/concepts/form-nodes' },
            { label: 'Guides', to: '/guides/validation' },
            { label: 'API reference', to: '/reference/node-api' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/gastonmesseri/ng-forms' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@gem/ng-forms' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Gem Forms contributors.`,
    },
    prism: {
      additionalLanguages: ['bash'],
    },
  } satisfies ThemeConfig,
};

export default config;
