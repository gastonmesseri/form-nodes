---
title: form-node-errors
---

import CodeBlock from '@theme/CodeBlock';
import errorsSource from '!!raw-loader!../../examples/form-node-errors.typecheck.ts';
import templateSource from '!!raw-loader!../../examples/error-message-template.typecheck.ts';
import customErrorsSource from '!!raw-loader!../../examples/custom-control-errors.typecheck.ts';

# form-node-errors

Import `FormNodeErrors` to display validation messages below a native input or inside a custom
control. By default it shows **one message**, after the control is touched **or its nearest form
has recorded a submission attempt**. Its height animates from zero to the measured message height
and back to zero when the messages disappear.

## Beside a native input {#native-input}

Bind the input with `[formNode]` and place `<form-node-errors>` immediately below it, passing the
same field through `[node]`. Import both `FormNodeDirective` and `FormNodeErrors` in the component.
Keep the error component mounted: it decides when to display messages and animates its height.

<CodeBlock language="ts" title="contact-form.component.ts">{errorsSource}</CodeBlock>

Try this sequence:

1. Leave the email empty and move focus away: **Enter your email address.** appears.
2. Enter `not-an-email`: the message changes to **Enter a valid email address.**
3. Enter `ada@example.com`: the message disappears. **Continue** displays the submitted email.
4. **Hide errors** resets interaction and submission history while retaining the current field
   value. **Start over** also restores the initial empty value. Neither button clears the
   application's separate `submittedEmail` signal.

Pressing **Continue** on an untouched, empty form also reveals the required error. Keep the
submit button enabled if you want this interaction: the form prevents `onSubmit` from running
while invalid. Validator messages are reused directly; no message callback is necessary.

Use `[node]` to observe a Form Nodes field, group, array, or form. This input observes the node;
it does not establish another control binding. The component displays only that node's own
errors. A form's descendant errors belong beside their respective controls; this component does
not create an aggregate error summary.

The component does not submit, mark nodes touched, or trigger validation. `reset()` clears
interaction and submission state while preserving values, so the default presentation hides again.
Disabled and hidden sources never display messages, including with `showWhen="always"`.
Readonly sources retain their normal error presentation. Existing errors are not suppressed merely
because another validation is pending.

## Inside custom controls {#custom-control}

Pass the entire `useFormNodeState()` result through `[state]`. This preserves the errors visible
to that specific control binding and supports Form Nodes, Angular Signal Forms, Reactive Forms,
and template-driven forms through the helper's existing adapters. Supply **either `node` or
`state`**. Conflicting sources, missing sources, or unreadable sources render no messages.

This reusable email input owns its internal markup and error display. The parent owns the field
and validators. The custom control calls `useFormNodeState()` once and passes **`state`, without
calling it**, to `[state]`; it does not need a node input of its own.

The comments in this example identify suggested application files:

<CodeBlock language="ts">{customErrorsSource}</CodeBlock>

The primary address is required; the backup address is optional but must be a valid email when
provided. Each instance receives its own `inputId`, so labels and error associations stay unique.
The backup instance also demonstrates opting out of the height animation through a wrapper input.

The important connections are:

- `value = model()` handles the value binding; `edit()` forwards native input changes to it.
- `state = useFormNodeState()` observes validators, interaction, availability, and the owning form.
- Blur calls `state.markAsTouched()` so leaving an invalid input can reveal its message.
- `<form-node-errors [state]="state">` renders those errors and applies touch-or-submit visibility.
- The parent binds `[formNode]` to the custom control; the internal native input uses the model
  and state already provided by that control.

The same `[state]` pattern works inside an existing CVA. Keep its existing `writeValue`, change,
and touch callbacks, and add the helper and message component to its template. This example uses
the signal-model control contract rather than implementing a CVA.

The input inside the custom control links to the message container through `aria-describedby`.
Use a unique, stable ID per control. The error container has `aria-live="polite"` and
`aria-atomic="true"`; it renders messages as text, including when the text contains HTML syntax.
It never takes focus or registers itself as an editable control.

`state.form` contains the same facade as [`useClosestFormState()`](./use-closest-form-state.md).
For example, `state.formSubmitted()` (equivalent to `state.form.submitted()`) observes attempted submission and
`state.form.formNode()` exposes the owning Form Nodes form's callable API when available.
The standalone helper remains available for consumers that only need form state.

