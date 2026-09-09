import { field, form, min, type ValidationError } from '@ngblocks/form-nodes';

declare module '@ngblocks/form-nodes' {
  interface ValidationErrorMap {
    profileReservedName: ValidationError & {
      readonly kind: 'profileReservedName';
      readonly suggestion: string;
    };
  }
}

const profile = form({
  age: field(16, [min(18)]),
  name: field('admin', [({ value }) => {
    return value() === 'admin'
      ? { kind: 'profileReservedName', suggestion: 'Choose a personal name.' }
      : null;
  }]),
});

const minimum = profile.age.getError('min');
minimum?.min; // 18
minimum?.actual; // 16
if (minimum?.min !== 18 || minimum.actual !== 16) throw new Error('Built-in lookup must expose structured data.');

const reserved = profile.name.getError('profileReservedName');
reserved?.suggestion; // 'Choose a personal name.'
if (reserved?.suggestion !== 'Choose a personal name.') throw new Error('Registered custom data must remain available.');
if (reserved.targetNode !== profile.name) throw new Error('The pipeline must assign the error to its owning node.');
if (!profile.allErrors().some(error => error.targetNode === profile.name)) throw new Error('Aggregate errors must preserve ownership.');

profile.name.set('Ada');
if (profile.name.getError('profileReservedName') !== undefined) throw new Error('Correcting the value must remove the error.');
