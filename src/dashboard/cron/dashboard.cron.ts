import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import * as mixpanelLib from 'mixpanel';

import { DashboardService } from '../dashboard.service';

@Injectable()
export class DashboardCron {
  private mixpanel;
  private isCronRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly dashboardService: DashboardService,
  ) {
    this.mixpanel = mixpanelLib.init(
      this.configService.get('MIX_PANEL_TOKEN'),
      { secret: this.configService.get('MIX_PANEL_SECRET') },
    );
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async sendMetricsToMixpanel() {
    try {
      if (this.isCronRunning) return;

      console.log('Running task every 10 seconds - dashboard cron service');
      this.isCronRunning = true;

      //   const soldAssetsResult =
      //     await this.dashboardService.getSoldAssetsGroupedByDay();
      const usersSignupResult =
        await this.dashboardService.getUserSignupGroupedByDay();

      const activeUsersResult =
        await this.dashboardService.getUsersGroupedByLastActiveDate();

      const getTotalRevenueResult =
        await this.dashboardService.getTotalRevenueByDay();

      // # update asset sold data
      //   soldAssetsResult.forEach(async (assetSoldInfo) => {
      //     await this.mixpanel.import(
      //       'weekly_assets_sold_bought',
      //       assetSoldInfo.timestamp,
      //       assetSoldInfo,
      //     );
      //   });

      //   # update usersSignup data
      usersSignupResult.forEach(async (usersSignUp) => {
        await this.mixpanel.import(
          'users_signup',
          usersSignUp.timestamp,
          usersSignUp,
        );
      });

      //   # update active user signin data
      activeUsersResult.forEach(async (activeUser) => {
        await this.mixpanel.import(
          'active_users',
          activeUser.timestamp,
          activeUser,
        );
      });

      //   # update total revenue data
      getTotalRevenueResult.forEach(async (totalRevenue) => {
        await this.mixpanel.import(
          'total_revenue',
          totalRevenue.timestamp,
          totalRevenue,
        );
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.isCronRunning = false;
    }
  }
}
