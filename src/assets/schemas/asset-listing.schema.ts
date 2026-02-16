import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class AssetListing {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
  })
  assetId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  sellerId?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  tokenPrice: number;

  @Prop({ required: true })
  tokens: number;

  @Prop({ default: null })
  deletedAt: Date;
}

export type AssetListingDocument = HydratedDocument<AssetListing>;

export const AssetListingSchema = SchemaFactory.createForClass(AssetListing);
