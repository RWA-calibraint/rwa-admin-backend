import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

import { AssetStatus } from 'src/@typings/enums';

import { AccountStatus } from '../../@typings/enums/user.enum';

export type AnalyticsDocument = Analytics & Document;

@Schema({ timestamps: true })
export class Analytics {
  @Prop({ required: true })
  date: Date;

  @Prop()
  userId?: string;

  @Prop()
  eventType?: string;

  @Prop()
  eventCategory?: string;

  @Prop()
  assetStatus?: AssetStatus;

  @Prop()
  assetCategory?: string;

  @Prop()
  userStatus?: AccountStatus;

  @Prop({ default: 0 })
  totalTransactions: number;

  @Prop({ default: 0 })
  totalVolume: number;

  @Prop({ default: 0 })
  activeUsers: number;

  @Prop({ default: 0 })
  newUsers: number;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
