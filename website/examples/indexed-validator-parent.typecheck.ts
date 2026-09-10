import { Component } from '@angular/core';
import { array, field, form, validator } from '@ngblocks/form-nodes';

@Component({ selector: 'app-delivery-editor', template: '' })
export class DeliveryEditor {
  deliveryForm = form({
    packages: array({
      deliveryMethod: field<'home' | 'pickup'>('home'),
      pickupLocation: field('', (ctx) => {
        const row = ctx.parent<(typeof this.deliveryForm.packages)[number]>();
        return row?.deliveryMethod() === 'pickup' && !ctx.value()
          ? { kind: 'pickupLocation', message: 'Choose a pickup location.' }
          : null;
      }),
    }, {
      initialValue: 2,
    }),
  });
}

type DeliveryForm = DeliveryEditor['deliveryForm'];
export const pickupLocationRequired = validator<string | null>((ctx) => {
  const row = ctx.parent<DeliveryForm['packages'][number]>();
  return row?.deliveryMethod() === 'pickup' && !ctx.value()
    ? { kind: 'pickupLocation', message: 'Choose a pickup location.' }
    : null;
});
