import { Module } from '@nestjs/common';

import { DashboardController } from 'src/dashboard/dashboard.controller';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { SharedModule } from 'src/shared/shared.module';

import { DashboardCron } from './cron/dashboard.cron';

@Module({
  imports: [SharedModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardCron],
  exports: [DashboardService],
})
export class DashboardModule {}
