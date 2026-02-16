import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User first name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Wallet address', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;
}
