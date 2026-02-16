import { HttpException } from '@nestjs/common';

export class HttpExceptions extends HttpException {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message, statusCode);
  }
}
