import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, type: String })
  firstName: string;
  @Prop({ required: true, type: String })
  lastName: string;
  @Prop({ type: String, unique: true })
  adminId: string;
  @Prop({ required: true, type: String, unique: true })
  email: string;
  @Prop({ type: String })
  walletAddress?: string;
  @Prop({ required: true, type: String, unique: true })
  cognitoSubId: string;
  @Prop({ required: true, type: Boolean, default: false })
  isSuperAdmin: boolean;
}

export type AdminDocument = HydratedDocument<Admin>;

export const AdminSchema = SchemaFactory.createForClass(Admin);
