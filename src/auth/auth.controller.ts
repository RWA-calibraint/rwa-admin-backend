import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from 'src/auth/auth.service';
import {
  ConfirmForgotPasswordDto,
  ConfirmSignupDto,
  ForgotPasswordDto,
  SigninDto,
  SignupDto,
} from 'src/auth/dto';
import { LoginInterceptor } from 'src/auth/interceptor/login.interceptor';
import { SigninResponse } from 'src/auth/interface/authentication.interface';
import { SkipAuth } from 'src/shared-kernel/utils/custom-decorators/skip-auth.decorator';

@SkipAuth()
@ApiTags('Authentications')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign up a new admin' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @HttpCode(HttpStatus.OK)
  async createUser(@Body() signupDetails: SignupDto): Promise<string> {
    return this.authService.createUser(signupDetails);
  }

  @Post('confirm-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm admin signup' })
  @ApiBody({ type: ConfirmSignupDto })
  @ApiResponse({ status: 200, description: 'OK', type: String })
  @HttpCode(HttpStatus.OK)
  async confirmSignup(
    @Body() confirmSignupDetails: ConfirmSignupDto,
  ): Promise<string> {
    return this.authService.confirmSignup(confirmSignupDetails);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin Signin',
    description: 'Admin logs into their account. ',
  })
  @ApiBody({
    type: SigninDto,
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin is not confirmed.',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          message: 'Admin is not confirmed.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation Error',
    content: {
      'application/json': {
        example: {
          message: ['Password is required'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    },
  })
  @UseInterceptors(LoginInterceptor)
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinDetails: SigninDto): Promise<SigninResponse> {
    return this.authService.signin(signinDetails);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: String,
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDetails: ForgotPasswordDto,
  ): Promise<string> {
    return this.authService.forgotPassword(forgotPasswordDetails);
  }

  @Post('confirm-forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiBody({ type: ConfirmForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: String,
  })
  @HttpCode(HttpStatus.OK)
  async confirmForgotPassword(
    @Body() confirmForgotPasswordDetails: ConfirmForgotPasswordDto,
  ): Promise<string> {
    return this.authService.confirmForgotPassword(confirmForgotPasswordDetails);
  }
}
