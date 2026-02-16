import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum documentReportStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export class ValidateDocumentDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty()
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({ enum: documentReportStatus })
  @IsEnum(documentReportStatus)
  status: documentReportStatus;
}
