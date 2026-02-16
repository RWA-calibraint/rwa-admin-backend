import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { AdminRepository } from 'src/admins/repository/admin.repository';
import { IS_PUBLIC_KEY } from 'src/shared-kernel/utils/constants/decorator-contents';
import { CognitoService } from 'src/shared-kernel/utils/services/aws/cognito.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly adminRepository: AdminRepository,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const accessToken = this.getAccessToken(request);
    if (!accessToken) throw new UnauthorizedException();
    try {
      const result = await this.cognitoService.getUser(accessToken);
      const userData = await this.adminRepository.findByCognitoId(
        result?.userAttributes?.email,
      );
      if (result?.isValid) {
        request.user = userData;
        return true;
      } else {
        return false;
      }
    } catch {
      throw new UnauthorizedException();
    }
  }

  private getAccessToken(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
