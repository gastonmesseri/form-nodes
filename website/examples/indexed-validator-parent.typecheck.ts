import { Component } from '@angular/core';
import { array, field, form, validator } from '@ngblocks/form-nodes';

@Component({ selector: 'app-role-editor', template: '' })
export class RoleEditor {
  pageForm = form({
    roles: array({
      valueType: field(1),
      value: field('', (ctx) => {
        const parent = ctx.parent<(typeof this.pageForm.roles)[number]>();
        return parent?.valueType() === 1 && !ctx.value()
          ? { kind: 'roleValue', message: 'Enter a value for this role.' }
          : null;
      }),
    }, {
      initialValue: 2,
    }),
  });
}

type PageForm = RoleEditor['pageForm'];
export const roleValue = validator<string | null>((ctx) => {
  const parent = ctx.parent<PageForm['roles'][number]>();
  return parent?.valueType() === 1 && !ctx.value()
    ? { kind: 'roleValue', message: 'Enter a value for this role.' }
    : null;
});
