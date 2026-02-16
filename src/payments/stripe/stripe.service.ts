import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Stripe from 'stripe';

import { ReleasePaymentDo } from 'src/payments/dto/release-payment.dto';
import { RefundDetails } from 'src/payments/stripe/interface/refund-details.interface';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
  }

  async releaseSellerAmount(
    paymentDetails: ReleasePaymentDo,
    amount: number,
    paymentIntentId: string,
  ): Promise<Stripe.Response<Stripe.Transfer>> {
    const { latest_charge: latestCharge, currency } =
      await this.getPaymentIntentDetails(paymentIntentId);

    return this.stripe.transfers.create({
      destination: paymentDetails.sellerStripId,
      currency: currency,
      amount: amount * 100,
      source_transaction: latestCharge as string,
    });
  }

  async refund({
    paymentIntentId,
    refundReason,
  }: RefundDetails): Promise<Stripe.Response<Stripe.Refund>> {
    const paymentIntent = await this.getPaymentIntentDetails(paymentIntentId);

    if (paymentIntent.transfer_group)
      throw new Error(
        ERROR_MESSAGES.RESPONSES.STRIPE.PAYMENT_ALREADY_TRANSFERRED,
      );
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: refundReason as Stripe.RefundCreateParams.Reason,
    });
  }

  async getPaymentIntentDetails(
    paymentIntentId: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
