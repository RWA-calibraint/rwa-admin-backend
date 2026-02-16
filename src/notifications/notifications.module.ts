import { Module } from '@nestjs/common';

import { NotificationsService } from 'src/notifications/notifications.service';
import { SharedModule } from 'src/shared/shared.module';

import { NotificationController } from './notifications.controller';

@Module({
  imports: [SharedModule],
  controllers: [NotificationController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationModule {}
