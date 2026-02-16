import { Module } from '@nestjs/common';

import { SendGridServices } from './send-grid.service';

@Module({
  providers: [SendGridServices],
  exports: [SendGridServices],
})
export class SendGrid {}
