import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';

import { AdminService } from 'src/admins/admins.service';
import { AdminRepository } from 'src/admins/repository/admin.repository';
import { Admin, AdminSchema } from 'src/admins/schema/admin.schema';
import { AnalyticsService } from 'src/analytics/analytics.service';
import {
  Analytics,
  AnalyticsSchema,
} from 'src/analytics/schemas/analytics.schema';
import { ExclusiveAccessRepository } from 'src/assets/repositories/exclusive-access.repository';
import {
  AssetHistory,
  AssetHistorySchema,
} from 'src/assets/schemas/asset-history.schema';
import {
  AssetListing,
  AssetListingSchema,
} from 'src/assets/schemas/asset-listing.schema';
import { Asset, AssetSchema } from 'src/assets/schemas/asset.schema';
import {
  AssetCategory,
  AssetCategorySchema,
} from 'src/assets/schemas/category.schema';
import {
  CryptoListingSchema,
  CryptoTransactions,
} from 'src/assets/schemas/cryptoTransactions.schema';
import { Document, DocumentSchema } from 'src/assets/schemas/document.schema';
import {
  ExclusiveAccess,
  ExclusiveAccessSchema,
} from 'src/assets/schemas/exclusive-access.schema';
import {
  PriceHistory,
  PriceHistorySchema,
} from 'src/assets/schemas/price-history.schema';
import {
  WishlistAsset,
  WishlistAssetSchema,
} from 'src/assets/schemas/wishlistAsset.schema';
import { AuditService } from 'src/audit/audit.service';
import { Audit, AuditSchema } from 'src/audit/schemas/audit.schema';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notifications/schemas/notification.schema';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentRepository } from 'src/payments/repository/payment.repository';
import { TokenRepository } from 'src/payments/repository/token.repository';
import { Payment, PaymentSchema } from 'src/payments/schemas/payment.schema';
import { Token, TokenSchema } from 'src/payments/schemas/token.schema';
import { StripeService } from 'src/payments/stripe/stripe.service';
import { DynamicTimeoutsService } from 'src/shared-kernel/utils/dynamic-timeout/dynamic-timeout';
import { CognitoService } from 'src/shared-kernel/utils/services/aws/cognito.service';
import { UserRepository } from 'src/users/repository/user.repository';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

import { DatabaseModule } from './database.module';
import { S3Service } from './services/S3/s3.service';
import { SendGridServices } from './services/send-grid/send-grid.service';

@Global()
@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: AssetCategory.name, schema: AssetCategorySchema },
      { name: AssetHistory.name, schema: AssetHistorySchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Audit.name, schema: AuditSchema },
      { name: Token.name, schema: TokenSchema },
      { name: PriceHistory.name, schema: PriceHistorySchema },
      { name: ExclusiveAccess.name, schema: ExclusiveAccessSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: WishlistAsset.name, schema: WishlistAssetSchema },
      { name: AssetListing.name, schema: AssetListingSchema },
      { name: CryptoTransactions.name, schema: CryptoListingSchema },
    ]),
  ],
  providers: [
    UserRepository,
    AdminRepository,
    AdminService,
    UsersService,
    PaymentsService,
    CognitoService,
    AuthGuard,
    DashboardService,
    AnalyticsService,
    AuditService,
    NotificationsService,
    SendGridServices,
    S3Service,
    PaymentsService,
    StripeService,
    PaymentRepository,
    TokenRepository,
    ExclusiveAccessRepository,
    DynamicTimeoutsService,
    SchedulerRegistry,
  ],
  exports: [
    DatabaseModule,
    MongooseModule,
    AdminRepository,
    AdminService,
    UsersService,
    PaymentsService,
    NotificationsService,
    CognitoService,
    AuthGuard,
    DashboardService,
    AnalyticsService,
    AuditService,
    SendGridServices,
    S3Service,
    StripeService,
    PaymentRepository,
    UserRepository,
    TokenRepository,
    ExclusiveAccessRepository,
    DynamicTimeoutsService,
    SchedulerRegistry,
  ],
})
export class SharedModule {}
