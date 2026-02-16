import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

import { DashboardService } from './dashboard.service';
import {
  DashboardQueryDto,
  TokenMetricsQueryDto,
} from './dto/dashboard-query.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(ThrottlerGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('user/status/metrics')
  @ApiOperation({ summary: 'Get User dashboard metrics' })
  @ApiQuery({
    name: 'year',
    type: String,
    required: false,
    description: 'The year for which to fetch metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user metrics for the specified year',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTotalUserMetricsDashboard() {
    try {
      const result = await this.dashboardService.getTotalUserMetricsByStatus();
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('user/count/metrics')
  @ApiOperation({ summary: 'Get User status dashboard metrics' })
  @ApiQuery({
    name: 'year',
    type: String,
    required: false,
    description: 'The year for which to fetch metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user status metrics for all the year',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTotalUserCountMetricsDashboard(@Query('year') year: string) {
    try {
      const result =
        await this.dashboardService.getTotalUserMetricsByYear(year);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('asset/category')
  @ApiOperation({ summary: 'Get Asset category dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns asset category metrics' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTotalAssetMetricsDashboard() {
    try {
      const response =
        await this.dashboardService.getTotalAssetMetricsByCategory();
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('asset/count/metrics')
  @ApiOperation({ summary: 'Get Asset count dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns asset count metrics' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getAssetCountDashboard() {
    try {
      const result = await this.dashboardService.getAssetCountDashboard();
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('asset/sold/metrics')
  @ApiOperation({ summary: 'Get sold asset dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns asset sold metrics' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTotalAssetsSoldMetrics(
    @Query('category') AssetCategory,
    @Query('year') year,
  ) {
    try {
      const result = await this.dashboardService.getTotalAssetSoldDashboard(
        AssetCategory,
        year,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  private validateDateRange(query: DashboardQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    if (endDate > new Date()) {
      throw new Error('End date cannot be in the future');
    }

    return { startDate, endDate };
  }

  @Get('/tokens/metrics')
  @ApiOperation({ summary: 'Get token metrics for chart visualization' })
  @ApiResponse({
    status: 200,
    description: 'Returns token metrics with asset details',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid timeframe parameter',
  })
  async getTokenMetrics(@Query() query: TokenMetricsQueryDto) {
    try {
      const result = await this.dashboardService.getTokenMetrics(query);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
