import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  receiverId: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  url: string;

  @Prop({ default: false })
  isRead: boolean;
}

export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index(
  { receiverId: 1, message: 1, url: 1 },
  { unique: true },
);
