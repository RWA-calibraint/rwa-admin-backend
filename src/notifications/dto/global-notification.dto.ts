import { IsNotEmpty, IsString } from 'class-validator';

export class GlobalNotificationDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  url: string;
}
