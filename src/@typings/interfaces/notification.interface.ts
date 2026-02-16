import { AuditEntityType } from '../enums/audit.enum';
import {
  NotificationPriority,
  NotificationType,
} from '../enums/notification.enum';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType?: AuditEntityType;
  entityId?: string;
  recipientId: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
  priorities: {
    [key in NotificationPriority]: boolean;
  };
}
