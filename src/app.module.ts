import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from 'src/admins/admins.module';
import { AppController } from 'src/app.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { AwsSdkModule } from 'src/shared-kernel/utils/services/aws/aws.module';
import { UsersModule } from 'src/users/users.module';

import { AnalyticsModule } from './analytics/analytics.module';
import { AssetsModule } from './assets/assets.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { SharedModule } from './shared/shared.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
    ]),
    SharedModule,
    UsersModule,
    NotificationModule,
    AssetsModule,
    AdminModule,
    AuthModule,
    AwsSdkModule,
    PaymentsModule,
    DashboardModule,
    AnalyticsModule,
    AuditModule,
    AssetsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
