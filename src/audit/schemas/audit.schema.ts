import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ required: true })
  resourceId: string;

  @Prop({ type: Object })
  changes?: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
