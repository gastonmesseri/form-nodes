import '@angular/compiler';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Options, ThemeConfig } from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Form Nodes',
  tagline: 'Typed, signal-based forms for Angular',
  favicon: 'img/form-nodes-favicon.png',
  url: process.env.DOCS_URL ?? 'https://gastonmesseri.github.io',
  baseUrl: process.env.DOCS_BASE_URL ?? '/form-nodes/',
  organizationName: 'gastonmesseri',
  projectName: 'form-nodes',
  clientModules: ['./src/clientModules/fast-anchor-scroll.ts'],
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
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        docsRouteBasePath: '/',
        explicitSearchResultPath: true,
        hashed: 'filename',
        highlightSearchTermsOnTargetPage: true,
        indexBlog: false,
        indexDocs: true,
        indexPages: false,
        language: 'en',
        searchBarPosition: 'right',
      },
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      hideOnScroll: true,
      logo: {
        alt: 'Form Nodes documentation',
        src: 'img/form-nodes-logo-header.png',
        width: 170,
        height: 40,
        className: 'docs-header-logo',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'consumerDocs', position: 'left', label: 'Docs' },
        { to: '/tutorial', position: 'left', label: 'Tutorial' },
        { to: '/guides/choosing-a-primitive', position: 'left', label: 'Guides' },
        { to: '/reference/api-overview', position: 'left', label: 'API' },
        { href: 'https://github.com/gastonmesseri/form-nodes', position: 'right', label: 'GitHub' },
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
            { label: 'Compatibility', to: '/project/compatibility' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/gastonmesseri/form-nodes' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@ngblocks/form-nodes' },
            { label: 'Changelog', to: '/project/changelog' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Form Nodes contributors.`,
    },
    prism: {
      additionalLanguages: ['bash'],
      darkTheme: prismThemes.oneDark,
      theme: prismThemes.oneDark,
    },
  } satisfies ThemeConfig,
};

export default config;
