import { ApiProperty, ApiTags } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { REFUND_REASON } from 'src/shared-kernel/utils/constants/refund.reason';

@ApiTags('Payments')
export class RefundDetailsDto {
  @ApiProperty({
    description: 'The Checkout session ID associated with the payment',
    example: 'checkout_session_id_67890',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.CHECKOUT_SESSION_ID.REQUIRED })
  checkoutSessionId: string;

  @ApiProperty({
    description: 'Reason for the refund, must be one of the predefined values',
    example: 'requested_by_customer',
    enum: REFUND_REASON,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(REFUND_REASON)
  refundReason: string;
}