## Adjust the display {#adjust-display}

In the native-input example, replace the error component with this fragment to show up to two
messages, wait for a submission attempt, and disable animation:

```html
<form-node-errors
  id="contact-email-errors"
  [node]="contact.email"
  [maxMessages]="2"
  showWhen="submit"
  [animate]="false"
/>
```

`maxMessages` is a limit: fewer messages appear when fewer errors exist. Inside a custom control,
apply these same options to the component that receives `[state]="state"`. The reusable example
above forwards its `animateErrors` input to `[animate]`, letting each caller choose.

## Inputs

| Input | Accepted value | Default |
| --- | --- | --- |
| `node` | A Form Nodes node, `null`, or `undefined` | No source |
| `state` | `ControlState`, `null`, or `undefined` | No source |
| `showWhen` | `'touched-or-submit'`, `'touched'`, `'dirty'`, `'submit'`, `'always'`, or a boolean | `'touched-or-submit'` |
| `maxMessages` | Nonnegative integer or `Infinity` | `1` |
| `animate` | Boolean | `true` |
| `message` | `(error: ControlStateError) => string \| null \| undefined` | Existing error message |
| `fallbackMessage` | String | `'Invalid value.'` |

Visibility modes refer to the selected source. `'submit'` checks its nearest form's recorded
submission attempt, including invalid attempts; `'touched-or-submit'` accepts either condition.
A boolean supplies your own visibility condition. For a node, form ownership follows its model
parentage, including rebinding and reparenting. For a control state, `state.form` follows the
helper's injector-based lookup and Angular form fallback. A field created after submission can
therefore display an error without first becoming touched.

Angular Signal Forms does not expose persistent submission history through this facade;
its submit operation marks fields touched, which supports the default policy. Angular Reactive
Forms and `ngForm` submission history is observed from the owning form directive, so their
controls do not need to become touched for the default policy to display errors.

Messages retain source order. `maxMessages="0"` is **not** a numeric binding: use
`[maxMessages]="0"` to hide all messages or `[maxMessages]="2"` to show up to two.
Use a component property containing `Infinity` to display all messages. Negative, fractional,
and `NaN` limits, as well as nonnumeric values, hide messages without throwing.

## Safe configuration defaults {#safe-defaults}

The component tolerates incorrect runtime configuration and does not throw configuration errors.
Correcting an input resumes normal rendering reactively, without changing the node's values,
validation, or interaction state.

| Incorrect configuration | Behavior |
| --- | --- |
| Both `node` and `state`, a non-node `node`, or an unreadable source | Display nothing |
| Negative, fractional, `NaN`, or nonnumeric `maxMessages` | Display nothing |
| Unknown `showWhen` | Use `'touched-or-submit'` |
| Non-boolean `animate` | Use the enabled default; only `false` disables animation |
| Non-function `message`, a thrown callback, or a non-string callback result | Use the error's message or the fallback |
| Non-string `fallbackMessage` | Use `'Invalid value.'` |
| Malformed error collection or entries | Ignore an invalid collection; skip entries without a string `kind` |

An intentional `null` callback result still suppresses that error. The public TypeScript types
continue to describe supported inputs; the fallbacks protect runtime bindings and JavaScript callers.

## Message resolution

Built-in Form Nodes validators already supply messages, including configured translations.
The component reuses them. Angular validators or custom validators may supply only a `kind`;
these use `fallbackMessage` unless your `message` callback provides text.

The callback reads reactively. Return a string to override the message, `undefined` to use
`error.message` or the fallback, or `null` to suppress that error. A failing callback or unsupported return value uses the existing
message/fallback. Empty or whitespace-only
messages are skipped **before** applying `maxMessages`.

For example, a callback can map Angular's `required` kind to your application's translation:

```ts
message = (error: ControlStateError) => {
  return error.kind === 'required' ? 'Please fill in this field.' : undefined;
};
```

Bind it with `[message]="message"`. A field's existing configured message continues to apply
for every error the callback leaves undefined.

## Custom message template {#custom-template}

Place an `<ng-template #message>` **inside** `form-node-errors`. The component finds it
automatically; importing `FormNodeErrors` is sufficient.

The template renders **once for the entire visible message list**. `let-message` receives the
first resolved message through `$implicit`, and `let-messages="messages"` receives the visible
messages as a string array. Choose any name for the local variable; the template reference itself
must be `#message`.

