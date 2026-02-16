import { createHmac } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandOutput,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  GetUserCommand,
  GetUserCommandOutput,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  SignUpCommand,
  SignUpCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

import { ConfirmForgotPasswordDto, SigninDto, SignupDto } from 'src/auth/dto';

@Injectable()
export class CognitoService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly poolClientId: string;
  constructor(private readonly configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.poolClientId = this.configService.get('AWS_COGNITO_POOL_CLIENT_ID');
  }

  async signup(signupDetails: SignupDto): Promise<SignUpCommandOutput> {
    const secretHash = this.generateSecretHash(signupDetails.email);
    const signupCommand: SignUpCommand = new SignUpCommand({
      ClientId: this.poolClientId,
      SecretHash: secretHash,
      Username: signupDetails.email,
      Password: signupDetails.password,
    });
    return this.cognitoClient.send(signupCommand);
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

  async getUser(accessToken: string): Promise<GetUserCommandOutput> {
    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken,
    });

    return this.cognitoClient.send(getUserCommand);
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
}
