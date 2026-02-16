import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from 'src/shared-kernel/utils/constants/transactions';

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, type: Number, default: null })
  platformFee?: number;

  @Prop({ required: true, type: String, unique: true })
  transactionId: string;

  @Prop({
    required: true,
    type: String,
    default: PAYMENT_STATUS.PENDING,
  })
  paymentStatus: PAYMENT_STATUS;

  @Prop({ required: true, type: String, default: PAYMENT_METHOD.STRIPE })
  paymentMethod: PAYMENT_METHOD;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Asset' })
  assetId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  sellerId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  buyerId: mongoose.Types.ObjectId;

  @Prop({ type: Number, default: null })
  refundAmount?: number;

  @Prop({ type: String, default: null })
  refundReason?: string;

  @Prop({ type: Date, default: null })
  refundedAt?: Date;

  @Prop({ required: true, type: Number, default: null })
  commissionPercentage?: number;
}

export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentSchema = SchemaFactory.createForClass(Payment);
