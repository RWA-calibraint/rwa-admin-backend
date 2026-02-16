export interface BaseMetrics {
  total: number;
  timeline: TimelineData[];
}

export interface AssetMetrics extends BaseMetrics {
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
}
export interface ActivityStats {
  userId: string;
  username: string;
  count: number;
  lastActive: Date;
  actions: number;
  type: string;
}

export interface UserMetrics {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

export interface VerificationMetrics extends BaseMetrics {
  completed: number;
  pending: number;
  byVerifier: VerifierStats[];
  averageTime: number;
  timeline: TimelineData[];
}

export interface UserMetrics extends BaseMetrics {
  total: number;
  active: number;
  newRegistrations: number;
  activityStats: ActivityStats[];
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
  count: number;
  lastActive: Date;
}

export interface AnalyticsExport {
  exportedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  assets: AssetMetrics;
  verifications: VerificationMetrics;
  users: UserMetrics;
}

export interface AssetCategoryMetrics {
  art: number;
  collectibles: number;
  realEstate: number;
  memorabilia: number;
}

export interface AssetsSoldMetrics {
  total: number;
  value: number;
  growth: number;
}

export interface UserManagementMetrics {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
}

export interface UserGrowthMetrics {
  daily: number;
  year: number;
  current: number;
  previous: number;
}

export interface DashboardMetrics {
  pendingApprovals: number;
  approvedAssets: number;
  rejectedAssets: number;
  totalUsers: number;
}
