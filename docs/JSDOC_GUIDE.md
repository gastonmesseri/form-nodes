# JSDoc authoring guide

Read this guide before adding or changing public JSDoc, hover examples, or the tools that format and publish them. It consolidates the project's JSDoc rules and the owner's reviewed preferences. Maintain those preferences here and keep [AGENTS.md](../AGENTS.md) pointing here.

Use English. Document the current supported API, with `@tsblocks/xlsx` as the package name. Read [CODE_STYLE.md](CODE_STYLE.md) for general source layout and [LIBRARY_USAGE.md](../LIBRARY_USAGE.md) for supported declarative inputs. Do not infer a new capability from a desired example: verify the public types and behavior first.

## What each declaration must explain

Write the documentation directly on the public declaration in its domain's `.type.ts` file. Cover every public configuration field, nested field, inline method option, instance property, method and overload, including returned component handles. Keep large contracts in focused type files and preserve public exports.

Describe the behavior rather than repeating the member's name. Include the information relevant to the particular member:

- What it changes or returns, including return values and side effects.
- Defaults, omission, `undefined`, inheritance and precedence for configuration fields.
- Units, coordinate bases, accepted selectors and sizing rules.
- Ownership, live state versus snapshots, mutability and asynchronous readiness.
- Safe recovery, diagnostics, strict-policy behavior and actual limitations.

Do not paste the entire API's behavior into every comment. Give each option or member its own focused example and reference section; grouped examples cannot replace individual documentation. Describe each overload's own input form and retain consistent shared documentation where the overloads expose the same contract.

## Section order and spacing

Use this order, omitting sections that do not apply:

1. A concrete description.
2. **Default:** for an optional configuration field.
3. **Accepted values:** for literal alternatives or mixed input forms.
4. **Type details:** with useful links and a concise type preview.
5. One or more complete fenced `ts` examples.
6. Relevant callable `@param` tags, after the examples.

Put one blank JSDoc line (` *`) between these sections and between separate examples. Keep related list items together. Use ordinary Markdown fences, never `@example` tags. Explain results in prose or checked output comments rather than adding redundant tags to properties.

The full-comment examples below use outer `text` fences to display the literal JSDoc, including its inner `ts` fence. Standalone hover illustrations also use `text` to preserve the 45-column layout instead of applying the wider website layout. Actual source JSDoc must use `ts` fences.

### Write examples as Markdown, not JSDoc tags

Never introduce an example with `@example`, whether followed by plain code or a fenced block. Write the example directly in the JSDoc description as an ordinary Markdown code block: open with three backticks followed by `ts`, then close with three backticks. Prefix every line with the normal JSDoc ` *`. Place examples after the explanatory sections and before any `@param` tags, separated by a blank JSDoc line.

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

For multiple examples, use separate fenced `ts` blocks with a blank JSDoc line between them and a short explanatory sentence when useful. Do not add an `@example` tag to any variant. Generators and formatters must preserve this Markdown structure.

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

Defaults must be specific and truthful. Explain whether omission inherits a surrounding value, derives a value from content, disables a feature or leaves behavior to Excel. Include inherited, derived and reader-controlled defaults in optional configuration references. Do not invent a default for a required argument or a getter such as `target`.

## Contextual examples

Show the option inside the actual public factory call where consumers configure it. For the `series` option of `chart({ ... })`, use `chart({ type: ..., series: ... })`, not a standalone typed configuration variable. Sharing the same underlying type does not make a disconnected object an equally useful example. Prefer this complete call:

```text
chart({
  type: 'column',
  series: [
    { values: [10, 20] },
  ],
});
```

Do not replace this factory-option example with `const chartOptions: ChartOptions = { series: ... }`, even if an equivalent typed declaration compiles. The reader should see where to put the option and how to call the API, without having to infer the surrounding usage. Apply this rule to nested options too: retain the minimal enclosing factory/object structure that makes their location clear.

Typed object declarations are appropriate when the documented subject is the reusable contract, preset or configuration object itself. For a method, show its receiver and invocation; for an inspected property, show how to obtain the instance and what the property contains.

Keep required discriminants and minimal data. Omit unrelated settings, callbacks, helpers and follow-up operations. A URL target example does not need a tooltip or display text. A chartsheet-name example does not need an unused chart. Keep comprehensive report examples in the website guides.

Prefer supported plain value/configuration objects over optional helper calls. For example, use `format: { numberFormat: '#,##0.00' }` where supported instead of `format: format(...)`. Keep component factories such as `kpiCard()` and `chart()` as functions. Use a value helper when its returned instance is itself the documented subject, or when no supported plain declaration exists. Never describe a resolved instance type as a supported object input without an implemented normalization contract.

### Declare properties directly instead of spreading inline objects

Write the demonstrated property directly in its containing configuration object. Do not wrap a static property or group of properties in an inline object spread: `...{ height: '32px' }` adds indirection without explaining any behavior. Apply this rule to generated examples too; generators must place the fields directly in their contextual wrapper.

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

Use a spread only when composition itself helps explain the example, such as reusing a named preset or demonstrating an override. Keep its purpose clear and preserve property order and override semantics. Do not introduce spreads to bypass excess-property checks or hide an unsupported configuration; verify the public input contract instead.

