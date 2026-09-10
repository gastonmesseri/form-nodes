import { field, form, type AnyNode, type ValidationErrorWithOptionalTargetNode } from '../../src/public-api';

const profile = form({ email: field(''), nested: { name: field('') } }, {
  onSubmit: (value, node) => {
    const email: string | null = value.email;
    const errors = [
      { kind: 'taken', message: email ?? '', targetNode: node.email },
      { kind: 'name', targetNode: node.nested.name },
      { kind: 'global' },
    ] as const;
    return errors;
  },
});

form({}, { onSubmit: async () => ({ kind: 'conflict', targetNode: profile.email }) });
form({}, { onSubmit: () => null });
form({}, { onSubmit: () => Promise.resolve([] as readonly ValidationErrorWithOptionalTargetNode<AnyNode>[]) });
// @ts-expect-error Submission errors require a string kind.
form({}, { onSubmit: () => ({ message: 'Missing kind.' }) });
// @ts-expect-error Targets must be Form Nodes, not arbitrary objects.
form({}, { onSubmit: () => ({ kind: 'invalid', targetNode: {} }) });
// @ts-expect-error Exceptions are thrown or rejected, not returned as submission errors.
form({}, { onSubmit: () => new Error('Network failed.') });
