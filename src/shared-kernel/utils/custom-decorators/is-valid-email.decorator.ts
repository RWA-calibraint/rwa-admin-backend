import { registerDecorator, ValidationOptions } from 'class-validator';

import { ValidateEmail } from 'src/shared-kernel/utils/custom-validators/email.validator';

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateEmail,
    });
  };
}
