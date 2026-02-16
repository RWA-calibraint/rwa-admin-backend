import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Token {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Asset' })
  assetId: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true, type: String })
  tokenId: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  buyerId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Payment' })
  transactionId?: mongoose.Types.ObjectId;
}

export type TokenDocument = HydratedDocument<Token>;

export const TokenSchema = SchemaFactory.createForClass(Token);
