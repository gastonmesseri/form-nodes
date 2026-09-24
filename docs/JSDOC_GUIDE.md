# JSDoc authoring guide

Read this guide before adding or changing public JSDoc, hover examples, or the tools that check and publish them. Keep [AGENTS.md](../AGENTS.md) pointing here and maintain agreed JSDoc authoring preferences in this guide. Record website-specific preferences in the [website documentation authoring guide](WEBSITE_DOCS_GUIDE.md).

Use English and the package name `@ngblocks/form-nodes`. Follow [AGENTS.md](../AGENTS.md) for project conventions, [behavior.md](behavior.md) for the documented behavior, and [WEBSITE_DOCS_GUIDE.md](WEBSITE_DOCS_GUIDE.md) for website authoring. Verify public types and implementation before claiming a capability. For behavioral decisions, follow the Angular source inspection requirements in AGENTS.md.

This guide adapts the shared authoring rules to Form Nodes. Consumer examples, commands, package paths, output annotations, and generation details must match this repository. Clearly labeled examples retained from the source project are writing and formatting references, not Form Nodes API recipes.

Treat the owner's concrete examples as part of the authoring specification: their wording, section order, Markdown labels, and layout communicate preferences that prose alone cannot replace. Preserve them when updating this guide. Add project-specific examples alongside them when useful; do not silently remove or summarize an example because it comes from another project or appears redundant.

## What each declaration must explain

Document the public declaration itself: configuration fields, nested options, properties, methods, and individual overloads. Keep contracts in their existing domain files, including `.type.ts` files where applicable. Preserve exports, overloads, generics, readonly contracts, and runtime behavior when editing documentation.

Describe behavior rather than repeating the member's name. Include the details relevant to that member:

- What it changes or returns, including side effects and error behavior.
- Defaults, omission, `undefined`, explicit disabling values, inheritance, and precedence.
- Units, index bases, accepted input forms, and meaningful literal alternatives.
- Ownership, live nodes versus snapshots, mutability, and asynchronous readiness.
- Value views, validation, interaction state, cancellation, and propagation when applicable.
- Injection-context requirements and cleanup for APIs that need Angular integration.

Do not paste the entire API contract into every comment. Give each public option or member its own focused example; a grouped example does not replace individual documentation. Explain each overload's own input form. Keep accurate internal implementation comments concise instead of adding unrelated consumer examples.

## Section order and spacing

Use this order, omitting sections that do not apply:

1. A concrete description.
2. **Return Type:** for a callback whose declared return type does not show its supported results.
3. **Default:** for an optional configuration field.
4. **Accepted values:** for literal alternatives or mixed input forms.
5. **Type details:** with useful links and a concise type preview.
6. One or more complete fenced `ts` examples.
7. Relevant callable tags, including `@param`, after the examples.

Separate sections and examples with one blank JSDoc line (` *`). Keep related list items together. Do not invent defaults for required arguments or inspected properties. Explain whether omission inherits a value, preserves existing configuration, derives a value, or disables a feature.

Mark public parameterized functions that participate in signal dependency tracking with a JSDoc `@reactive` tag. Briefly describe the tracking or memoization semantics after the tag. Do not add the tag to ordinary `Signal` properties, whose type already communicates reactivity. Explain return values in prose or checked output comments rather than adding redundant tags to properties.

### Callback return contracts

When a callback intentionally declares an unchecked return such as `any` to support self-referencing inference, include a separate `**Return Type:**` paragraph in its JSDoc. For availability callbacks (`disabled`, `hidden`, and `readonly`), use `unknown` and explain that JavaScript truthiness determines the state; nonempty disabled strings also supply a reason. Validator conditions still use `boolean`. Preserve the explanation of why the declaration uses `any` and how an explicit return annotation can restrict the result type.

Document the callback result, not merely the permissive TypeScript signature. Include `null`, `undefined`, or `void` only when the callback contract admits them. For validators, link the result contract and explain success, errors, and composition; for asynchronous validators, show the Promise-like or Observable-like wrapper as well as its resolved result. When the JSDoc belongs to a factory such as `requiredIf()`, identify the callback parameter explicitly so its return type cannot be confused with the factory's return type. Apply this to inline options, relevant overloads, and shared public callback types.

### Markdown examples, not `@example`

Write examples directly in the description using ordinary Markdown fences. Never introduce them with `@example`. Place JSDoc examples before all `@param` tags. Content after a `@param` may be rendered as part of that parameter description instead of as function-level documentation.

The outer `text` fences below illustrate literal JSDoc and preserve its narrow layout. Actual source examples use `ts` fences.

```text
/**
 * Creates a field for a person's name.
 *
 * ```ts
 * const name = field('Ada');
 * name(); // 'Ada'
 * ```
 */
```

For multiple blocks, leave one blank JSDoc line between the closing and opening fences. A short introductory sentence may distinguish their purposes.

### Optional configuration fields

Place the option inside the actual factory call. State its default and explain accepted forms before showing the example.

