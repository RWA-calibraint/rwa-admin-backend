import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class CryptoTransactions {
  @Prop({
    required: true,
  })
  assetId: mongoose.Types.ObjectId;

  @Prop({ default: null })
  transactionUrl: string[];

  @Prop({ default: null })
  ContractListingId: string;

  @Prop({ default: null })
  listingTransactionUrl: string;

  @Prop({ default: null })
  tokenAssetId: string;
}

export type CryptoTransactionsDocument = HydratedDocument<CryptoTransactions>;

export const CryptoListingSchema =
  SchemaFactory.createForClass(CryptoTransactions);
