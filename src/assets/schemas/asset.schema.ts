import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { Document, Model } from 'mongoose';

import { AssetStatus } from 'src/@typings/enums';

export type AssetDocument = Asset & Document;

@Schema({ timestamps: true })
export class Asset {
  @Prop({ unique: true, required: true })
  assetId: string;

  @Prop()
  contractTokenId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  priceInEth?: number;

  @Prop({ type: mongoose.Types.ObjectId, required: true, ref: 'User' })
  sellerId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'AssetCategory',
  })
  category: mongoose.Types.ObjectId;

  @Prop({ type: String, default: null })
  coverImage: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: AssetStatus.GOING_LIVE })
  status: AssetStatus;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({ default: null })
  qrCode: string;

  @Prop({ default: null })
  tag: string;

  @Prop({ default: 1 })
  tokens: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: null })
  verifiedBy: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User' })
  viewedBy: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Admin' })
  updatedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ default: null })
  verificationDate: Date;

  @Prop({ default: null, type: Date })
  listedDate: Date;

  @Prop()
  adminRemarks?: string;

  @Prop()
  rejectionCount?: number;

  @Prop()
  totalViews?: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isAdminAsset?: boolean;

  @Prop({ type: Boolean, default: false })
  sold?: boolean;

  @Prop({ type: Date, default: null })
  soldAt?: Date;

  @Prop({ type: Boolean, default: false })
  isFeaturedAsset?: boolean;

  @Prop()
  arweaveImageUrl: string;

  @Prop([String])
  arweaveDocumentUrls: string[];

  @Prop()
  arweaveMetadataUrl: string;

  @Prop()
  arweaveTransactionUrl: string;

  @Prop()
  transactionUrl: string;

  @Prop()
  ContractListingId: string;

  @Prop()
  listingTransactionUrl: string;

  @Prop()
  tokenAssetId: string;

  @Prop()
  initialSeller: string;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);

AssetSchema.pre<Asset>('validate', async function (next) {
  const assetModel = this.constructor as Model<Asset>;

  if (!this.assetId) {
    let uniqueId: string;
    let exists: boolean;

    do {
      uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
      exists = !!(await assetModel.exists({ assetId: uniqueId }));
    } while (exists);

    this.assetId = uniqueId;
  }
  next();
});
