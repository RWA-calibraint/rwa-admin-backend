export interface AuditFilters {
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

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditSummaryResult {
  _id: string;
  actions: Array<{
    action: string;
    count: number;
  }>;
  total: number;
}

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AuditQueryResult {
  results: AuditLogEntry[];
  pagination: PaginationResult;
}

export type AuditExportFilters = Pick<
  AuditFilters,
  'startDate' | 'endDate' | 'resourceType'
>;
