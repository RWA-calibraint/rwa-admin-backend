import { createHmac } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AdminCreateUserCommand,
  AdminCreateUserCommandOutput,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandOutput,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  GetUserCommand,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

import { ConfirmForgotPasswordDto, SigninDto, SignupDto } from 'src/auth/dto';

@Injectable()
export class CognitoService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly poolClientId: string;
  private readonly userPoolId: string;
  constructor(private readonly configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.poolClientId = this.configService.get('AWS_COGNITO_POOL_CLIENT_ID');
    this.userPoolId = this.configService.get('AWS_USER_POOL_ID');
  }

  async signup(
    signupDetails: SignupDto,
  ): Promise<AdminCreateUserCommandOutput> {
    const result = await this.cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: signupDetails.email,
        UserAttributes: [
          { Name: 'email', Value: signupDetails.email },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      }),
    );

    await this.cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: signupDetails.email,
        Password: signupDetails.password,
        Permanent: true,
      }),
    );

    return result;
  }

  async confirmSignup(
    userName: string,
    confirmationCode: string,
  ): Promise<ConfirmSignUpCommandOutput> {
    const secretHash = this.generateSecretHash(userName);
    const confirmSignupCommand = new ConfirmSignUpCommand({
      ClientId: this.poolClientId,
      SecretHash: secretHash,
      Username: userName,
      ConfirmationCode: confirmationCode,
    });

    return this.cognitoClient.send(confirmSignupCommand);
  }

  async signin(signinDetails: SigninDto): Promise<InitiateAuthCommandOutput> {
    const secretHash = this.generateSecretHash(signinDetails.email);
    const initiateAuthCommand = new InitiateAuthCommand({
      ClientId: this.poolClientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: signinDetails.email,
        PASSWORD: signinDetails.password,
        SECRET_HASH: secretHash,
      },
    });
    return this.cognitoClient.send(initiateAuthCommand);
  }

  async forgotPassword(userName: string): Promise<ForgotPasswordCommandOutput> {
    const secretHash = this.generateSecretHash(userName);
    const forgotPasswordCommand = new ForgotPasswordCommand({
      ClientId: this.poolClientId,
      Username: userName,
      SecretHash: secretHash,
    });
    return this.cognitoClient.send(forgotPasswordCommand);
  }

  async getUser(accessToken: string): Promise<any> {
    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken,
    });
    // return this.cognitoClient.send(getUserCommand);
    const response = await this.cognitoClient.send(getUserCommand);
    return {
      isValid: true,
      username: response.Username,
      userAttributes: response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    };
  }

  async confirmForgotPassword(
    confirmForgotPasswordDetails: ConfirmForgotPasswordDto,
  ): Promise<ConfirmForgotPasswordCommandOutput> {
    const secretHash = this.generateSecretHash(
      confirmForgotPasswordDetails.email,
    );
    const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
      ClientId: this.poolClientId,
      Username: confirmForgotPasswordDetails.email,
      Password: confirmForgotPasswordDetails.password,
      ConfirmationCode: confirmForgotPasswordDetails.confirmationCode,
      SecretHash: secretHash,
    });
    return this.cognitoClient.send(confirmForgotPasswordCommand);
  }
  generateSecretHash(username: string): string {
    const hasher = createHmac(
      'sha256',
      this.configService.get('AWS_COGNITO_SECRET_HASH'),
    );
    hasher.update(
      `${username}${this.configService.get('AWS_COGNITO_POOL_CLIENT_ID')}`,
    );
    return hasher.digest('base64');
  }

  async resetPassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const changeCommand = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: currentPassword,
      ProposedPassword: newPassword,
    });
    return await this.cognitoClient.send(changeCommand);
  }

  async changeEmail(currentEmail, newEmail: string) {
    const changeEmailCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: currentEmail,
      UserAttributes: [
        {
          Name: 'email',
          Value: newEmail,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    });

    return await this.cognitoClient.send(changeEmailCommand);
  }

  async checkUserExists(username: string): Promise<boolean> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.cognitoClient.send(command);
      return true;
    } catch (error) {
      if (error.name === 'UserNotFoundException') {
        return false;
      }
      throw error;
    }
  }

  async deleteUser(cognitoSubId: string) {
    const isUserExist = await this.checkUserExists(cognitoSubId);

    if (!isUserExist) return false;

    const deleteUserCommand = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: cognitoSubId,
    });

    return await this.cognitoClient.send(deleteUserCommand);
  }
}
