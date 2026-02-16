import { Module } from '@nestjs/common';

import { AnalyticsService } from 'src/analytics/analytics.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
