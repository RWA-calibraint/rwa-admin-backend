import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { IsValidEmail } from 'src/shared-kernel/utils/custom-decorators/is-valid-email.decorator';
export class EmailValidationDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test-v4-1@mailsac.com',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.EMAIL.REQUIRED })
  @IsValidEmail()
  email: string;
}
