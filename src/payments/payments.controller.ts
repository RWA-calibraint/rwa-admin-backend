import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentsService } from 'src/payments/payments.service';
import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

import { GetPaymentsDto } from './dto/get-payments.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions list' })
  @ApiResponse({
    status: 200,
    description:
      'List of transaction with transaction , payment status, payment method filters',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request, validation failed.',
  })
  async getAllPayments(@Query() queryParams: GetPaymentsDto) {
    try {
      const [result] = await this.paymentsService.getAllPayments(queryParams);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  //TODO: Need to update this in the future
  // @Patch('release-payment')
  // @ApiOperation({ summary: 'Release a payment for the seller' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Payment has been successfully released to seller',
  //   type: String,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad Request, validation failed.',
  // })
  // @ApiBody({
  //   description: 'Details of the payment to be released',
  //   type: ReleasePaymentDo,
  // })
  // async releasePayment(
  //   @Body() paymentDetails: ReleasePaymentDo,
  // ): Promise<string> {
  //   return this.paymentsService.releaseThePayment(paymentDetails);
  // }

  // @Patch('refund')
  // @ApiOperation({ summary: 'Refund the seller amount' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Refund has been successfully processed.',
  //   type: String,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad Request, validation failed.',
  // })
  // @ApiBody({
  //   description: 'Details of the refund request',
  //   type: RefundDetailsDto,
  // })
  // async refundSellerAmount(
  //   @Body() refundDetails: RefundDetailsDto,
  // ): Promise<string> {
  //   return this.paymentsService.refundBuyerAmount(refundDetails);
  // }
}
