---
title: Coding agents
description: Give coding agents guidance matched to the installed Form Nodes package.
---

# Coding agents {#coding-agents}

The npm package includes `AGENTS.md`: a Markdown guide for agents writing applications with
Form Nodes. It covers model declarations, bindings, array replacement, validation, reset,
notifications, and how to verify work in the consuming application.

[`AGENTS.md`](https://agents.md/) is a convention for agent instructions, not a TypeScript file
or a runtime library feature. Agent discovery and supported instruction files vary by tool;
do not assume that installing a dependency makes its instructions active.

## Connect the guide to your application {#connect-the-guide}

After installing a package version that includes the guide, add the following to your application's
existing `AGENTS.md`, or to the project instruction file supported by your agent:

```markdown title="AGENTS.md"
When working with @ngblocks/form-nodes, read
node_modules/@ngblocks/form-nodes/AGENTS.md before making changes.
```

Keep your application's other instructions. Adjust the path if dependencies are hoisted elsewhere
in a monorepo or your package manager uses another layout. The guide is a file to read, not a
JavaScript module to import. No installation script modifies your application's instructions.

You can also ask the agent directly to read that file for a single task. Verify that the agent
has read it using your tool's available context or file-read indicators.

## Keep guidance matched to the version {#installed-version}

The packaged guide is shipped alongside `package.json`, `README.md`, `CHANGELOG.md`, and the
public declarations in `types/ngblocks-form-nodes.d.ts`. It directs agents to inspect those files
before using unfamiliar APIs. The website can describe a newer API than your installed version.

The guide's [maintained source](https://github.com/gastonmesseri/form-nodes/blob/master/docs/consumer/AGENTS.md)
is available for inspection. If an older installed version has no guide, use its README and
declarations; compare any guidance copied from the website with that version's API.

The repository-root `AGENTS.md` is for contributing to Form Nodes itself. The packaged guide is
for consumers and does not impose library-maintainer workflows on their applications.

## Related guides and reference {#related-guides-and-reference}

- [Your first form](./first-form.md)
- [API overview](../reference/api-overview.md)
- [Compatibility](../project/compatibility.md)
