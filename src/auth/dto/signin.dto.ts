import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { EmailValidationDto } from 'src/shared-kernel/utils/dto/email-validation.dto';

export class SigninDto extends EmailValidationDto {
  @ApiProperty({
    description: 'The password of the user',
    example: 'Test@123',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.PASSWORD.REQUIRED })
  password: string;
}
