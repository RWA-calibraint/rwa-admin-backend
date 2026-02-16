import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, SortOrder } from 'mongoose';

import { Audit, AuditDocument } from './schemas/audit.schema';
import {
  IAuditFilters,
  IAuditSummaryResult,
  IPaginationResult,
} from './types/audit.types';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(Audit.name)
    private readonly auditModel: Model<AuditDocument>,
  ) {}

  async createAuditLog(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    const audit = new this.auditModel({
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      metadata,
      timestamp: new Date(),
    });

    return audit.save();
  }

  async findAuditLogs(filters: IAuditFilters) {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = filters;

    const query: Record<string, any> = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, SortOrder> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [results, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditModel.countDocuments(query),
    ]);

    const pagination: IPaginationResult = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return { results, pagination };
  }

  async getAuditSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<IAuditSummaryResult[]> {
    return this.auditModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            action: '$action',
            resourceType: '$resourceType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.resourceType',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
            },
          },
          total: { $sum: '$count' },
        },
      },
    ]);
  }

  async exportAuditLogs(filters: {
    startDate: Date;
    endDate: Date;
    resourceType?: string;
  }) {
    const { startDate, endDate, resourceType } = filters;
    const query: any = {
      timestamp: { $gte: startDate, $lte: endDate },
    };
    if (resourceType) query.resourceType = resourceType;

    return this.auditModel.find(query).sort({ timestamp: -1 }).lean();
  }

  async getRecentActivityByUser(userId: string, limit = 5) {
    return this.auditModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async getResourceHistory(resourceType: string, resourceId: string) {
    return this.auditModel
      .find({ resourceType, resourceId })
      .sort({ timestamp: -1 })
      .lean();
  }
}
