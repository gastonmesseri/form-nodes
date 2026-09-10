---
title: FormNodesModule
---

import CodeBlock from '@theme/CodeBlock';
import ModuleExample from '!!raw-loader!../../examples/form-nodes-module.typecheck.ts';

# FormNodesModule {#form-nodes-module}

`FormNodesModule` is an Angular `NgModule` that imports and re-exports the library's template
features. Currently it exports [`FormNodeDirective`](./form-node-binding.md), which supplies
the [`[formNode]`](./form-node-binding.md) binding. Import the module from `@ngblocks/form-nodes` in a standalone component
or an application's `NgModule`.

<CodeBlock language="ts" title="form-nodes-module.typecheck.ts">{ModuleExample}</CodeBlock>

The module is a single import point for the library's Angular template features. You can also
continue importing `FormNodeDirective` directly when you want to list individual dependencies.
The module does not configure providers or change form behavior. Use
[`provideFormNodesConfig()`](./provide-form-nodes-config.md) for configuration.

[`field()`](./field.md), [`form()`](./form.md), [`group()`](./group.md), [`array()`](./array.md), validators, and node types remain ordinary TypeScript
imports from the package. They do not belong in Angular component or module `imports` arrays.
