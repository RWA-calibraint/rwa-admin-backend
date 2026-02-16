import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StripeService } from 'src/payments/stripe/stripe.service';

@Module({
  imports: [ConfigModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
