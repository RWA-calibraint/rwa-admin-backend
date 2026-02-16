import { registerDecorator, ValidationOptions } from 'class-validator';

import { DOCUMENT_TYPE } from '../constants/asset-document';
import { ERROR_MESSAGES } from '../constants/exceptions/error-message';

export function IsValidAssetDocumentKeys(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidAssetKeys',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'object' || value === null) return false;

          return Object.keys(value).every((key) =>
            Object.values(DOCUMENT_TYPE).includes(key as DOCUMENT_TYPE),
          );
        },
        defaultMessage() {
          return ERROR_MESSAGES.ASSET.ASSET_DOCUMENT_TYPE.INVALID;
        },
      },
    });
  };
}