```text
/**
 * Delays control-originated value commits.
 * Programmatic writes commit immediately.
 *
 * **Default:** Inherit the nearest configured
 * strategy; otherwise commit immediately.
 *
 * **Accepted values:**
 *
 * - Numbers: Delay in milliseconds.
 * - `blur`: Commit when marked touched.
 * - Functions: Supply a custom delay.
 *
 * ```ts
 * field('', { debounce: 300 });
 * ```
 */
```

This illustrates the section layout; a full union reference also needs focused examples for its other supported input families. Do not copy defaults or accepted-value lists from a similarly named option without checking its contract.

## Contextual examples

Every fenced block must have the setup needed to understand and compile it independently, apart from reconstructed public imports. For a method, show its receiver and invocation. For an inspected property, show where the instance comes from and what the property contains.

Show configuration inside the factory where consumers use it. For example, document `trackBy` with `array({ ... }, { trackBy: ... })`, rather than a disconnected `const options: ArrayOptions<...>`. Typed objects are appropriate when the reusable options contract or preset is itself the subject.

Prefer showing fields, arrays, and their features as children of a realistic `form({ ... })` in consumer documentation, because that is their most common application context. Keep standalone-node examples when they communicate a signature or isolated behavior more clearly, but use form-context examples frequently throughout each guide. Periodically show the form as a property of an Angular `@Component` so consumers can recognize how declarations fit into application code.

Use explicit fields and ordinary structural groups:

```text
const profile = form({
  name: field('Ada'),
  address: { city: field('Zurich') },
});
profile.address.city(); // 'Zurich'
```

Use explicit leaf and root primitives such as `field('Mark')`, `form({ ... })`, and `array(...)` in website and IntelliSense examples by default. Keep field-value shorthands such as `'Mark'` confined to their dedicated documentation sections unless a later documentation decision deliberately introduces them elsewhere. Prefer the structural object shorthand for ordinary groups, such as `address: { city: field('Zurich') }`; use explicit `group({ ... })` only when that branch needs group validators, options, validator messages, or when the example specifically teaches the `group()` primitive.

When introducing `array()` in consumer documentation, show a simple form-object template before primitive field templates. The dynamic-array guide should also introduce `initialLength` with a form-object template so consumers immediately see how multiple items are created from readable defaults.

Keep required setup and the option being taught; omit unrelated callbacks, settings, and operations. A debounce example does not need submission configuration. Each example must demonstrate its own member, not a similarly named operation on a different primitive.

Read committed node values by calling the node directly in consumer documentation examples, such as `myForm.name()` or `myForm()`. Do not use `node.value()` or `node.$api.value()` as the ordinary example style. Keep those equivalent paths documented together in the dedicated alternative-value-access section for generic infrastructure. This rule does not apply to a validator context's `value()` signal or to unrelated Angular signals such as a custom control's `model()` value.

Access node state and operations directly in consumer documentation examples, including forms: use `myForm.patch()`, `myForm.valid()`, and `myForm.submit()` instead of their `.$api` equivalents. Document and demonstrate `.$api` in the dedicated API-access section, where it solves a child-name collision or provides a uniform surface for generic node infrastructure. `.$api` is the only API facade; `api` is an ordinary child name. Show `value.committed` and `value.control` only when their distinct value views are relevant.

### Keep everyday examples simple

Use the smallest realistic setup that makes the operation clear. Do not introduce counters, heterogeneous node kinds, helper predicates, or `NonNullable`/`ReturnType`/`Extract` combinations merely to demonstrate `filter()` or `find()`. Prefer a direct predicate on a named child. Type-guard overloads may share the simple usage example; explain narrowing in prose instead of constructing an artificial scenario solely to exercise that overload.

In JSDoc examples, use an `array()` template, preferably an object such as `array({ username: field('') })`. Do not use an array factory function. Document factory-specific signatures and requirements in prose and refer to the template overload for everyday usage.

Preferred:

```text
const users = array({
  username: field(''),
}, {
  initialValue: [
    { username: 'Ada' },
    { username: 'Lia' },
  ],
});
const matches = users.filter(user => {
  return user.username() === 'Ada';
});
matches[0]?.username(); // 'Ada'
```

### Access child nodes through their model path

When an example declares a form, access its children directly through that form. Prefer `profile.name.debouncing()` over introducing `const node = profile.name` followed by `node.debouncing()`. The model path keeps the relationship between the form and the field visible and avoids an unnecessary intermediate variable.

```text
const profile = form({
  name: field('Ada'),
});
profile.name.debouncing(); // false
```

Keep a separate node binding only when the binding itself teaches something, such as retaining a dynamically added or detached node, comparing node identities, or demonstrating a generic helper. Do not introduce aliases merely to shorten an already readable model path.

### Angular component context

When a documentation example binds `[formNode]`, prefer showing the associated node model and HTML together in one Angular `@Component` with an inline `template`. This keeps the view and view-model visually adjacent and gives the template HTML highlighting inside the TypeScript example. Keep a separate HTML fragment only when the component model is already unambiguous from the immediately surrounding example or when combining a large template and model would make the example harder to read.

