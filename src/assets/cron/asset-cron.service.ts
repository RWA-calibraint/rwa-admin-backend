import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Model } from 'mongoose';

import { Asset } from '../schemas/asset.schema';
import { AssetStatus } from '../types';

@Injectable()
export class AssetCronService {
  constructor(
    @InjectModel(Asset.name) private readonly assetModel: Model<Asset>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateListedAssetsStatus() {
    try {
      Logger.log('Cron for updating the Going Live asset to live is running');

      const now = new Date();
      const endOfTodayUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      await this.assetModel.updateMany(
        {
          listedDate: {
            $lte: endOfTodayUTC,
          },
          status: AssetStatus.GOING_LIVE,
        },
        { $set: { status: AssetStatus.LIVE } },
      );
    } catch (error) {
      Logger.log(
        'Error in cron for updating the Going Live asset to live is running ',
      );
    }
  }
}
