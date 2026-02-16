import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { EmailValidationDto } from 'src/shared-kernel/utils/dto/email-validation.dto';

export class ConfirmSignupDto extends EmailValidationDto {
  @ApiProperty({
    description: 'Verification code sent to the user',
    example: '123456',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.VERIFICATION_CODE.REQUIRED })
  confirmationCode: string;
}
