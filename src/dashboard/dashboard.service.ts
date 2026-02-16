import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import * as moment from 'moment';
import { Model } from 'mongoose';

import { AssetHistory } from 'src/assets/schemas/asset-history.schema';
import { Asset, AssetDocument } from 'src/assets/schemas/asset.schema';
import {
  AssetCategory,
  AssetCategoryDocument,
} from 'src/assets/schemas/category.schema';
import { Token, TokenDocument } from 'src/assets/schemas/token.schema';
import { Payment, PaymentDocument } from 'src/payments/schemas/payment.schema';
import { User } from 'src/users/schemas/user.schema';

import { TokenMetricsQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(AssetCategory.name)
    private assetCategoryModel: Model<AssetCategoryDocument>,
    @InjectModel(AssetHistory.name)
    private readonly assetHistoryModel: Model<AssetHistory>,
  ) {}

  async getTotalAssetMetricsByCategory() {
    const result = await this.assetModel.aggregate([
      {
        $addFields: {
          category: {
            $cond: [
              { $eq: [{ $type: '$category' }, 'string'] },
              { $toObjectId: '$category' },
              '$category',
            ],
          },
        },
      },
      { $match: { status: { $nin: ['Delisted', 'Rejected'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'assetcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      { $project: { _id: 0, category: '$categoryDetails.category', count: 1 } },
    ]);
    return result;
  }

  async getAssetCountDashboard() {
    const totalApprovedAssets = await this.getTotalApprovedAssets();
    const totalRejectedAssets = await this.getTotalRejectedAssets();
    const totalUsers = await this.getTotalUsers();
    const tokenSoldTokens = await this.getTotalSoldTokens();

    const totalUserAverage = await this.getAverageFromLastMonth(
      this.userModel,
      {},
    );

    const totalApprovedAssetsAvg = await this.getAverageFromLastMonth(
      this.assetModel,
      { status: 'Live' },
    );

    const totalRejectedAssetsAvg = await this.getAverageFromLastMonth(
      this.assetModel,
      { status: 'Rejected' },
    );

    const totalTokenSoldAvg = await this.getAverageFromLastMonth(
      this.tokenModel,
    );

    return [
      {
        id: 1,
        title: 'Approved Assets',
        value: totalApprovedAssets.toString(),
        change: totalApprovedAssetsAvg.percentageChange,
      },
      {
        id: 2,
        title: 'Rejected Assets',
        value: totalRejectedAssets.toString(),
        change: totalRejectedAssetsAvg.percentageChange,
      },
      {
        id: 3,
        title: 'Total Users',
        value: totalUsers.toString(),
        change: totalUserAverage.percentageChange,
      },
      {
        id: 4,
        title: 'Tokens Sold',
        value: tokenSoldTokens.toString(),
        change: totalTokenSoldAvg.percentageChange,
      },
    ];
  }

  async getTotalAssetSoldDashboard(AssetCategory: string, year: string) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year + 1}-01-01`);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const pipelineResponse = await this.tokenModel.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $lookup: {
          from: 'assets',
          localField: 'assetId',
          foreignField: '_id',
          as: 'asset',
        },
      },
      { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'payments',
          localField: 'transactionId',
          foreignField: '_id',
          as: 'payment',
        },
      },
      { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
      { $addFields: { month: { $month: '$createdAt' } } },
      {
        $match: {
          ...(AssetCategory !== 'All' && { 'asset.category': AssetCategory }),
        },
      },
      {
        $group: {
          _id: '$month',
          totalTokens: { $sum: 1 },
          totalPrice: { $sum: '$payment.amount' },
        },
      },
      { $project: { _id: 0, month: '$_id', totalTokens: 1, totalPrice: 1 } },
      { $sort: { month: 1 } },
    ]);

    const assetsResult = Array.from({ length: 12 }, (_, i) => {
      const monthData = pipelineResponse.find((item) => item.month === i + 1);
      return {
        month: monthNames[i],
        assets: monthData?.totalTokens || 0,
        usd: monthData?.totalPrice || 0,
        year,
      };
    });

    const distinctCategories = await this.assetCategoryModel.aggregate([
      { $project: { _id: 1, category: 1 } },
    ]);

    distinctCategories.unshift({ _id: 'All', category: 'All' });

    const yearsAggregation = await this.tokenModel.aggregate([
      { $project: { year: { $year: '$createdAt' } } },
      { $group: { _id: null, years: { $addToSet: '$year' } } },
    ]);

    const yearsResult = (yearsAggregation[0]?.years || []).sort(
      (a, b) => a - b,
    );

    return {
      assets: assetsResult,
      categories: distinctCategories,
      years: yearsResult,
    };
  }

  async getTotalUserMetricsByYear(year: string) {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const result = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
      { $project: { _id: 0, month: '$_id', count: 1 } },
      { $sort: { month: 1 } },
    ]);

    // Convert month numbers to month names
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthlyData = Array(12)
      .fill(0)
      .map((_, index) => ({ month: monthNames[index], count: 0, year: year }));

    // Merge result into monthlyData
    result.forEach(({ month, count }) => {
      monthlyData[month - 1].count = count;
    });
    const currentYear = new Date().getFullYear();
    return {
      users: monthlyData,
      years: [currentYear, currentYear - 1, currentYear - 2],
    };
  }

  async getTotalUserMetricsByStatus() {
    const result = await this.userModel.aggregate([
      { $group: { _id: '$status', users: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', users: 1 } },
    ]);
    return result;
  }

  async getTotalApprovedAssets() {
    return await this.assetModel.countDocuments({ status: 'Live' });
  }

  async getTotalRejectedAssets() {
    return await this.assetModel.countDocuments({ status: 'Rejected' });
  }

  async getTotalUsers() {
    return await this.userModel.countDocuments();
  }

  async getTotalSoldTokens() {
    return this.tokenModel.countDocuments();
  }

  async getAverageFromLastMonth(model, matchCase = {}, customStages = []) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const result = await model
      .aggregate([
        ...customStages,
        { $match: { ...matchCase, createdAt: { $gte: startOfLastMonth } } },
        {
          $addFields: {
            period: {
              $cond: [
                { $gte: ['$createdAt', startOfThisMonth] },
                'thisMonth',
                'lastMonth',
              ],
            },
          },
        },
        { $group: { _id: '$period', count: { $sum: 1 } } },
        { $project: { _id: 0, period: '$_id', count: 1 } },
      ])
      .exec();

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    for (const item of result) {
      if (item.period === 'thisMonth') thisMonthCount = item.count;
      if (item.period === 'lastMonth') lastMonthCount = item.count;
    }

    // Calculate percentage change
    let percentageChange: string = '0';

    if (lastMonthCount > 0) {
      const change = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      const rounded = change.toFixed(2);
      percentageChange = (change >= 0 ? '+' : '') + rounded + '%';
    } else if (thisMonthCount > 0) {
      percentageChange = '+100.00%';
    } else {
      percentageChange = '0.00%';
    }

    return { thisMonthCount, lastMonthCount, percentageChange };
  }

  async getSoldAssetsGroupedByDay() {
    return await this.assetModel
      .aggregate([
        { $match: { sold: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
            sold: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: {
              $toLong: {
                $divide: [
                  { $toLong: { $dateFromString: { dateString: '$_id' } } },
                  1000,
                ],
              },
            },
            sold: 1,
          },
        },
        { $sort: { timestamp: 1 } },
      ])
      .exec();
  }

  async getUserSignupGroupedByDay() {
    return this.userModel
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            usersSignup: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: {
              $toLong: {
                $divide: [
                  { $toLong: { $dateFromString: { dateString: '$_id' } } },
                  1000,
                ],
              },
            },
            usersSignup: 1,
          },
        },
        { $sort: { timestamp: 1 } },
      ])
      .exec();
  }

  async getUsersGroupedByLastActiveDate() {
    return this.userModel
      .aggregate([
        { $match: { lastActive: { $ne: null } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } },
            activeUsers: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: {
              $toLong: {
                $divide: [
                  { $toLong: { $dateFromString: { dateString: '$_id' } } },
                  1000,
                ],
              },
            },
            activeUsers: 1,
          },
        },
        { $sort: { timestamp: 1 } },
      ])
      .exec();
  }

  async getTotalRevenueByDay() {
    return this.paymentModel
      .aggregate([
        {
          $match: {
            platformFee: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            totalPlatformFee: { $sum: '$platformFee' },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: {
              $toLong: {
                $divide: [
                  { $toLong: { $dateFromString: { dateString: '$_id' } } },
                  1000,
                ],
              },
            },
            totalPlatformFee: 1,
          },
        },
        { $sort: { timestamp: 1 } },
      ])
      .exec();
  }

  async getTokenMetrics(query: TokenMetricsQueryDto) {
    const { year, month, week } = query;

    if (!year) throw new Error('Year is required.');

    let startDate: Date;
    let endDate: Date;
    let groupStage: any;
    let labelFormatter: (id: any) => string;
    let expectedPeriods: string[] = [];

    if (year && !month && !week) {
      startDate = moment().year(+year).startOf('year').toDate();
      endDate = moment().year(+year).endOf('year').toDate();

      groupStage = {
        $group: {
          _id: { $month: '$createdAt' },
          minted: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'mint'] }, '$tokensCount', 0],
            },
          },
          burned: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'burn'] }, '$tokensCount', 0],
            },
          },
        },
      };

      labelFormatter = (id) =>
        moment()
          .month(id - 1)
          .format('MMM');
      expectedPeriods = Array.from({ length: 12 }, (_, i) =>
        moment().month(i).format('MMM'),
      );
    } else if (year && month && !week) {
      const monthIndex = +month - 1;
      startDate = moment()
        .year(+year)
        .month(monthIndex)
        .startOf('month')
        .toDate();
      endDate = moment().year(+year).month(monthIndex).endOf('month').toDate();

      groupStage = {
        $group: {
          _id: {
            $ceil: { $divide: [{ $dayOfMonth: '$createdAt' }, 7] }, // Week index in month
          },
          minted: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'mint'] }, '$tokensCount', 0],
            },
          },
          burned: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'burn'] }, '$tokensCount', 0],
            },
          },
        },
      };

      const daysInMonth = moment(startDate).daysInMonth();
      const numWeeks = Math.ceil(daysInMonth / 7);
      expectedPeriods = Array.from(
        { length: numWeeks },
        (_, i) => `Week ${i + 1}`,
      );
      labelFormatter = (id) => `Week ${id}`;
    } else if (year && month && week) {
      const monthIndex = +month - 1;
      const baseDate = moment().year(+year).month(monthIndex).startOf('month');
      const weekStart = baseDate
        .clone()
        .add(+week - 1, 'weeks')
        .startOf('isoWeek');
      const weekEnd = baseDate
        .clone()
        .add(+week - 1, 'weeks')
        .endOf('isoWeek');

      startDate = weekStart.toDate();
      endDate = weekEnd.toDate();

      groupStage = {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          minted: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'mint'] }, '$tokensCount', 0],
            },
          },
          burned: {
            $sum: {
              $cond: [{ $eq: ['$actionStatus', 'burn'] }, '$tokensCount', 0],
            },
          },
        },
      };

      labelFormatter = (id) => id;

      const dayCursor = moment(weekStart);
      while (dayCursor.isSameOrBefore(weekEnd)) {
        expectedPeriods.push(dayCursor.format('YYYY-MM-DD'));
        dayCursor.add(1, 'day');
      }
    } else {
      throw new Error('Invalid combination of year/month/week.');
    }

    const matchStage = {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    };

    const sortStage = { $sort: { _id: 1 as const } };

    const pipeline = [matchStage, groupStage, sortStage];

    const results = await this.assetHistoryModel.aggregate(pipeline);

    const resultMap = new Map<string, { minted: number; burned: number }>();
    results.forEach((item) => {
      const label = labelFormatter(item._id);
      resultMap.set(label, {
        minted: item.minted,
        burned: item.burned,
      });
    });

    const finalData = expectedPeriods.map((period) => ({
      period,
      minted: resultMap.get(period)?.minted || 0,
      burned: resultMap.get(period)?.burned || 0,
    }));

    return { data: finalData };
  }
}
