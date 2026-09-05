import { array, asyncValidator, field, form, group, validator } from '@ngblocks/form-nodes';

const profile = form({
  email: field('', {
    validators: validator((ctx) => {
      const email = ctx.node(); // Field<string | null>; identical to ctx.field()
      return email.touched() && !ctx.value() ? { kind: 'missingEmail' } : null;
    }),
  }),
  address: group({
    city: field(''),
  }, {
    validators: (ctx) => {
      const address = ctx.node(); // Group with a typed city child
      return address.city()?.trim() ? null : { kind: 'missingCity' };
    },
  }),
  contacts: array({
    email: field(''),
  }, {
    validators: asyncValidator({
      params: (ctx) => ctx.node().items().map(contact => contact.email()),
      validate: async ({ params }) => {
        return new Set(params).size === params.length ? null : { kind: 'duplicateContacts' };
      },
    }),
  }),
}, {
  validators: asyncValidator(async (ctx) => {
    const profile = ctx.node(); // Form with typed email, address, and contacts children
    return profile.email() ? null : { kind: 'incompleteProfile' };
  }),
});

void profile;
