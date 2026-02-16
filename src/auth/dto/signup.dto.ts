import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsNotEmpty, Matches } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { USER_NAME_REGEX } from 'src/shared-kernel/utils/constants/regexs';
import { EmailValidationDto } from 'src/shared-kernel/utils/dto/email-validation.dto';

export class SignupDto extends EmailValidationDto {
  @ApiProperty({
    description: 'The password of the user',
    example: 'Test@123',
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.PASSWORD.REQUIRED })
  password: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.NAME.FIRST_NAME.REQUIRED })
  @Matches(USER_NAME_REGEX, {
    message: ERROR_MESSAGES.DTOS.NAME.FIRST_NAME.IN_VALID,
  })
  firstName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.DTOS.NAME.LAST_NAME.REQUIRED })
  lastName: string;
}
