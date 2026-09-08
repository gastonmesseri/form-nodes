import { field, form } from '@ngblocks/form-nodes';

type IborCode = 'DAILY' | 'MONTHLY' | null;

const pricingForm = form({
  iborCode: field<IborCode>('DAILY'),
});

pricingForm.iborCode(); // 'DAILY'
if (pricingForm.iborCode() !== 'DAILY') throw new Error('The initial code should be DAILY.');

pricingForm.iborCode.set('MONTHLY');
pricingForm.iborCode(); // 'MONTHLY'
if (pricingForm.iborCode() !== 'MONTHLY') throw new Error('The code should accept MONTHLY.');

pricingForm.iborCode.set(null);
if (pricingForm.iborCode() !== null) throw new Error('The code should accept null.');
