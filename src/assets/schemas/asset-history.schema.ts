import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

import { ActionStatus, AssetStatus } from 'src/@typings/enums';

export type AssetHistoryDocument = AssetHistory & Document;

@Schema({ timestamps: true })
export class AssetHistory {
  @Prop({ required: true })
  assetId: string;

  @Prop({ default: AssetStatus.NEWLY_ADDED })
  status: AssetStatus;

  @Prop({ default: null })
  verificationDate: Date;

  @Prop({ default: null })
  remarks: string;

  @Prop()
  deletedAt?: Date;

  @Prop()
  tokensCount?: number;

  @Prop()
  price?: number;

  @Prop()
  transactionUrl: string;

  @Prop({ default: ActionStatus.MINT })
  actionStatus: ActionStatus;
}

export const AssetHistorySchema = SchemaFactory.createForClass(AssetHistory);