For website examples, name component event handler methods with the `on` prefix, such as `onTimeseriesCodeChange`, following the [website event handler naming convention](WEBSITE_DOCS_GUIDE.md#template-event-handler-names).

Show the necessary injection context for hooks that require it and prefer modern signal-based Angular APIs.

Name a component's single form member `form`: `form = form({ username: field('') })`.
Use `this.form.username` in component code and `[formNode]="form.username"` in its template.
The member name does not shadow the imported `form()` factory. Use descriptive member names
such as `loginForm` and `profileForm` when a component contains multiple forms or the distinction
helps explain the example. Keep meaningful names such as `profile` for standalone variables;
`const form = form(...)` would shadow the factory. Apply this convention consistently in source
JSDoc, website examples, README examples, and their surrounding explanations.

Do not mark `form()`, `field()`, or `array()` properties as `readonly` in consumer-facing Angular component examples. The extra modifier adds visual clutter without teaching the library and conflicts with the documentation's concise style. Keep `readonly` only where it communicates a relevant contract outside ordinary form-node declarations.

### Declare options directly

Write the demonstrated property directly in its containing object. Do not hide it in an inline spread such as `...{ debounce: 300 }`.

```text
field('', {
  debounce: 300,
});
```

Use spreads when composition is the subject, such as reusing a named preset and overriding one setting. Preserve property order and precedence. Do not use spreads to bypass excess-property checks or imply unsupported inputs.

## Imports, bindings, and generics

Omit ordinary unaliased imports from `@ngblocks/form-nodes` and `@ngblocks/form-nodes/router` in source hover examples. [The JSDoc checker](../scripts/test-jsdoc.mjs) reconstructs those imports for compilation. This does not permit undefined local variables. Website examples must include their imports explicitly.

Retain explicit imports for aliases and external dependencies. Use supported package entry-point imports rather than internal paths. Keep import lines within 45 characters and follow the project's single-line import convention.

Use named Angular imports and unqualified API names in examples: `import { Component } from '@angular/core';` with `@Component`, not `import * as ng from '@angular/core';` with `@ng.Component`. Apply the same convention to `Directive`, `signal`, `computed`, `input`, `model`, and other Angular APIs. Do not introduce namespace imports to fit the hover width. Keep imports focused; when a combined named import exceeds 45 characters, split its symbols across separate single-line named imports.

```text
import { Component } from '@angular/core';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="form.name" />
    <button (click)="form.name.focus()">
      Focus name
    </button>
  `,
})
export class ProfilePage {
  form = form({ name: field('Ada') });
}
```

Website examples follow the [website import and layout conventions](WEBSITE_DOCS_GUIDE.md#imports-and-code-layout), including explicit imports and consecutive import lines without blank lines.

Omit a binding when its name or subsequent use adds nothing. Keep useful names when demonstrating state, a return value, or a sequence of operations.

Omit explicit generics when inference already communicates the contract. Retain them when needed, such as `field<Date>(null)`, or when teaching type inference. Do not replace meaningful types with `any`, assertions, or type-error suppressions to make an example fit or compile.

For reusable configuration objects, an explicit type annotation can make the contract clear; use `satisfies` when preserving inference is part of the example. Do not add annotations simply to make an example look more technical.

## The 45-character layout

Every code or comment line inside a source JSDoc example must fit within **45 visible characters**, excluding only the JSDoc prefix. Include code indentation and output comments in the count. This is a hard maximum: a 46-character line must be rewritten or wrapped. The limit does not apply to source signatures or type-detail previews.

For simple HTML tags, prefer one line when the complete line fits. Multiline layouts are also appropriate when they improve readability, such as when the example teaches several configuration options; the width limit does not require compacting those examples. Whenever a tag uses multiple lines, put the tag name, every attribute, and the closing `>` or `/>` on separate lines; indent attributes two spaces and align the closing delimiter with the opening `<`. Do not mix inline attributes with attributes on continuation lines. Website examples follow the [same width and readability rules](WEBSITE_DOCS_GUIDE.md#template-attribute-layout) with a 120-character maximum instead.

Use two-space indentation, single quotes, semicolons, and trailing commas. Indent structurally, not by aligning beneath a preceding argument. Shorten incidental names or wording without changing the behavior demonstrated or deleting required setup.

An object may stay on one line only when the complete line fits. Otherwise:

- End its opening line at `{`.
- Put every property, spread, or callback on its own line.
- Indent contents two spaces and put the closing brace on its own line.
- Apply these rules recursively to nested objects.

Arrays containing object literals place the opening bracket, each item, and closing bracket on separate lines, even for one item. An item may remain a compact object if its complete line fits. Scalar arrays may remain inline.

```text
array({
  name: field(''),
}, {
  initialValue: [
    { name: 'Ada' },
  ],
});
```

### Calls with consecutive object arguments

In consumer documentation examples, format multiline object-array declarations as `array({ ... }, { ... })`, with the template object and options object opened directly in the call and their properties indented one level. Prefer `options.initialValue` in these examples so initial data and options such as `trackBy` remain grouped together; mention positional initial values only when documenting the available signatures.

Format every multiline `form()` example as `form({ ... }, { ... })`: open the definition object on the same line as `form({`, place an options object after `}, {`, and indent both objects consistently. Apply this style to root and explicit nested forms alike.

```text
array({
  name: field(''),
}, {
  debounce: 300,
});
```

Do not add a call-level indentation solely because its objects are multiline:

```text
array(
  {
    name: field(''),
  },
  {
    debounce: 300,
  },
);
```

Break the opening call only when its name, type arguments, or preceding arguments require more space. Multiline object contents alone do not justify expanding the wrapper. Keep properties and closing braces on their own lines; the next argument's opening brace may follow the previous closing brace. Preserve argument order and callback semantics. Formatters must retain these boundaries.

### Separate consecutive example variants

Separate consecutive standalone calls demonstrating different variants with **one empty code line**, even inside the same fenced block. In JSDoc, write that line as ` *`, with no trailing spaces. A multiline call's own line breaks do not separate it from the next variant.

```text
/**
 * ```ts
 * array({
 *   name: field(''),
 * }, {
 *   debounce: 300,
 * });
 *
 * array({
 *   name: field(''),
 * }, {
 *   debounce: 'blur',
 * });
 * ```
 */
```

Keep an introductory comment directly above its variant, with the blank line before the comment. Output comments belong to the preceding call, so put the separator after them. Do not insert separators between every statement in a single sequence of setup, mutation, and observation. Preserve separators in generators and formatters.

## Fluent chains, predicates, and messages

Keep the binding and initial call together when they fit. Break chains before `.method()` with two spaces of continuation indentation. Do not expand a short argument list merely because a later chained call needs more room. Preserve optional chaining, parentheses around awaited expressions, non-null assertions, generics, strings, and comments.

Use a block body with an explicit `return` when an arrow's implicit return spans lines. Direct object and array literals may remain implicit, including parenthesized literals and TypeScript assertions. Do not convert a method that needs dynamic `this` into an arrow. Omit parentheses around a single untyped parameter for a compact single-line predicate; retain required parentheses and follow AGENTS.md for other source formatting.

Prefer short predicates on the same line as `.some()` or a comparable method when they fit. This applies inside a `return` expression too. Shorten incidental validation messages before separating a property name from its string value. Keep multiline object properties on separate lines and retain a readable ternary:

```text
array(field.strict(0), {
  validators: ({ value }) => {
    return value()
      .some(amount => amount < 0)
      ? {
          kind: 'negativeAmount',
          message: 'No negative amounts',
        }
      : null;
  },
});
```

Here `field.strict(0)` makes the numeric input contract explicit. Ordinary `field(0)` also accepts `null`; retain null handling when the declared type requires it. Do not remove a meaningful check just to shorten the example or silently change the field's nullability to make a formatter happy. Simplifying predicates and wording is an authoring decision, not permission for a formatter to rewrite semantics or error identifiers.

Keep validator documentation examples focused on one concept at a time. For validators with reactive constraints, show separate uncluttered examples for a static constraint, a reactive constraint, and a static constraint with a custom message instead of combining reactivity and message options in the same example. For validators without reactive constraints, normally show direct/default use and custom-message use separately.

## Show observable results

Show deterministic results immediately after the expression being inspected; printing is not required. When a consumer documentation snippet demonstrates reading a node value, show the concrete result in a concise right-side comment, such as `myForm.name(); // 'Marco'`. For long results, place an `// Expected output:` comment on the following line instead of making the code line difficult to scan. Do not add output comments to calls shown for their side effects or as part of application logic. The local checker also accepts `// => value`; do not require migration to the source project's notation.

```text
const name = field('Ada');
name(); // 'Ada'

name.set('Lia');
name(); // 'Lia'
```

Keep the output inline when the complete line fits within 45 characters. For a long result, put `// Expected output:` and the result comment below the expression. Never duplicate the output inline and below. Do not add output comments to calls shown only for their side effects or as application logic.

For `console.log(expression)`, the annotation describes the printed argument, not the `undefined` return value of `console.log`. Prefer inspecting a relevant scalar or mapped list over dumping a large instance. Show transitions or snapshot independence when they explain the member.

The local checker executes supported literal output annotations on top-level expressions in examples without class declarations, including direct reads and single-value `console.log` calls. Supported cases include scalar, array, and object literals, `undefined`, `false`, zero, and empty text. It does not execute component examples, nested callback assertions, or explanatory prose. An `Expected output:` heading is explanatory text, so verify that case with an explicit assertion or an executable website example. Never assume a successful compilation verified every output comment.

For values depending on real external context or callback timing, use `// Output: explanation` and state the dependency. Do not use variable-output prose to avoid checking a reproducible result. Keep output assertions in the website's executable examples as required by the Source and website synchronization section.

## Accepted values and type details

The original examples below are intentionally retained to show the owner's preferred wording and Markdown structure. Names such as `chart`, `kpiCard`, `ComponentOptions`, and `workbook` belong to the source project. Use their documentation style when describing actual Form Nodes contracts; their types, units, defaults, and methods are not additions to this library.

Keep supported literal unions visible in the public signature for autocomplete. Preserve exported aliases and link them. Document every string literal with its own meaning under **Accepted values:**, including units and distinctions. Explain mixed input forms too: numbers versus strings, arrays versus a single object, and selectors versus ranges.

For example, the `type` property on a `chart()` configuration should explain the supported chart families individually. Its example must still include a real `chart({ type: ..., ... })` call. Preserve existing Excel-style literal names such as `dataBar`, `dataBarClassic` and `autoMin`.

Use `{@link TypeName}` or links to individual nested fields. Keep the existing **Type details:** presentation: a link plus a useful compact preview, where appropriate. Keep small scalar/literal unions visible at their documented use. Link large object contracts instead of copying a huge shape into a hover. Do not invent a preview that differs from the actual type.

Example of the prose structure for a known literal contract:

```text
/**
 * Placement scope used by this lifecycle.
 *
 * **Accepted values:**
 *
 * - `origin`: The position supplies an origin.
 * - `area`: The position may supply an area.
 *
 * See {@link ComponentPosition} for accepted
 * coordinate forms.
 */
```

This last block illustrates description/list/link structure only; a real public field also needs its actual default, if optional, and a complete contextual `ts` example. Do not copy a default or accepted-value list from a similarly named field without checking its contract.

### Cover input variants without enumerating every combination

For an option accepting a union, demonstrate every supported family and the meaningful structural variants within those families. One example of one branch is not enough to explain the accepted input. These are value variants, not method overloads; document actual overloads separately when present.

Cover distinctions that change behavior, including omission versus an explicit disabling value, optional modifiers and dependencies between fields. Do not enumerate every possible combination of colors, numbers, patterns or nested options. Link nested contracts to their own complete references and examples. Never imply that a plain string or object is accepted without checking the actual public input type.

Keep examples contextual. When the API naturally supports several items, one factory call can demonstrate alternative configurations in separate, clearly labeled items. Otherwise use separate focused factory calls. Shared setup should reduce repetition without hiding where the option belongs; do not invent a helper solely to shorten the documentation.

For example, `chart().series[n].marker.fill` accepts four `DrawingFill` families: `solid`, `pattern`, `gradient` and `none`. The gradient family has both linear and path forms. This single contextual call illustrates all five cases within the 45-character example width:

```text
chart({
  type: 'line',
  series: [
    // Solid color with 20% transparency.
    {
      values: [10, 20, 30],
      marker: {
        type: 'circle',
        fill: {
          type: 'solid',
          color: '#2563EB',
          transparency: 20,
        },
      },
    },
    // Pattern with two explicit colors.
    {
      values: [15, 25, 35],
      marker: {
        type: 'circle',
        fill: {
          type: 'pattern',
          pattern: 'pct50',
          foreground: '#2563EB',
          background: 'white',
        },
      },
    },
    // Linear gradient.
    {
      values: [20, 30, 40],
      marker: {
        type: 'circle',
        fill: {
          type: 'gradient',
          angle: 45,
          stops: [
            { position: 0, color: 'white' },
            {
              position: 100,
              color: '#2563EB',
              transparency: 20,
            },
          ],
        },
      },
    },
    // Path gradient with a centered focus.
    {
      values: [25, 35, 45],
      marker: {
        type: 'circle',
        fill: {
          type: 'gradient',
          path: 'circle',
          focus: 'center',
          stops: [
            { position: 0, color: 'white' },
            {
              position: 100,
              color: '#2563EB',
            },
          ],
        },
      },
    },
    // Explicitly disable the marker fill.
    {
      values: [30, 40, 50],
      marker: {
        type: 'circle',
        fill: { type: 'none' },
      },
    },
  ],
});
```

Accompany this example with the relevant distinctions in the option's prose:

- Omitting `fill` preserves the default behavior; `{ type: 'none' }` explicitly disables the fill.
- A solid fill defaults to zero transparency. Solid fills and individual gradient stops accept transparency from 0 to 100 percent.
- A pattern fill defaults to a white background. Link the supported pattern literals rather than repeating every pattern combination here.
- A linear gradient omits `path` and defaults to an angle of 90 degrees. Gradients require 2–10 stops with positions from 0 to 100 percent.
- A path gradient accepts `circle`, `rect` or `shape`. Its `focus` accepts `center` or `bottomRight` and requires `path`; the default is `center` for `shape`, otherwise `bottomRight`. The angle applies to linear gradients.
- Color fields accept the forms documented by `Color`; link that contract and its examples. The `fill` property itself does not accept a color string directly.

Verify these details against the public types and implementation when updating the example. The goal is complete coverage of meaningful input forms, not an exhaustive Cartesian product of nested settings.

### Linked type details with a structural preview

When a named input type hides useful information about the accepted shape, add a **Type details:** paragraph. Use this exact pattern: `**Type details:** {@link TypeName}: ` followed by an inline-code preview of the type and a final period. The link lets the reader navigate to the contract; the preview shows its structure without requiring navigation. A bare link or an unlinked type expansion does not provide both benefits.

Use the actual public type name and its current structure. Preserve intersections, optional fields, readonly modifiers and literal alternatives. Reference large nested contracts by name instead of recursively expanding them. Do not add type details merely to repeat an already obvious scalar signature. Keep previews synchronized with the actual public contract. In this repository, use the verification and generation commands listed under Review and verification.

For example, the `options` field of `createComponent()` can show the linked contract and its shape together:

```text
/**
 * Placement, ownership and minimum cell
 * footprint. See {@link ComponentOptions}.
 *
 * **Default:** Automatic ID, origin A1 and
 * measured content size.
 *
 * **Type details:** {@link ComponentOptions}: `ComponentBase & { imageDependencies?: readonly ComponentImageSource[]; scope?: 'local' | 'worksheet'; size?: ComponentSize; }`.
 *
 * ```ts
 * createComponent({
 *   render() {},
 *   options: { position: 'B2' },
 * });
 * ```
 */
options?: ComponentOptions;
```

The type preview is prose metadata outside the executable example, so it is not subject to the 45-character code-block limit. Keep the example itself within that limit. Retain the description-first section order and use the actual factory call to demonstrate the option.

### Defaults and accepted-value lists for options

Use the literal Markdown labels `**Default:**` and `**Accepted values:**`, including the colon inside the bold text. Put the default value in backticks and explain inheritance or omission alongside it. After a blank JSDoc line, list each accepted literal separately in backticks, followed by its meaning. Do not merely repeat the union without explaining how its alternatives behave.

Format each accepted-value entry according to what its label represents:

- Use bold for descriptive input-family labels, such as `**Numbers**` and `**Numeric px strings**`.
- Use inline code for exact string literals, such as `default`, `pastel` and `strict`; do not additionally bold them. Preserve their exact spelling and casing.
- Put the separating colon outside the label's bold or code markup, followed by a concrete explanation. Apply the same distinction when one list contains both descriptive families and literal values.

For mixed input forms, state the units for this particular option instead of copying a generic conversion from another field:

```text
/**
 * Floating card width. Must be positive and
 * finite. Requires floating: true; cell cards
 * use size.
 *
 * **Default:** 240 pixels for floating cards.
 *
 * **Accepted values:**
 *
 * - **Numbers**: Width in pixels.
 * - **Numeric px strings**: Width in pixels
 *   at 96 DPI; '280px' equals numeric 280.
 *
 * ```ts
 * kpiCard({ floating: true, width: '280px' });
 * ```
 */
width?: number | `${number}px`;
```

For literal alternatives, retain code formatting. This palette excerpt illustrates the list style; a complete property comment must also include its description, relevant default, type link and contextual example:

```text
 * **Accepted values:**
 *
 * - `default`: Seven categorical colors.
 * - `atelier`: Six muted categorical colors.
 * - `pastel`: Six light pastel colors.
 * - `monochrome`: Six shades of blue.
 * - `vivid`: Six saturated colors.
```

This complete `policy` example preserves the recovery distinctions while following the description-first order and contextual-example rules:

```text
/**
 * Controls recovery from invalid inputs.
 * Inspection queries return undefined for
 * invalid selectors under either policy.
 * Duplicate element IDs are warnings under
 * either policy. Worksheet overrides inherit
 * the remaining workbook safety settings.
 *
 * **Default:** `'safe'`; worksheet overrides
 * inherit the workbook policy.
 *
 * **Accepted values:**
 *
 * - `safe`: Normalize recoverable inputs and
 *   record diagnostics. Skip behavior that
 *   cannot be represented safely.
 * - `strict`: Throw for invalid mutations.
 *   Inspection lookups retain their documented
 *   non-throwing behavior.
 *
 * ```ts
 * workbook({ policy: 'safe' });
 * ```
 */
policy?: 'safe' | 'strict';
```

Use **Accepted values:** for the meanings of literal alternatives; use **Type details:** and type links for accepted type contracts. Explain mixed input forms where relevant. A standalone `const options: SafetyOptions = ...` can illustrate the reusable type itself, but an option's contextual example should show the actual factory call as above.

## Methods and execution environments

Method examples need enough setup to invoke the actual receiver. Explain whether returned nodes are live or detached, whether returned data is exposed or committed, index bases, invalid-input handling, and asynchronous completion when relevant. Preserve meaningful differences between overloads.

Keep model-only examples usable outside Angular injection context where the API supports it. Put injection-dependent hooks in their proper component or directive context. Do not call them from a plain script merely to make an example shorter. Compile Angular templates as well as their surrounding TypeScript.

## Source and website synchronization

Author JSDoc in source. Do not patch generated reference pages instead of their source or generator. Follow the [website documentation authoring guide](WEBSITE_DOCS_GUIDE.md) and AGENTS.md for the consumer website.

[The public-type reference generator](../website/scripts/sync-public-type-reference.mjs) generates declarations and member summaries under `website/docs/reference/types/`. It does not publish every complete hover example automatically. Keep detailed guides and reference pages current when consumers need additional explanation.

The website guide defines [canonical example locations and page structure](WEBSITE_DOCS_GUIDE.md#canonical-examples-and-page-structure), including executable assertions, Angular typechecked examples, file labels, and related-guide links. Follow its [synchronization rules](WEBSITE_DOCS_GUIDE.md#generated-references-and-synchronization) for generated references and README examples.

Keep stable anchors, inherited contracts, cross-page links, and sidebar entries synchronized. Preserve source and published declaration hovers, overloads, generics, and readonly contracts. A narrow hover supplements the complete guide rather than replacing it.

## Review and verification

Review each affected comment individually. Check that it demonstrates its own subject, supplies required setup, omits unrelated configuration, uses supported inputs, and explains the observable result. Verify defaults, units, accepted literals, links, nullability, and propagation claims against the actual contract.

Check every example line, including nested arrays, imports, comments, predicates, and outputs. Review argument boundaries, blank lines between variants, and tag ordering. Do not weaken a contract or add suppressions to make an example pass.

Use commands that exist in this repository:

| Command | Purpose |
| --- | --- |
| `npm run test:jsdoc` | Check fence/tag layout and width, reconstruct public imports, compile TypeScript and Angular templates, and execute supported output annotations. |
| `npm --workspace website run types:sync` | Regenerate public type declarations and member summaries. |
| `npm run docs:typecheck` | Check generated reference freshness, website types, and executable documentation examples. |
| `npm run docs:build` | Build the consumer documentation website. |
| `npm run typecheck` | Run lint, library/type/template checks, and the JSDoc checker. |
| `npm run test:package` | Build and verify the published consumer package and IntelliSense completions. |

Follow the change-specific verification requirements in AGENTS.md, including focused tests and broader checks where required. Run type-reference generation before checking the website when source documentation affects generated summaries. Run `docs:typecheck` and `docs:build` sequentially: website type checking can read build artifacts while a concurrent build replaces them.

The source audit in [scripts/test-jsdoc.mjs](../scripts/test-jsdoc.mjs) inventories JSDoc in library source, including internal comments, excluding test and fixture files. It writes its inventory and diagnostics to `.angular/jsdoc-snippets/`. Do not run concurrent JSDoc checks against that shared directory.

The checker does not enforce every editorial rule: variant spacing, concise wording, semantic completeness, and all argument-layout preferences still need review. There is no dedicated `docs:format:examples` command in this repository. If a formatter or generator is added or changed, preserve these rules with appropriate regression checks; formatting must not simplify generics, change validation logic, or remove meaningful parentheses.

Keep this guide current when a new preference is agreed. Do not edit `TODO.md` as a side effect of maintaining the guide or examples.

## Retained authoring examples from the source project

These examples preserve the owner's original positive and negative illustrations. They supplement the Form Nodes examples above; keep the distinctions between preferred and rejected layouts. APIs from the source project are illustrative only and are not compiled against Form Nodes.

For Form Nodes examples, the local rules still apply: direct model paths, named Angular imports, verified nullability, and the output-comment convention in this guide. In particular, use the `field.strict(0)` example above when illustrating a numeric predicate without null handling. The retained `// =>` comments show the original project's notation, not a requirement to change existing Form Nodes output comments.

### Write examples as Markdown, not JSDoc tags

Preferred:

```text
/**
 * Create a card displaying a percentage.
 *
 * ```ts
 * kpiCard({ value: 0.25, format: '0%' });
 * ```
 */
```

Avoid, even when the code itself is fenced:

```text
/**
 * Create a card displaying a percentage.
 *
 * @example
 * ```ts
 * kpiCard({ value: 0.25, format: '0%' });
 * ```
 */
```

### Complete optional-property example

### Complete optional-property example

```text
/**
 * Number format or style for the card value.
 * The label is unaffected.
 *
 * **Default:** Inherit the surrounding format.
 *
 * **Type details:** {@link KpiCardStyleInput}: `FormatReference | KpiCardStyle | undefined`.
 *
 * ```ts
 * kpiCard({ value: 0.25, format: '0%' });
 *
 * kpiCard({
 *   value: 42,
 *   format: { numberFormat: '#,##0.00' },
 * });
 * ```
 */
format?: string | KpiCardStyleInput;
```

### Contextual examples

Show the option inside the actual public factory call where consumers configure it. For the `series` option of `chart({ ... })`, use `chart({ type: ..., series: ... })`, not a standalone typed configuration variable. Sharing the same underlying type does not make a disconnected object an equally useful example. Prefer this complete call:

```text
chart({
  type: 'column',
  series: [
    { values: [10, 20] },
  ],
});
```

### Declare properties directly instead of spreading inline objects

Preferred:

```text
worksheet({
  rowOptions: [
    {
      applyTo: '1:3',
      height: '32px',
    },
  ],
});
```

Avoid:

```text
worksheet({
  rowOptions: [
    {
      applyTo: '1:3',
      ...{ height: '32px' },
    },
  ],
});
```

### Imports, bindings and generics

For example, a row-count demonstration should omit `recordWriter<{ amount: number }>`: the explicit row type adds no useful information about `rowCount`. Prefer this compact setup when the entire continuation line fits within 45 characters:

```text
const writer = worksheet()
  .recordWriter('A1', [{ key: 'amount' }])!;
writer.write({ amount: 42 });
console.log(writer.rowCount); // => 1
```

### The 45-character layout

By default, arrays containing object literals put the opening bracket, every item and the closing bracket on separate lines, even with one item. An item may remain a compact object when its whole line fits. Scalar arrays may remain inline. Exception: the single-column `recordWriter` setup shown above may stay inline when the whole line fits within 45 characters, keeping a getter example focused. This narrow hover exception does not change website array formatting.

```text
kpiCard({
  value: 42,
  format: {
    numberFormat: '#,##0.00',
    alignment: { vertical: 'bottom' },
  },
});
```

### Calls with consecutive object arguments

Preferred (a validation-API formatting illustration, not an `@tsblocks/xlsx` API):

```text
/**
 * ```ts
 * array({
 *   name: field(''),
 * }, {
 *   debounce: 300,
 * });
 *
 * array({
 *   name: field(''),
 * }, {
 *   debounce: 'blur',
 * });
 *
 * array({
 *   name: field(''),
 * }, {
 *   debounce: async abortSignal => {
 *     await Promise.resolve();
 *     if (abortSignal.aborted) return;
 *   },
 * });
 * ```
 */
```

Avoid this extra wrapping for any of those variants:

```text
/**
 * ```ts
 * array(
 *   {
 *     name: field(''),
 *   },
 *   {
 *     debounce: 300,
 *   },
 * );
 * ```
 */
```

### Separate consecutive example variants

For example, these three validator variants have an empty line between calls (a validation-API formatting illustration, not an `@tsblocks/xlsx` API):

```text
/**
 * ```ts
 * array({
 *   name: field(''),
 * }, {
 *   validators: () => null,
 * });
 *
 * array({
 *   name: field(''),
 * }, {
 *   validators: () => ({ kind: 'blocked' }),
 * });
 *
 * array({
 *   name: field(''),
 * }, {
 *   validators: asyncValidator(async () => {
 *     await Promise.resolve();
 *     return null;
 *   }),
 * });
 * ```
 */
```

### Fluent chains

Preferred:

```text
const sheet = workbook()
  .addChartsheet('Chart');
console.log(sheet.name); // => 'Chart'
```

### Compact predicates and validation messages

Preferred (a formatting illustration from a validation API, not an `@tsblocks/xlsx` API; here `value()` returns numeric items):

```text
/**
 * ```ts
 * array(field(0), {
 *   validators: ({ value }) => {
 *     return value()
 *       .some(amount => amount < 0)
 *       ? {
 *           kind: 'negativeAmount',
 *           message: 'No negative amounts',
 *         }
 *       : null;
 *   },
 * });
 * ```
 */
```

Avoid unnecessarily wrapping the predicate and retaining verbose incidental text:

```text
/**
 * ```ts
 * array(field(0), {
 *   validators: ({ value }) => {
 *     return value().some(
 *       (amount) =>
 *         amount !== null && amount < 0,
 *     )
 *       ? {
 *           kind: 'negativeAmount',
 *           message:
 *             'Amounts cannot be negative.',
 *         }
 *       : null;
 *   },
 * });
 * ```
 */
```

### Show observable results

Original output-notation illustration: the source project uses `// => value` immediately after the call. This example preserves that notation; Form Nodes follows the local output-comment rule above. In either style, keep the comment inline when the complete line fits within 45 characters, otherwise place it immediately below.

```text
const myFunction = () => 'test';
myFunction(); // => 'test'
```

A bare `console.log(value?.target)` does not explain what the reader receives. Show a deterministic output or explain the genuinely variable result. Prefer a relevant property or a mapped list over dumping a large instance.

```text
/**
 * Hyperlink destination, independent of its
 * display text. The internal:/external:
 * prefix is normalized to lowercase.
 *
 * ```ts
 * const value = url('https://example.com');
 * console.log(value?.target);
 * // => 'https://example.com'
 *
 * const cell = url('INTERNAL:Summary!A1');
 * console.log(cell?.target);
 * // => 'internal:Summary!A1'
 * ```
 */
readonly target: string;
```

When useful, demonstrate normalization, missing values, defaults or state changes. A snapshot example should show that the snapshot remains unchanged after editing the live object:

```text
const sheet = worksheet({ rows: [[1]] });
const snapshot = sheet.getCell('A1')
  ?.snapshot();
sheet.write('A1', 2);
console.log(snapshot?.value); // => 1

console.log(sheet.getCell('A1')?.value);
// => 2
```

### Methods, coordinates and environments

For position methods, demonstrate every supported form: A1, tuple, numeric object, column-letter object and the separate row/column overload. Column selectors need both letters and numeric indexes. Share setup and use distinct targets:

```text
const sheet = worksheet();
sheet.write('A1', 42);

sheet.write([1, 0], 42);

sheet.write({ row: 2, column: 0 }, 42);

sheet.write({ row: 3, column: 'A' }, 42);

sheet.write(4, 0, 42);
```
