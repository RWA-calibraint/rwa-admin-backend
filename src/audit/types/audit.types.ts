export interface IAuditFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface IAuditSummaryResult {
  _id: string;
  actions: Array<{
    action: string;
    count: number;
  }>;
  total: number;
}

export interface IAuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface IAuditQueryResult {
  results: IAuditLogEntry[];
  pagination: IPaginationResult;
}

export type IAuditExportFilters = Pick<
  IAuditFilters,
  'startDate' | 'endDate' | 'resourceType'
>;
