import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Model } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationCronService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldReadNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.notificationModel.deleteMany({
      isRead: true,
      createdAt: { $lte: thirtyDaysAgo },
    });

    return !!result;
  }
}
