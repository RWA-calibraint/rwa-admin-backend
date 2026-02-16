import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { EmailValidationDto } from 'src/shared-kernel/utils/dto/email-validation.dto';

export class ConfirmForgotPasswordDto extends EmailValidationDto {
  @ApiProperty({
    description: 'New password for the user',
    example: 'NewPassword@123',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.PASSWORD.REQUIRED })
  password: string;

  @ApiProperty({
    description:
      'Verification code sent to the user for password reset confirmation',
    example: '654321',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.VERIFICATION_CODE.REQUIRED })
  confirmationCode: string;
}
