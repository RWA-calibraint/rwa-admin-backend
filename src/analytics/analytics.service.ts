import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { Model } from 'mongoose';

import { AccountStatus, AssetStatus } from '../@typings/enums';

import {
  ActivityStats,
  AssetCategoryMetrics,
  AssetMetrics,
  AssetsSoldMetrics,
  DashboardMetrics,
  TimelineData,
  TrendMetrics,
  UserGrowthMetrics,
  UserManagementMetrics,
  UserMetrics,
  VerificationMetrics,
} from './interfaces/analytics.interface';
import { Analytics, AnalyticsDocument } from './schemas/analytics.schema';

export class DashboardQueryDto {
  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Analytics.name)
    private readonly analyticsModel: Model<AnalyticsDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateAnalytics() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dailyStats = await this.analyticsModel.aggregate([
      {
        $match: {
          date: {
            $gte: yesterday,
            $lt: today,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: { $ifNull: ['$totalTransactions', 0] } },
          totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
          activeUsers: { $sum: { $ifNull: ['$activeUsers', 0] } },
        },
      },
    ]);

    const stats = dailyStats[0] || {
      totalTransactions: 0,
      totalVolume: 0,
      activeUsers: 0,
    };

    const analytics = new this.analyticsModel({
      date: yesterday,
      totalTransactions: stats.totalTransactions,
      totalVolume: stats.totalVolume,
      activeUsers: stats.activeUsers,
    });

    await analytics.save();
  }

  async getDailyStats() {
    const stats = await this.analyticsModel.findOne().sort({ date: -1 }).exec();

    return {
      totalTransactions: stats?.totalTransactions || 0,
      totalVolume: stats?.totalVolume || 0,
      activeUsers: stats?.activeUsers || 0,
    };
  }

  async getWeeklyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: '$totalTransactions' },
          totalVolume: { $sum: '$totalVolume' },
          averageActiveUsers: { $avg: '$activeUsers' },
        },
      },
    ]);

    return (
      stats[0] || {
        totalTransactions: 0,
        totalVolume: 0,
        averageActiveUsers: 0,
      }
    );
  }

  async getMetricsByDateRange(startDate: Date, endDate: Date) {
    const metrics = await this.analyticsModel.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: '$eventCategory',
          count: { $sum: 1 },
          totalVolume: { $sum: '$totalVolume' },
          activeUsers: { $avg: '$activeUsers' },
        },
      },
    ]);

    return {
      userActivity: metrics.find((m) => m._id === 'user')?.count || 0,
      assetActivity: metrics.find((m) => m._id === 'asset')?.count || 0,
      transactionActivity:
        metrics.find((m) => m._id === 'transaction')?.count || 0,
      totalVolume: metrics.reduce((sum, m) => sum + (m.totalVolume || 0), 0),
      averageActiveUsers:
        metrics.reduce((sum, m) => sum + (m.activeUsers || 0), 0) /
          metrics.length || 0,
    };
  }

  async getDashboardMetrics(startDate: Date, endDate: Date) {
    const metrics = await this.getMetricsByDateRange(startDate, endDate);
    return {
      userActivity: metrics.userActivity,
      assetActivity: metrics.assetActivity,
      transactionActivity: metrics.transactionActivity,
    };
  }

  async getAssetMetrics() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await this.getMetricsByDateRange(thirtyDaysAgo, today);
    return {
      created: metrics.assetActivity,
      updated: metrics.assetActivity,
      verified: metrics.assetActivity,
      listed: metrics.assetActivity,
    };
  }

  async trackEvent(
    userId: string,
    eventType: string,
    eventCategory: string,
    metadata?: Record<string, any>,
  ) {
    const analytics = new this.analyticsModel({
      userId,
      eventType,
      eventCategory,
      timestamp: new Date(),
      metadata,
    });

    await analytics.save();
  }

  async getPeriodMetrics(startDate: Date, endDate: Date) {
    const metrics = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          pendingAssets: {
            $sum: {
              $cond: [{ $eq: ['$assetStatus', AssetStatus.PENDING] }, 1, 0],
            },
          },
          approvedAssets: {
            $sum: {
              $cond: [{ $eq: ['$assetStatus', AssetStatus.APPROVED] }, 1, 0],
            },
          },
          rejectedAssets: {
            $sum: {
              $cond: [{ $eq: ['$assetStatus', AssetStatus.REJECTED] }, 1, 0],
            },
          },
          totalUsers: { $sum: '$newUsers' },
        },
      },
    ]);

    return (
      metrics[0] || {
        pendingAssets: 0,
        approvedAssets: 0,
        rejectedAssets: 0,
        totalUsers: 0,
      }
    );
  }

  async getMonthlySales(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          eventType: 'sale',
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          count: { $sum: 1 },
          value: { $sum: '$totalVolume' },
        },
      },
      {
        $project: {
          month: '$_id',
          count: 1,
          value: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);
  }

  async getUserStatusStats() {
    return this.analyticsModel
      .aggregate([
        {
          $group: {
            _id: '$userStatus',
            count: { $sum: 1 },
          },
        },
      ])
      .then((stats) =>
        stats.reduce(
          (acc, stat) => ({
            ...acc,
            [stat._id]: stat.count,
          }),
          {},
        ),
      );
  }

  async getDailyUserGrowth(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: '$newUsers' },
        },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  async getAssetStats(startDate: Date, endDate: Date): Promise<AssetMetrics> {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: results.reduce((acc, curr) => acc + curr.count, 0),
      pending: this.getStatusCount(results, AssetStatus.PENDING),
      approved: this.getStatusCount(results, AssetStatus.APPROVED),
      rejected: this.getStatusCount(results, AssetStatus.REJECTED),
      byType: this.groupByType(results),
      timeline: await this.getAssetTimeline(startDate, endDate),
    };
  }

  async getVerificationStats(
    startDate: Date,
    endDate: Date,
  ): Promise<VerificationMetrics> {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          type: 'verification',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$verifierId',
          count: { $sum: 1 },
          avgTime: { $avg: '$duration' },
          lastVerification: { $max: '$date' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'verifier',
        },
      },
    ]);

    const timeline = await this.getVerificationTimeline(startDate, endDate);

    return {
      total: results.reduce((acc, curr) => acc + curr.count, 0),
      completed: this.getCompletedCount(results),
      pending: this.getPendingCount(results),
      byVerifier: results.map((r) => ({
        verifierId: r._id,
        name: r.verifier[0]?.name || 'Unknown',
        count: r.count,
        averageTime: r.avgTime,
        lastVerification: r.lastVerification,
      })),
      averageTime: this.calculateAverageTime(results),
      timeline,
    };
  }

  async getUserStats(startDate: Date, endDate: Date): Promise<UserMetrics> {
    const [results, newRegistrations, activityStats, timeline] =
      await Promise.all([
        this.analyticsModel.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate },
              'user.status': { $ne: AccountStatus.BLOCKED },
            },
          },
          {
            $group: {
              _id: '$userId',
              count: { $sum: 1 },
              lastActive: { $max: '$date' },
              status: { $first: '$user.status' },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: {
                  $cond: [{ $eq: ['$status', AccountStatus.ACTIVE] }, 1, 0],
                },
              },
              suspended: {
                $sum: {
                  $cond: [{ $eq: ['$status', AccountStatus.SUSPENDED] }, 1, 0],
                },
              },
              pending: {
                $sum: {
                  $cond: [{ $eq: ['$status', AccountStatus.PENDING] }, 1, 0],
                },
              },
            },
          },
        ]),
        this.getNewRegistrations(startDate, endDate),
        this.getUserActivity(startDate, endDate),
        this.getUserTimeline(startDate, endDate),
      ]);

    return {
      total: results[0]?.total || 0,
      active: results[0]?.active || 0,
      pending: results[0]?.pending || 0,
      suspended: results[0]?.suspended || 0,
      newRegistrations,
      activityStats,
      timeline,
    };
  }

  async getTrends(startDate: Date, endDate: Date, periodType: string) {
    return this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: this.getPeriodFormat(periodType),
              date: '$date',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getTrendAnalysis(
    startDate: Date,
    endDate: Date,
    periodType: string,
  ): Promise<TrendMetrics> {
    const data = await this.getTimelineTrends(startDate, endDate, periodType);
    return {
      period: periodType,
      data,
    };
  }

  private getPeriodFormat(periodType: string): string {
    switch (periodType) {
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-%U';
      case 'monthly':
        return '%Y-%m';
      case 'yearly':
        return '%Y';
      default:
        return '%Y-%m-%d';
    }
  }

  async exportData(startDate: Date, endDate: Date) {
    return this.generateExportData(startDate, endDate);
  }

  async generateExportData(startDate: Date, endDate: Date) {
    const [assets, verifications, users] = await Promise.all([
      this.getAssetStats(startDate, endDate),
      this.getVerificationStats(startDate, endDate),
      this.getUserStats(startDate, endDate),
    ]);

    return {
      exportedAt: new Date(),
      assets,
      verifications,
      users,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  private getStatusCount(results: any[], status: string): number {
    const statusGroup = results.find((r) => r._id === status);
    return statusGroup ? statusGroup.count : 0;
  }

  private groupByType(results: any[]): Record<string, number> {
    return results.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  private async getAssetTimeline(
    startDate: Date,
    endDate: Date,
  ): Promise<TimelineData[]> {
    return this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  private getCompletedCount(results: any[]): number {
    return results.filter((r) => r.status === AssetStatus.APPROVED).length;
  }

  private getPendingCount(results: any[]): number {
    return results.filter((r) => r.status === AssetStatus.PENDING).length;
  }

  private calculateAverageTime(results: any[]): number {
    const times = results.map((r) => r.avgTime).filter((t) => t);
    return times.length ? times.reduce((a, b) => a + b) / times.length : 0;
  }

  private async getVerificationTimeline(
    startDate: Date,
    endDate: Date,
  ): Promise<TimelineData[]> {
    return this.analyticsModel.aggregate([
      {
        $match: {
          type: 'verification',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  private async getUserActivity(
    startDate: Date,
    endDate: Date,
  ): Promise<ActivityStats[]> {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          lastActive: { $max: '$date' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    return results.map((r) => ({
      userId: r._id,
      username: r.user[0]?.username || 'Unknown',
      count: r.count,
      lastActive: r.lastActive,
      actions: r.count,
      type: r.user[0]?.type || 'user',
    }));
  }

  private async getNewRegistrations(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.analyticsModel.aggregate([
      {
        $match: {
          type: 'registration',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $count: 'count',
      },
    ]);
    return result[0]?.count || 0;
  }

  private async getUserTotal(): Promise<number> {
    const result = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  private async getUserTimeline(
    startDate: Date,
    endDate: Date,
  ): Promise<TimelineData[]> {
    return this.analyticsModel.aggregate([
      {
        $match: {
          type: 'user_activity',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  private async getTimelineTrends(
    startDate: Date,
    endDate: Date,
    periodType: string,
  ): Promise<TimelineData[]> {
    return this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: this.getPeriodFormat(periodType),
              date: '$date',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  async getMetrics(query: DashboardQueryDto): Promise<DashboardMetrics> {
    const { startDate, endDate } = query;
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          pendingApprovals: {
            $sum: { $cond: [{ $eq: ['$status', AssetStatus.PENDING] }, 1, 0] },
          },
          approvedAssets: {
            $sum: { $cond: [{ $eq: ['$status', AssetStatus.APPROVED] }, 1, 0] },
          },
          rejectedAssets: {
            $sum: { $cond: [{ $eq: ['$status', AssetStatus.REJECTED] }, 1, 0] },
          },
          totalUsers: {
            $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      results[0] || {
        pendingApprovals: 0,
        approvedAssets: 0,
        rejectedAssets: 0,
        totalUsers: 0,
      }
    );
  }

  async getAssetCategories(query: any): Promise<AssetCategoryMetrics> {
    const categories = await this.getCategoryStats(query);
    return {
      art: categories.art || 0,
      collectibles: categories.collectibles || 0,
      realEstate: categories.realEstate || 0,
      memorabilia: categories.memorabilia || 0,
    };
  }

  async getAssetsSold(query: DashboardQueryDto): Promise<AssetsSoldMetrics> {
    const { startDate, endDate } = query;
    const [current, previous] = await Promise.all([
      this.getSoldStats(startDate, endDate),
      this.getSoldStats(
        new Date(
          startDate.getTime() - (endDate.getTime() - startDate.getTime()),
        ),
        startDate,
      ),
    ]);

    return {
      total: current.count,
      value: current.value,
      growth: this.calculateGrowth(previous.count, current.count),
    };
  }

  private async getCategoryStats(query: DashboardQueryDto) {
    const { startDate, endDate } = query;
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$assetCategory',
          count: { $sum: 1 },
        },
      },
    ]);

    return results.reduce(
      (acc, curr) => ({
        ...acc,
        [curr._id]: curr.count,
      }),
      {},
    );
  }

  private async getSoldStats(startDate: Date, endDate: Date) {
    const results = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          eventType: 'sale',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          value: { $sum: '$totalVolume' },
        },
      },
    ]);

    return results[0] || { count: 0, value: 0 };
  }

  private calculateGrowth(previous: number, current: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  private async getCurrentGrowth(startDate: Date, endDate: Date) {
    const previousPeriod = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime()),
    );

    const [current, previous] = await Promise.all([
      this.getDailyUserGrowth(startDate.getFullYear()),
      this.getDailyUserGrowth(previousPeriod.getFullYear()),
    ]);

    return {
      current: current.length,
      previous: previous.length,
    };
  }

  async getUserManagement(
    query: DashboardQueryDto,
  ): Promise<UserManagementMetrics> {
    const { startDate, endDate } = query;
    const stats = await this.getUserStats(startDate, endDate);
    return {
      total: stats.total,
      active: stats.active,
      suspended: stats.suspended,
      blocked: 0, // Since UserMetrics doesn't have blocked field
    };
  }

  private async getDailyGrowth(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: 'user_activity',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0]?.count || 0;
  }

  private async getYearlyGrowth(): Promise<number> {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const result = await this.analyticsModel.aggregate([
      {
        $match: {
          date: { $gte: startOfYear },
          type: 'user_activity',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0]?.count || 0;
  }

  async getUserGrowth(query: DashboardQueryDto): Promise<UserGrowthMetrics> {
    const { startDate, endDate } = query;
    const [daily, yearly, growth] = await Promise.all([
      this.getDailyGrowth(startDate, endDate),
      this.getYearlyGrowth(),
      this.getCurrentGrowth(startDate, endDate),
    ]);

    return {
      daily,
      year: yearly,
      current: growth.current,
      previous: growth.previous,
    };
  }
}
