import { Module } from '@nestjs/common';

import { PaymentsController } from 'src/payments/payments.controller';
import { PaymentsService } from 'src/payments/payments.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
