import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class LoginInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<object> {
    return next.handle().pipe(
      map(({ accessToken }) => {
        const response = context.switchToHttp().getResponse<Response>();
        response.cookie('admin-access-token', accessToken, {
          httpOnly: true,
          secure: true,
        });
        return { accessToken };
      }),
    );
  }
}
