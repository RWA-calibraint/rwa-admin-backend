import { EnhancedActivityStats } from '../../shared/interfaces/activity.interface';

export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface DashboardMetrics {
  assets: AssetMetrics;
  verifications: VerificationMetrics;
  users: UserMetrics;
  trends: TrendMetrics;
}

export interface AssetMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
  timeline: TimelineData[];
}

export interface VerificationMetrics {
  total: number;
  completed: number;
  pending: number;
  byVerifier: VerifierStats[];
  averageTime: number;
}

export interface UserMetrics {
  total: number;
  active: number;
  newRegistrations: number;
  activityStats: EnhancedActivityStats[];
  timeline: TimelineData[];
}

export interface TrendMetrics {
  period: string;
  data: TimelineData[];
}

export interface TimelineData {
  date: string;
  count: number;
  type?: string;
}

export interface VerifierStats {
  verifierId: string;
  name: string;
  count: number;
  averageTime: number;
  lastVerification: Date;
}

export interface ActivityStats {
  userId: string;
  username: string;
  actions: number;
  lastActive: Date;
  type: string;
}

export interface DashboardQueryParams {
  startDate: Date;
  endDate: Date;
  periodType?: PeriodType;
  year?: number;
  filterBy?: string;
}

export interface DashboardExportData extends DashboardMetrics {
  exportedAt: Date;
  queryParams: DashboardQueryParams;
  generatedBy: string;
}
