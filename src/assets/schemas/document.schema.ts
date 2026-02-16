import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

export type DocumentType = HydratedDocument<Document>;

enum documentReportStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  assetId: string;

  @Prop({ default: documentReportStatus.PENDING })
  status: documentReportStatus;

  @Prop({ default: null })
  extension: string;

  @Prop({ type: String, default: null })
  documentName: string;

  @Prop({ type: String, required: true })
  documentUrl: string;

  @Prop({ default: null })
  adminRemarks: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: null })
  verifiedBy: string;

  @Prop({ default: null })
  verificationDate: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
