import { field, form, notNil, required, requiredTrue } from '../../src/public-api';

const checkout = form({
  wantsInvoice: field<boolean>(null, [required]),
  acceptedTerms: field(false, [requiredTrue]),
  reference: field<string>(null, [notNil]),
});

checkout.wantsInvoice(); // null
checkout.wantsInvoice.valid(); // false: no answer yet
checkout.wantsInvoice.set(false);
checkout.wantsInvoice(); // false
checkout.wantsInvoice.valid(); // true: "No" is an answer

checkout.acceptedTerms.valid(); // false: acceptance must be true
checkout.acceptedTerms.set(true);
checkout.acceptedTerms.valid(); // true

checkout.reference.set('');
checkout.reference(); // ''
checkout.reference.valid(); // true: notNil permits empty strings
checkout.valid(); // true

if (!checkout.valid() || checkout.wantsInvoice() !== false || checkout.reference() !== '') {
  throw new Error('A negative answer and an empty reference should pass once the terms are accepted.');
}

checkout.resetToInitial();
if (checkout.valid() || !checkout.wantsInvoice.hasError('required')
  || !checkout.acceptedTerms.hasError('requiredTrue') || !checkout.reference.hasError('notNil')) {
  throw new Error('Reset should restore the three distinct validation failures.');
}

checkout.wantsInvoice.required(); // true
checkout.acceptedTerms.required(); // true
checkout.reference.required(); // false: notNil has no HTML required constraint
if (!checkout.wantsInvoice.required() || !checkout.acceptedTerms.required() || checkout.reference.required()) {
  throw new Error('Only presence and acceptance rules should contribute required metadata.');
}
