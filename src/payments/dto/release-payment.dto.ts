import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';

export class ReleasePaymentDo {
  @ApiProperty({
    description: 'The Stripe ID of the seller',
    example: 'seller_stripe_id_12345',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.SELLER_STRIPE_ID.REQUIRED })
  sellerStripId: string;

  @ApiProperty({
    description: 'The Checkout session ID',
    example: 'checkout_session_id_67890',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.CHECKOUT_SESSION_ID.REQUIRED })
  checkoutSessionId: string;
}
