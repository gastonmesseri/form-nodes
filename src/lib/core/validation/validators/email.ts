import { isEmpty } from './is-empty';
import type { Validator } from '../validation.type';

const emailPattern = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Requires a non-empty string to use Angular's standard email address format. */
export const email: Validator<string | null> = ({ value }) => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  return emailPattern.test(currentValue!) ? null : { email: true };
};
