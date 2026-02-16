import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Pdf encryption password' })
  @IsString()
  @IsOptional()
  password: string;
}
