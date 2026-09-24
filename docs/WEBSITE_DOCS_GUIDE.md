# Website documentation authoring guide

Read this guide before adding or changing consumer documentation in `website/docs/`, canonical examples in `website/examples/`, or tools that format or generate website documentation. Keep [AGENTS.md](../AGENTS.md) pointing here and record newly agreed website authoring preferences in this guide.

Follow [AGENTS.md](../AGENTS.md) for project conventions and required checks. The [JSDoc authoring guide](JSDOC_GUIDE.md) governs source comments and IntelliSense examples; shared example conventions also apply here, but its hover-specific import reconstruction and 45-character limit do not apply to website examples. See [website maintenance](website.md) for deployment, preview, and domain configuration, and [Publishing a release](releasing.md) for npm releases.

## Language, accuracy, and scope

Use English throughout prose, identifiers, comments, messages, and examples. Use the public package name `@ngblocks/form-nodes` and supported entry points, including `@ngblocks/form-nodes/router` where relevant. Do not import internal implementation paths.

Describe observable behavior rather than restating API names. Explain relevant defaults, omission, accepted input forms, units, index bases, nullability, ownership, asynchronous timing, cleanup, and propagation. Verify claims against public types, implementation, tests, and [documented behavior](behavior.md). Follow the Angular source inspection requirements in AGENTS.md when evaluating or changing behavior; documentation work must not invent new semantics.

Update the website in the same change whenever a public API, overload, inferred type, configuration, integration, behavior, or recommended usage changes. Source JSDoc, type tests, internal behavior notes, and changelog entries do not replace consumer guides. Keep consumer-visible implementation changes consistent between the root and website changelogs; documentation-only corrections do not need release-note entries.

Treat the owner's concrete examples as part of the authoring specification: wording, section order, labels, and layout communicate preferences as well as prose rules. Preserve meaningful examples and distinctions when maintaining guides. Keep new preferences here rather than leaving them only in conversation history.

## Example context and simplicity

Prefer realistic `form({ ... })` examples containing the fields, arrays, and features being taught. Standalone nodes remain useful for signatures or isolated behavior, but show form context frequently and periodically show how the model fits into an Angular component.

Use explicit `form()`, `field()`, and `array()` primitives. Keep leaf-value shorthands, such as a bare `'Mark'`, in their dedicated documentation sections. Use ordinary objects for structural groups, such as `address: { city: field('Zurich') }`. Use `group()` when the branch needs validators, options, validator messages, or the example specifically teaches that primitive.

Introduce `array()` with a simple form-object template before primitive field templates. Introduce `initialLength` with a form-object template so readers can see the defaults used for each item. Prefer `initialLength` when teaching an initial item count and `options.initialValue` when teaching initial data. Keep initial data and related options such as `trackBy` together; show positional initial values and compatibility forms when explaining their signatures.

Show configuration inside the actual factory call rather than in a disconnected options object. A typed options object or preset is appropriate when reusable configuration is the subject. Declare demonstrated properties directly; use spreads when composition or overriding a named preset is the concept being taught.

Include the setup needed to understand and compile each complete example independently. Keep only the setup, callbacks, settings, and operations relevant to the concept. Do not introduce counters, heterogeneous node kinds, helper predicates, or complex utility types merely to demonstrate an everyday operation such as `find()` or `filter()`.

Omit unnecessary bindings and explicit generics when inference communicates the contract. Keep generics where required, such as `field<Date>(null)`, or when inference itself is the subject. Do not add `any`, assertions, or type-error suppressions to make an example compile. An explicit configuration type or `satisfies` can be useful when it demonstrates the intended contract or preserved inference.

For validators with reactive constraints, show separate examples for a static constraint, a reactive constraint, and a static constraint with a custom message. For other validators, normally separate default usage from custom-message usage. Do not combine unrelated options into one crowded example.

## Node access and naming

Read node values by calling the node directly, such as `profile.name()` or `profile()`. Keep `node.value()` and `node.$api.value()` in the dedicated alternative-value-access documentation. This convention does not apply to validator-context `value()` signals or unrelated Angular signals.

Access node state and operations directly: `profile.patch()`, `profile.valid()`, and `profile.submit()`. Demonstrate `.$api` where child-name collisions or generic infrastructure justify it. `.$api` is the API facade; `api` can be an ordinary child name. Show `value.committed` and `value.control` when their different value views are relevant.