<CodeBlock language="ts" title="styled-contact-form.component.ts">{templateSource}</CodeBlock>

The email example adds an icon to the first message. The username example renders either one
message or a list, with a rose color override. Enter a short username containing a digit, such as
`a1`, to see both the minimum-length and pattern errors after blur or submission.

`maxMessages` still defaults to **1**, including for custom templates. Set `[maxMessages]="2"`
to supply up to two visible messages to `messages`. Filtering and limiting happen before the
context is created, so `$implicit` always matches `messages[0]`.

| Template local | Context property | Meaning |
| --- | --- | --- |
| `let-message` | `$implicit` | First visible resolved message |
| `let-first="message"` | `message` | Named alias of the first visible message |
| `let-messages="messages"` | `messages` | Visible resolved message strings, in order |
| `let-errors="errors"` | `errors` | Corresponding error details, in the same order |

The context contract is [`FormNodeErrorsContext`](./types/form-node-errors-context.md). Resolution
can customize the displayed strings without overwriting each error's original metadata. Templates
receive the same context with `[node]` and `[state]`; the [custom-control example](#custom-control)
places its own `#message` template below the internal input using `[state]="state"`.

No template is instantiated when there are no visible messages. Without `#message`, the component
uses its default text layout. Conditional templates are supported: adding, replacing, or removing
one updates the layout reactively. If several matching templates exist, the first is used. A
`#message` reference on a normal element is ignored. The component does not render unrelated
projected markup.

Template classes belong to the component that declares them. Height animation measures the
complete rendered content, including lists, icons, padding, and wrapped text. The persistent live
region remains on `FormNodeErrors`; avoid adding another live region inside your template.
Angular interpolation renders message strings as text.

## Height animation and styling

Animation is enabled by default. Disable it with `[animate]="false"`. Entry, exit, message
replacement, line wrapping, and message-count changes transition to the measured content height
in 160 milliseconds. An interrupted transition starts from its current visual height. After a
transition, normal layout controls height again; no fixed error height is required.

The `animate` input controls animation; the component does not apply media-query preferences
automatically. Bind your own application preference to `[animate]` when needed. Disabling
animation cancels any active transition immediately. Content resizing is
observed when `ResizeObserver` is available; render-time measurement remains available otherwise.
Browsers without Web Animations display messages immediately. Server rendering emits the text
without requiring any browser animation APIs.

The default text color is **`#dc2626`**, a warm red. Errors use **`0.875rem`** text (14 px with a
16 px root size) and a unitless **`1.5`** line height so wrapped messages stay readable below the
control. Font family and weight inherit. The size follows the root font size instead of shrinking
again inside a smaller-text container. Both the default layout and projected `#message` content
inherit these styles unless their own markup overrides them.

| CSS custom property | Default |
| --- | --- |
| `--form-node-errors-color` | `#dc2626` |
| `--form-node-errors-font-size` | `0.875rem` |
| `--form-node-errors-line-height` | `1.5` |

Override these properties per instance or through an ancestor:

```css
/* Application theme: inherited by every error component in this form. */
.checkout-form {
  --form-node-errors-color: #be123c;
  --form-node-errors-font-size: 1rem;
  --form-node-errors-line-height: 1.5;
}

/* Per-instance class: also controls text and currentColor icons in custom templates. */
.my-errors { --form-node-errors-color: #b91c1c; }
```

Set `--form-node-errors-color: inherit` to use the surrounding text color instead. This applies
to both the built-in renderer and custom templates unless their own markup overrides color. Put
spacing or padding inside your chosen surrounding field layout; host padding and margins remain
present even when the error content has zero height. Keep the component mounted so it can animate
when messages appear and disappear instead of wrapping it in a conditional that removes it.

The typography default is a design choice, not a universal accessibility size requirement.
[Bootstrap's feedback typography](https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss)
uses `0.875em`, while [Carbon's form errors](https://carbondesignsystem.com/components/form/style/)
use 12 px / `0.75rem`. Form Nodes chooses `0.875rem` to provide a compact default with more room
for reading. Consumers can use their own typography tokens through the properties above.

[WCAG Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) requires text to
remain usable when enlarged to 200%; the message container grows with its content.
Normal-size text needs [at least 4.5:1 contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
against its actual background. Check your theme's colors and custom template layout together.
