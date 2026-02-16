import { DOCUMENT_TYPE } from '../asset-document';

export const ERROR_MESSAGES = {
  DTOS: {
    EMAIL: {
      REQUIRED: 'Email id is required',
      VALID_EMAIL: 'Please provide valid email',
    },
    NAME: {
      FIRST_NAME: {
        REQUIRED: 'First name is required',
        IN_VALID: 'First name was invalid',
      },
      LAST_NAME: {
        REQUIRED: 'Last name is required',
        IN_VALID: 'Last name was invalid',
      },
    },
    SUSPEND_EXPIRY_AT: {
      REQUIRED: 'Date of suspend expired is required',
      INVALID_DATE: 'Please provide valid date',
    },
    PASSWORD: {
      REQUIRED: 'Password is required ',
    },
    VERIFICATION_CODE: {
      REQUIRED: 'Verification is required',
    },
    SELLER_STRIPE_ID: {
      REQUIRED: 'Seller stripe id is required',
    },
    CURRENCY: {
      REQUIRED: 'Currency is required',
    },
    CHECKOUT_SESSION_ID: {
      REQUIRED: 'Checkout session id is required',
    },
    REFUND_REASON: {
      REQUIRED: 'Reason is required',
    },
  },
  RESPONSES: {
    STRIPE: {
      PAYMENT_ALREADY_TRANSFERRED:
        'A payment that has already been transferred to the seller',
      PAYMENT_NOT_COMPLETED: 'The payment has not been completed yet.',
      PAYMENT_NOT_FOUND: 'Payment not found',
      PAYMENT_ALREADY_REFUNDED:
        'A payment that has already been refunded to the user',
    },
    USER: {
      NOT_FOUND: 'User not found',
      DATE_IS_REQUIRED: 'Suspend expiry date is required',
      IN_VALID_DATE: 'Suspension date must be the future date',
    },
    ADMIN_NOT_FOUND: 'Admin not exists',
  },
  ASSET: {
    ASSET_ID: {
      REQUIRED: 'Asset is required',
      IN_VALID: 'Asset id is invalid',
    },
    ASSET_NAME: {
      REQUIRED: 'Name must not be empty or contain only spaces',
    },
    ASSET_DESCRIPTION: {
      REQUIRED: 'Description must not be empty or contain only spaces',
    },
    ASSET_PRICE: {
      REQUIRED: 'Price must not be empty or contain only spaces',
    },
    ASSET_CATEGORY: {
      REQUIRED: 'Category must not be empty or contain only spaces',
    },
    ASSET_DOCUMENT_TYPE: {
      INVALID: `Document keys must be one of the predefined ${Object.values(DOCUMENT_TYPE)} values`,
    },
    CREATE_DOCUMENTS: {
      DOCUMENTS: {
        REQUIRED: 'File must be required',
      },
      DOCUMENT_TYPE: {
        REQUIRED: 'Document type is required',
      },
    },
  },
};
