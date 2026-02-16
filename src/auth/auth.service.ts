import { pbkdf2Sync } from 'crypto';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { AdminRepository } from 'src/admins/repository/admin.repository';
import { Admin } from 'src/admins/schema/admin.schema';
import { EMAIL_CONSTANTS } from 'src/assets/constants/email.messages';
import {
  ConfirmForgotPasswordDto,
  ConfirmSignupDto,
  ForgotPasswordDto,
  SigninDto,
  SignupDto,
} from 'src/auth/dto';
import { SigninResponse } from 'src/auth/interface/authentication.interface';
import { SendGridServices } from 'src/shared/services/send-grid/send-grid.service';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { HttpExceptions } from 'src/shared-kernel/utils/custom-error';
import { CognitoService } from 'src/shared-kernel/utils/services/aws/cognito.service';
import { capitalizeFistLetter } from 'src/shared-kernel/utils/text-formatter';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,

    private readonly cognitoService: CognitoService,
    private readonly adminRepository: AdminRepository,
    private readonly configService: ConfigService,
    private readonly sendGridServices: SendGridServices,
  ) {}

  async createUser(signupDetails: SignupDto): Promise<string> {
    try {
      const result = await this.cognitoService.signup(signupDetails);
      await this.adminRepository.create({
        ...signupDetails,
        adminId: Math.floor(Math.random() * 100).toString(),
        firstName: signupDetails.firstName,
        lastName: signupDetails.lastName,
        cognitoSubId: result?.User?.Username,
        isSuperAdmin: false,
      });

      const emailBodyData = {
        userName: `${capitalizeFistLetter(signupDetails.firstName)} ${signupDetails.lastName}`,
        password: signupDetails.password,
      };

      await this.sendGridServices.sendMail(
        signupDetails?.email,
        EMAIL_CONSTANTS.ADMIN.CREATED.SUBJECT,
        EMAIL_CONSTANTS.ADMIN.CREATED.TEMPLATE_FILE_KEY,
        emailBodyData,
      );

      return 'OK';
    } catch (error) {
      throw new HttpExceptions(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async confirmSignup(confirmSignupDetails: ConfirmSignupDto): Promise<string> {
    try {
      await this.cognitoService.confirmSignup(
        confirmSignupDetails.email,
        confirmSignupDetails.confirmationCode,
      );
      return 'OK';
    } catch (error) {
      throw new HttpExceptions(error.message, HttpStatus.FORBIDDEN);
    }
  }

  private validateAdminDetails(adminDetails: Admin | null) {
    if (!adminDetails) {
      throw new Error(ERROR_MESSAGES.RESPONSES.ADMIN_NOT_FOUND);
    }
  }
  async signin(signinDetails: SigninDto): Promise<SigninResponse> {
    try {
      const adminDetails = await this.adminRepository.find(signinDetails.email);
      this.validateAdminDetails(adminDetails);
      const result = await this.cognitoService.signin(signinDetails);
      return { accessToken: result.AuthenticationResult?.AccessToken || '' };
    } catch (error) {
      throw new HttpExceptions(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async forgotPassword(
    forgotPasswordDetails: ForgotPasswordDto,
  ): Promise<string> {
    try {
      const { email } = forgotPasswordDetails;
      const isAdmin = await this.adminModel.findOne({ email }).exec();

      if (!isAdmin) {
        throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
      }

      await this.cognitoService.forgotPassword(email);
      return 'OK';
    } catch (error) {
      throw new HttpExceptions(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async confirmForgotPassword(
    confirmForgotPasswordDetails: ConfirmForgotPasswordDto,
  ): Promise<string> {
    try {
      await this.cognitoService.confirmForgotPassword(
        confirmForgotPasswordDetails,
      );
      const { cognitoSubId } = await this.adminRepository.find(
        confirmForgotPasswordDetails.email,
      );
      const userUpdateData = {
        email: confirmForgotPasswordDetails.email,
        password: confirmForgotPasswordDetails.password,
        cognitoSubId: cognitoSubId,
      };
      this.adminRepository.update(userUpdateData);
      return 'OK';
    } catch (error) {
      throw new HttpExceptions(error.message, HttpStatus.FORBIDDEN);
    }
  }

  private generatePasswordHash(userEmail: string, password: string): string {
    return pbkdf2Sync(
      `${userEmail}${password}`,
      this.configService.get('CRYPTO_SALT'),
      1000,
      64,
      `sha512`,
    ).toString(`hex`);
  }
}
