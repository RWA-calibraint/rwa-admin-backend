import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';

export class DocumentInterface {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class CreateAssetDto {
  @ApiProperty({ example: 'Luxury Painting', description: 'Name of the asset' })
  @IsString()
  @Matches(/\S/, { message: ERROR_MESSAGES.ASSET.ASSET_NAME.REQUIRED })
  name: string;

  @ApiProperty({
    example: 'An exclusive piece of art',
    description: 'Description of the asset',
  })
  @IsString()
  @Matches(/\S/, { message: ERROR_MESSAGES.ASSET.ASSET_DESCRIPTION.REQUIRED })
  description: string;

  @ApiProperty({ example: 5000, description: 'Price of the asset' })
  @IsString()
  @Matches(/\S/, { message: ERROR_MESSAGES.ASSET.ASSET_PRICE.REQUIRED })
  price: string;

  @ApiProperty({
    example: '65bff54d68f6bc001e6b2c78',
    description: 'Category ID (ObjectId)',
  })
  @IsString()
  @Matches(/\S/, { message: ERROR_MESSAGES.ASSET.ASSET_CATEGORY.REQUIRED })
  @IsMongoId()
  category: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 'USA', description: 'Country of the asset' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'California', description: 'State of the asset' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: 'LA', description: 'City of the asset' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    example: '123 Main St, Los Angeles',
    description: 'Address of the asset',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: '90001', description: 'Pincode of the asset' })
  @IsNotEmpty()
  @IsString()
  pincode: string;

  @ApiProperty({ description: 'Documents for the asset (PDFs or images)' })
  @Transform(({ value: documents }) => JSON.parse(documents))
  @IsObject()
  documents: Record<string, DocumentInterface[]>;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  tokens: number;

  @ApiProperty()
  @IsNotEmpty()
  priceHistory: string;

  @ApiProperty()
  @IsOptional()
  listedDate: Date;

  @ApiProperty()
  @IsOptional()
  isFeaturedAsset?: boolean;
}
