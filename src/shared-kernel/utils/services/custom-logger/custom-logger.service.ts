import { ConsoleLogger, ConsoleLoggerOptions } from '@nestjs/common';

export class CustomLoggerService extends ConsoleLogger {
  constructor(context: string, options: ConsoleLoggerOptions = {}) {
    super(context, options);
  }
}
