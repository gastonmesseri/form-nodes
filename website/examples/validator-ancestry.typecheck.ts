import { field, form } from 'form-nodes';

const checkout = form({
  payment: form({
    billing: {
      email: field('', [(ctx) => {
        const node = ctx.node();
        const workflow = node.form();
        const tree = node.root();
        const parent = ctx.parent();

        // Common state is available directly on each returned node.
        const interacted = node.dirty() || tree.dirty() || parent?.touched();
        if (!interacted && !workflow?.submitting()) return null;

        return ctx.value() ? null : { kind: 'missingBillingEmail' };
      }]),
    },
  }),
});

// Access through the declared tree retains the exact child types.
checkout.payment.billing.email.form()?.billing.email.set('ada@example.com');
