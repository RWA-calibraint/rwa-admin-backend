import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/error-message';
import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

import { NotificationsService } from './notifications.service';
@ApiTags('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Req() request) {
    try {
      const adminId = request.user._id;
      if (!adminId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const result =
        await this.notificationsService.getUserNotifications(adminId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post('read/:notificationId')
  @ApiParam({ name: 'notificationId' })
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    try {
      const result =
        await this.notificationsService.markNotificationAsRead(notificationId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post('read-all')
  async markAllNotificationsAsRead(@Req() request) {
    try {
      const adminId = request.user._id;
      const result =
        await this.notificationsService.markAllNotificationsAsRead(adminId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
