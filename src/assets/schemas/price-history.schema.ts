import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class PriceHistory {
  @Prop({ type: String, required: true })
  assetId: string;

  @Prop({ type: String, required: true })
  year: string;

  @Prop({ type: String, required: true })
  price: string;
}

export type PriceHistoryDocument = HydratedDocument<PriceHistory>;

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);
