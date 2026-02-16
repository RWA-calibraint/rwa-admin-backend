import {
  isEmail,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { PATTERN_NO_SPECIAL_CHAR_AT_START } from 'src/shared-kernel/utils/constants/decorator-contents';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';

@ValidatorConstraint()
export class ValidateEmail implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isEmail(value) && PATTERN_NO_SPECIAL_CHAR_AT_START.test(value);
  }
  defaultMessage(): string {
    return ERROR_MESSAGES.DTOS.EMAIL.VALID_EMAIL;
  }
}
