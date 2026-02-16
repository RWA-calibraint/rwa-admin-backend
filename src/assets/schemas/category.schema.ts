import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class AssetCategory {
  @Prop({ required: true, type: String })
  category: string;
}

export type AssetCategoryDocument = HydratedDocument<AssetCategory>;

export const AssetCategorySchema = SchemaFactory.createForClass(AssetCategory);
