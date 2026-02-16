import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

import { USER_STATUS } from 'src/shared-kernel/utils/constants/user-enums';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, unique: true })
  userId: string;
  @Prop({ required: true, type: String, unique: true })
  email: string;
  @Prop({ type: String })
  walletAddress?: string;
  @Prop({ required: true, type: String })
  password: string;
  @Prop({ required: true, type: String, unique: true })
  cognitoSubId: string;
  @Prop({ required: true, type: String })
  firstName: string;
  @Prop({ required: true, type: String })
  lastName: string;
  @Prop({ enum: USER_STATUS, type: String, default: USER_STATUS.ACTIVE })
  status?: USER_STATUS;
  @Prop({ type: Date, default: null })
  suspendExpiryAt?: Date | null;
  @Prop({ type: String })
  stripeAccountId?: string;
  @Prop({ required: true, type: String })
  description: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
