import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { User } from 'src/users/schemas/user.schema';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly NotificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly UserModel: Model<User>,
  ) {}

  async globalNotifications(notificationDto) {
    const allUsers = await this.UserModel.find({}, '_id');
    let totalSent = 0;
    let totalSkipped = 0;

    for (let i = 0; i < allUsers.length; i += 100) {
      const batch = allUsers.slice(i, i + 100);

      const notifications = batch.map((user) => ({
        receiverId: user._id,
        message: notificationDto.message,
        url: notificationDto.url,
      }));

      try {
        const result = await this.NotificationModel.insertMany(notifications, {
          ordered: false,
        });
        totalSent += result.length;
      } catch (error) {
        if (error.writeErrors) {
          totalSent += error.result?.result?.nInserted || 0;
          totalSkipped += error.writeErrors.length;
        } else {
          throw error;
        }
      }
    }
    return {
      message: `Notifications sent: ${totalSent}, Skipped (duplicates): ${totalSkipped}`,
    };
  }

  async sendNotification(notificationDto) {
    const notification = await this.NotificationModel.create({
      receiverId: notificationDto.userId,
      message: notificationDto.message,
      url: notificationDto?.url,
    });
    return notification;
  }

  async sendExclusiveAccessNotification(notificationDto) {
    return await this.NotificationModel.insertMany(notificationDto, {
      ordered: false,
    });
  }

  async getUserNotifications(adminId: string) {
    const notifications = await this.NotificationModel.find({
      receiverId: adminId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return notifications;
  }

  async markNotificationAsRead(notificationId: string) {
    const result = await this.NotificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );
    return !!result;
  }

  async markAllNotificationsAsRead(adminId: string) {
    const result = await this.NotificationModel.updateMany(
      { receiverId: adminId },
      { $set: { isRead: true } },
    );
    return result.modifiedCount > 0;
  }
}
