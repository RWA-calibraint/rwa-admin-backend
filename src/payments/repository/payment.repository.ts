import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Payment, PaymentDocument } from 'src/payments/schemas/payment.schema';

export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(paymentDetails: Payment): Promise<Payment> {
    return new this.paymentModel(paymentDetails).save();
  }

  async findByCheckoutSessionIdAndUpdate(
    checkoutSessionId: string,
    paymentDetails: Partial<Payment>,
  ): Promise<Payment> {
    return this.paymentModel.findOneAndUpdate(
      { checkoutSessionId },
      paymentDetails,
      { new: true },
    );
  }

  async findOne(checkoutSessionId: string): Promise<Payment> {
    return this.paymentModel.findOne({ checkoutSessionId });
  }
}
