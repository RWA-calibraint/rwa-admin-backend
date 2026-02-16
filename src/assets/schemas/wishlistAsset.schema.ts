import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class WishlistAsset extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export type WishlistAssetDocument = Document & WishlistAsset;
export const WishlistAssetSchema = SchemaFactory.createForClass(WishlistAsset);