Access children through their model path, such as `profile.name.debouncing()`. Keep a separate node binding when retaining a dynamic or detached node, comparing identity, or teaching a generic helper; do not introduce aliases merely to shorten a readable path.

For the `index()` sections of the field, form, and group reference pages, render the same canonical `field-indexed-sibling.example.ts`. Its validator uses the field's current index to find a typed sibling in a known array, applies to array template clones, and verifies that the rule follows a moved row. Explain on the form and group pages that their nodes share the same index behavior even though the example reads a field's index. State that `index()` can return `null` outside an array or after detachment, and that an index identifies a position, not its containing array.

Name a component's single form member `form`, as in `form = form({ username: field('') })`. Use `this.form.username` in component code and `[formNode]="form.username"` in the template. Use descriptive names such as `loginForm` and `profileForm` for multiple forms or when the distinction matters. Standalone variables should retain meaningful names such as `profile`; `const form = form(...)` would shadow the factory.

Do not mark ordinary `form()`, `field()`, or `array()` component properties as `readonly`. Keep the modifier only where it communicates a relevant contract outside those declarations.

## Angular components and templates

When an example binds `[formNode]`, prefer showing the model and HTML together in an Angular `@Component` with an inline `template`. Keep a separate HTML fragment when the surrounding model is already unambiguous or combining a large template and model would reduce readability. Bind through `[formNode]`; do not recreate the removed `$field` adapter.

Use modern Angular APIs, including signal inputs, outputs, models, and queries where applicable. Declare host bindings and listeners in component or directive `host` metadata. Show the proper injection context for hooks that require it. Keep model-only examples usable outside Angular injection context where the API supports that usage. Compile Angular templates as well as their surrounding TypeScript.

### Template attribute layout

Prefer one line for a simple tag when the complete line fits within the website's **120-character maximum**, including indentation. This is a maximum, not a requirement to compact every tag: use multiple lines when separating the attributes makes the example easier to read, especially when several configuration options are the subject being taught. Preserve intentional multiline layouts that help readers inspect those options. Source JSDoc examples use the same readability principle with their **45-character maximum**, excluding the JSDoc prefix.

Whenever a tag uses multiple lines, whether for width or readability, put the tag name on its own line, then every template reference, static attribute, directive, property binding, and event binding on a separate line indented two spaces. Put the closing `>` or `/>` on its own line aligned with the opening `<`. Do not leave some attributes beside the tag name or combine only some of them on continuation lines. Preserve attribute order, binding expressions, and whether the element is self-closing.

Apply this rule to native elements and custom components, both in inline Angular templates and standalone HTML code blocks. Keep multiline template content after the opening backtick, with the closing backtick on its own line. Count any surrounding code on the same line when deciding whether the example fits.

This HTML fragment fits on one line:

```html
<input type="email" [formNode]="form.email" />
```

This configuration example is easier to scan with one option per line, even though it fits within 120 characters when compacted:

```html
<form-node-errors
  [node]="form.email"
  [maxMessages]="2"
  showWhen="submit"
  [animate]="false"
/>
```

The following fragment sits four spaces into a component template. Its compact line would be 124 characters including that indentation, so every attribute goes on its own line:

```html
    <input
      #text
      [value]="value()"
      [disabled]="disabled()"
      (input)="onInput(text.value)"
      (blur)="ngControl.markAsTouched()"
    >
```

### Template event handler names

Name component methods used as template event handlers with `on` followed by a descriptive PascalCase name. For example, use `(formNodeChange)="onTimeseriesCodeChange($index)"` and name the corresponding method `onTimeseriesCodeChange(index: number)`. The same convention applies to native events, such as `(click)="onAddTimeseries()"`.

Keep names consistent between the template and component. Direct calls to public node operations, such as `(click)="form.name.focus()"`, retain their API names.

## Imports and code layout

Include imports explicitly in complete website examples. Use named Angular imports and unqualified names, such as `Component` and `@Component`, rather than namespace imports.

Keep consecutive imports together without blank lines. Put package imports, including Angular and Form Nodes, before local relative or absolute-path imports. Sort imports by ascending length of the complete line within those categories. Keep each import on one line, and do not combine imports across comments identifying different hypothetical files. This is the documentation-example exception to the source-code import grouping rule.

Use two-space indentation, single quotes, semicolons, and trailing commas. Website example lines have a 120-character maximum, including indentation; source JSDoc examples have a 45-character maximum after removing the JSDoc prefix. Wrap without changing semantics, dropping required setup, or introducing unnecessary wrappers.

