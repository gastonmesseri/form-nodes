import { field, type ValidationErrorForKind, type ValidationErrorWithTargetNode, type ValidationErrorWithOptionalTargetNode, type ValidationErrorWithoutTargetNode, type ValidatorError } from '../../src/public-api';

const name = field('Alex');
const minimum: ValidationErrorForKind<'min'> = { kind: 'min', min: 2, actual: 1 };
const targeted: ValidationErrorWithTargetNode<typeof name> = { kind: 'custom', targetNode: name };
const optional: ValidationErrorWithOptionalTargetNode<typeof name> = { kind: 'custom' };
const untargeted: ValidationErrorWithoutTargetNode = { kind: 'custom' };
const validatorError: ValidatorError<typeof name> = { kind: 'custom', targetNode: name };
const inferred: ValidatorError = { kind: 'custom' };
void [minimum, targeted, optional, untargeted, validatorError, inferred];

// @ts-expect-error Published targeted errors require their owner.
const missingTarget: ValidationErrorWithTargetNode<typeof name> = { kind: 'custom' };
// @ts-expect-error Untargeted errors cannot specify an owner.
const unexpectedTarget: ValidationErrorWithoutTargetNode = { kind: 'custom', targetNode: name };
// @ts-expect-error Validator targets must be nodes.
const invalidTarget: ValidatorError = { kind: 'custom', targetNode: 'name' };
// @ts-expect-error Validator errors cannot claim a rendered binding.
const invalidBinding: ValidatorError = { kind: 'custom', formNode: {} };
// @ts-expect-error Published error owners are readonly.
targeted.targetNode = name;
void [missingTarget, unexpectedTarget, invalidTarget, invalidBinding];
