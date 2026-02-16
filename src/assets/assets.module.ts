import { Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { ArweaveService } from 'src/arweave/arweave.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SharedModule } from 'src/shared/shared.module';
import { DynamicTimeoutsService } from 'src/shared-kernel/utils/dynamic-timeout/dynamic-timeout';

import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetCronService } from './cron/asset-cron.service';

@Module({
  imports: [SharedModule],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetCronService,
    DynamicTimeoutsService,
    SchedulerRegistry,
    NotificationsService,
    ArweaveService,
    BlockchainService,
  ],
  exports: [AssetsService, AssetCronService],
})
export class AssetsModule {}
