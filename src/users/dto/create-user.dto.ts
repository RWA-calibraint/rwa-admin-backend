import { ApiProperty } from '@nestjs/swagger';

import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  @IsDefined()
  email: string;

  @ApiProperty({ description: 'User name' })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  name: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  @IsDefined()
  role?: UserRole;
}