Format multiline object-template calls as `array({ ... }, { ... })` and multiline form declarations as `form({ ... }, { ... })`. Open the definition object directly after the factory name, put a following options object after `}, {`, and indent properties one level. Do not add call-level indentation merely because both objects span lines. Break the opening call only when its name, type arguments, or preceding arguments require it.

Put multiline object properties and closing braces on their own lines. Arrays containing object literals put the opening bracket, each item, and closing bracket on separate lines, even for one item; individual short objects may remain compact. Scalar arrays may remain inline. Separate consecutive variants with one blank code line, but keep setup, mutation, and observation together when they form one sequence.

Break fluent chains before `.method()` when needed. Use a block body with an explicit `return` when an arrow's implicit return spans lines, except direct object and array literals as allowed by AGENTS.md. Keep short predicates compact and validation messages concise. Preserve null handling, optional chaining, meaningful parentheses, assertions, generics, and callback semantics. Omit inferable `: void` implementation return annotations and separate class members with a blank line.

## Observable results

When demonstrating a value read, show the deterministic result immediately afterward, usually in a short right-side comment such as `profile.name(); // 'Ada'`. For long results, put an `// Expected output:` comment and the result below the expression. Do not repeat the same output both inline and below, or annotate calls shown only for their side effects or as application logic.

For `console.log(expression)`, describe the printed argument rather than the call's return value. Prefer a relevant scalar or mapped list to a large instance dump. Show state transitions or snapshot independence when those explain the feature. If output depends on external context or timing, use `// Output: explanation` and explain the dependency.

Verify observable claims with meaningful assertions in executable examples. Compilation alone does not validate output comments or nested callback behavior.

## Canonical examples and page structure

Put complete examples with observable runtime behavior in `website/examples/*.example.ts`, with meaningful assertions for the executable documentation harness. Put complete Angular or public-inference examples that cannot run meaningfully in plain Node in `website/examples/*.typecheck.ts`.

Render canonical examples directly from those files instead of duplicating their source in Markdown. Keep partial signatures, short alternatives, HTML fragments, and deliberately invalid examples inline when standalone programs would reduce clarity.

When a code block represents several application files, identify each logical file section with a comment such as `// main.ts` or `// app.component.ts`. Keep each file's code together, including configuration and bootstrap calls in `main.ts`, and explain that comments identify suggested files. For a single-file block, use its filename as the block title without a redundant filename comment. Do not invent filenames for pure signatures or isolated expressions.

End each progressive tutorial step with a concise `Related guides and reference` section linking to relevant concepts, detailed guides, API references, and recipes. Keep links contextual rather than repeating the entire sidebar. Maintain stable anchors, cross-page links, inherited contracts, and sidebar entries together.

## Generated references and synchronization

Author JSDoc in source. Do not patch generated reference pages instead of their source or generator. The [public-type reference generator](../website/scripts/sync-public-type-reference.mjs) produces declarations and member summaries in `website/docs/reference/types/`; it does not publish every complete hover example automatically. Maintain detailed guides separately where readers need more explanation.

Preserve public overloads, generics, readonly contracts, and source and published declaration hovers. A narrow hover supplements the complete website guide. Keep examples synchronized with the APIs they describe.

For README blocks linked to canonical examples by an `<!-- example: ... -->` marker, edit the canonical file and run `node website/scripts/sync-readme-examples.mjs --write` before checking documentation.

## Review and verification

Review each affected example for sufficient setup, supported inputs, focused scope, accurate outputs, and correct imports. Check links, argument boundaries, spacing between variants, nullability, defaults, and relevant execution or injection context. Do not weaken contracts or add suppressions to pass checks. Formatting tools must preserve semantics and the editorial conventions above.

When source documentation changes generated summaries, run `npm --workspace website run types:sync` first. For website, configuration, or dependency changes, run `npm run docs:typecheck` and then `npm run docs:build` sequentially: type checking can read build artifacts while a concurrent build replaces them. Preview the production build with `npm --workspace website run serve` as described in [website maintenance](website.md).

Follow all change-specific checks in AGENTS.md. Confirm intended tests were discovered and executed; report environmental failures and unverified scope explicitly. Editorial guide-only changes that do not affect consumer examples, configuration, or generated output do not require a website build.

Keep this guide current as preferences evolve. Do not edit `TODO.md` as a side effect of maintaining documentation rules or examples.
