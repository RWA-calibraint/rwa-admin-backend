import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ExclusiveAccess {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Asset' })
  assetId: mongoose.Types.ObjectId;
}

export type ExclusiveAccessDocument = HydratedDocument<ExclusiveAccess>;

export const ExclusiveAccessSchema =
  SchemaFactory.createForClass(ExclusiveAccess);
