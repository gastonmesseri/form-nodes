---
title: 7. Submit the form
---

# 7. Submit the form

Add a submission action to the root form options:

```ts
myForm = form({
  // Account, profile, address, and contacts branches from previous steps...
}, {
  debounce: 200,
  validatorMessages: {
    required: 'Complete this value.',
  },
  submission: {
    action: async (_form, value) => {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(value),
      });

      if (!response.ok) throw new Error('Could not save the profile.');
    },
    onInvalid: formNode => {
      formNode.focus();
    },
  },
});
```

The `value` argument is inferred from the complete form tree, including nested addresses and contact items.

## Bind the native form

Import `FormRootDirective` alongside `FormNode`:

```ts
@Component({
  selector: 'app-profile-editor',
  imports: [FormNode, FormRootDirective],
  templateUrl: './profile-editor.html',
})
export class ProfileEditor {
  // Signals and myForm declaration...
}
```

```html
<form [formNode]="myForm">
  <!-- Controls from previous steps... -->

  <button type="reset">Reset interaction state</button>
  <button type="submit" [disabled]="myForm.submitting()">
    {{ myForm.submitting() ? 'Saving…' : 'Save profile' }}
  </button>
</form>
```

Submission:

1. Marks the form subtree touched.
2. Commits pending control values.
3. Runs `onInvalid` instead of the action when errors block submission.
4. Sets `submitting()` while the asynchronous action runs.
5. Prevents overlapping actions.

Native reset delegates to the form tree. It clears touched and dirty state, cancels pending control work, and preserves current committed values.

## Where to go next

You now have a typed form that scales from local fields to nested and repeated data without changing its core access pattern.

- Read the complete [submission guide](../guides/submission.md) for policies, invalid callbacks,
  native events, reset behavior, and concurrent submissions.
- Review [errors and status](../guides/errors-and-status.md) when building submission summaries.
- Study the larger [complete form example](../examples/complex-form.md).
- Browse every [built-in validator](../reference/built-in-validators.md).
- Learn the exact [value and debounce flow](../guides/value-flow-and-debounce.md).
- Configure application-wide [validator messages](../guides/validator-messages.md).