## Imports, bindings and generics

Omit ordinary unaliased imports from `@tsblocks/xlsx` in hover examples. Shared documentation discovery restores the required public imports for strict compilation and complete website examples. This is not permission to leave local variables undefined or to stop testing examples.

Retain explicit imports for aliases, subpaths and external dependencies: their source is meaningful. Wrap these imports when needed to fit the hover width. Use only the real package name and supported `/node`, `/browser` and `/themes/*` subpaths.

Omit bindings unless the name or subsequent use helps explain the subject. Do not create unused setup. Prefer direct component calls over unused `const component = ...` declarations.

Omit explicit generic arguments when the supported API can infer or otherwise accept the illustrated input and the generic adds no explanatory value. Keep them when required for correctness or when generic typing is the subject. Do not replace them with `any`, assertions or type-error suppressions, and do not mechanically remove them from source implementations or type tests.

For example, a row-count demonstration should omit `recordWriter<{ amount: number }>`: the explicit row type adds no useful information about `rowCount`. Prefer this compact setup when the entire continuation line fits within 45 characters:

```text
const writer = worksheet()
  .recordWriter('A1', [{ key: 'amount' }])!;
writer.write({ amount: 42 });
console.log(writer.rowCount); // => 1
```

For reusable configuration declarations, prefer explicit annotations to `satisfies` unless preserving specific inference is necessary; follow the exceptions in [CODE_STYLE.md](CODE_STYLE.md#explicit-type-annotations). Do not add a type annotation or generic merely to make an already clear example look more technical.

## The 45-character layout

Every code or comment line inside a JSDoc example must fit within **45 visible characters**, excluding the JSDoc `*` prefix. Count the entire line, including indentation and any inline output comment. The limit applies to examples, not to the source signature or a generated type-detail preview. Keep description prose concise and readable too.

The 45-character limit is a hard maximum, not an approximate target. A 46-character example line must be rewritten or wrapped before handoff. Remove only the JSDoc comment prefix when measuring; keep code indentation in the count. Check every line, including imports, nested properties, URLs, explanatory comments and expected outputs. Shorten incidental names or example data when helpful, without changing the behavior being demonstrated. Never truncate meaningful values or remove required setup just to fit.

Use two spaces, single quotes, semicolons and trailing commas. Indent structurally from the enclosing block, never by aligning beneath the first argument or property after a long function name.

An object can stay on one line only when the complete line fits. Otherwise:

- End the opening line at `{`.
- Put every property, spread or callback on its own line.
- Indent the contents by two spaces and put the closing brace on its own line.
- Apply the same rule recursively to nested objects.

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

Use explicit blocks and returns for multiline arrow-function bodies, except direct object or array literals. Preserve callback semantics and evaluation order; do not convert a method needing dynamic `this` into an arrow just to change its appearance. Follow the lifecycle callback and ordering rules in [CODE_STYLE.md](CODE_STYLE.md#configuration-callbacks-and-ordering).

Separate repeated standalone calls with a blank line. Keep each variant's introductory comment directly above that variant, with the blank line before the comment. Output comments belong to the preceding call.

## Fluent chains

Keep the binding and initial call together when they fit. Break a fluent chain before `.method()` with two spaces of continuation indentation. Do not expand a short initial argument list merely because a chained call follows.

Preferred:

```text
const sheet = workbook()
  .addChartsheet('Chart');
console.log(sheet.name); // => 'Chart'
```

Avoid a bare `const sheet =` followed by `workbook().addChartsheet(...)` on the next line. Likewise, prefer a complete `chartValue('column')!` followed by `.addSeries(...)` to placing `'column'` on its own line solely to accommodate the chain.

Apply this to variable initializers, standalone chains and chains nested in objects. Break arguments only when the call itself needs more space. Preserve parentheses around awaited expressions, optional chaining, non-null assertions, generic arguments, strings and comments. Formatting must not alter the expression's meaning.

## Show observable results

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

In this `target` example, `url('https://example.com')` is all the setup needed. Do not add `{ text: 'Open report', tooltip: 'Report details' }`: those options explain different properties and distract from the destination being inspected. Include an option only if it is required or helps demonstrate the documented member's behavior. The second URL above illustrates prefix normalization, so its different input is relevant.

The output comment states the exact inspected value. Keep the `// =>` notation used by the example checker, rather than an unmarked value comment. There is no **Default:** block for `readonly target`: it exposes the destination supplied to the factory, not an optional configuration setting. For an optional setting with a real default, describe that default after the behavior and before the example, as shown in the complete optional-property example above.

Use `// => value` inline whenever the complete call and comment fit within 45 characters; do not leave it on a separate line merely because it was originally written there. Otherwise put it immediately below the call. Do not duplicate the same output both inline and below. The comment describes the printed argument, not the return value of `console.log` (which is `undefined`).

The current output checker supports deterministic scalar and array literals, including `undefined`, `false`, zero and empty text. Verify values against the implementation or execution; never invent them. The package check executes these examples and compares their actual output with the comment.

For variable byte counts, consumer assets or callbacks that require external context, use `// Output: explanation`, with units and the dependency or timing. For example, a streaming sink can explain that each `chunk.length` is a byte count that varies per write. Do not use this exception to avoid verifying a reproducible result.

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

## Accepted values and type details

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

Use the actual public type name and its current structure. Preserve intersections, optional fields, readonly modifiers and literal alternatives. Reference large nested contracts by name instead of recursively expanding them. Do not add type details merely to repeat an already obvious scalar signature. Keep previews synchronized through `npm run docs:types` and `npm run docs:sync` when contracts change.

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

## Methods, coordinates and environments

Method examples need enough setup to call the actual method. Explain the return value, ownership, coordinate units, recovery and async constraints where relevant. Do not hide differences between overloads behind one generic example.

For position methods, demonstrate every supported form: A1, tuple, numeric object, column-letter object and the separate row/column overload. Column selectors need both letters and numeric indexes. Share setup and use distinct targets:

```text
const sheet = worksheet();
sheet.write('A1', 42);

sheet.write([1, 0], 42);

sheet.write({ row: 2, column: 0 }, 42);

sheet.write({ row: 3, column: 'A' }, 42);

sheet.write(4, 0, 42);
```

Check the actual method's coordinate base and supported forms. Area-capable and content-sized components must retain their documented placement and sizing distinctions.

Make the environment clear. End complete consumer-facing browser report examples with `await report.download('descriptive-name.xlsx')`, or `worksheet.download()` for one sheet. Use `generate()` for byte processing, worker internals or that method's own reference. Use `saveWorkbook()` for Node filesystem output. A focused option example does not need an unrelated export/download operation.

## Source and website synchronization

Follow [WEBSITE_DOCS_GUIDE.md](WEBSITE_DOCS_GUIDE.md) for the complete Docusaurus authoring, navigation, generation and validation workflow. The rules below summarize the JSDoc-to-website boundary.

Author JSDoc in source. Do not patch generated pages instead of fixing their source or generator. Preserve source hovers and packed ESM/CommonJS descriptions, overloads, generics and readonly contracts.

Generated website examples are complete modules with imports and a 100-character width. The documented option occupies its own line even if a compact object would fit. Calculate highlighted lines after formatting. Each documented option, property and method needs its own signature, description and example; optional configuration fields also need an explicit **Default:** block.

Link factory and instance sections to accepted nested/shared contracts. Keep stable anchors, inherited fields, cross-page links and sidebar entries synchronized. Factory, basic-component and utility pages must include their recursively referenced options locally through the shared discovery mechanism (`option_types`); use `option_priority` and `option_visible` for relevant contracts. Shared references supplement rather than replace those local sections.

Use the existing website conventions, including monochrome ▦ reference groups and conditional-format sections organized by discriminator with meaningful titles. Do not introduce pre-v1 migration sections. These integration rules do not turn a narrow hover into a complete website guide.

## Review and verification

Before handing off JSDoc changes, check that the example demonstrates its own subject, omits irrelevant setup, uses only supported inputs and explains its observable result. Verify defaults, units, accepted literals and links against the actual contract. Check all nested object/array lines, call-chain breaks and output-comment widths.

Use the existing tooling; do not bypass strict checks or weaken a contract to make an example compile:

| Command | Purpose |
| --- | --- |
| `npm run docs:format:examples` | Format authored examples, including 45-column hovers. |
| `npm run docs:types` | Refresh visible type details and references when accepted types change. |
| `npm run docs:sync` | Regenerate website references from the authored contracts. |
| `npm run test:jsdoc` | Check layout, literal meanings, output annotations and strict compilation. |
| `npm run test:docs:types` | Check type-reference freshness and examples. |
| `npm run test:docs:options` | Check nested/local references, anchors, links and examples. |
| `npm run test:docs:members` | Check instance-member references and examples. |
| `npm run test:docs:reference` | Compile complete website reference examples. |
| `npm run test:package` | Verify packed hovers and execute deterministic output examples, among other package checks. |

Run type-detail generation before website synchronization when types change. Complete the broader checks required by [AGENTS.md](../AGENTS.md) for code changes, and report exact environmental failures. Do not run competing example checks in parallel when they share `artifacts/jsdoc-snippets`.

The full source audit in `scripts/docs/lib/source-documentation.mjs` visits every attached JSDoc in `src/`, including internal engine and platform comments, and compiles every distinct example through `test:jsdoc`. Its per-file/comment inventory is written to `artifacts/jsdoc-snippets/source-audit.json`. Public reference and packed-hover discovery remain separate checks.

The shared formatting code is in `scripts/docs/lib/example-formatting.mjs` and `example-chains.mjs`; import reconstruction is in `example-imports.mjs`; output discovery is in `console-examples.mjs`. If formatting or generation recreates a rejected layout, fix the responsible tool and preserve the existing semantic/formatting regression checks. Do not manually simplify generics, remove parentheses or change behavior as part of automatic formatting.

Keep this guide current when a new JSDoc preference is agreed. Do not edit `TODO.md` as a side effect of maintaining the guide or examples.
