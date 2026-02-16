export interface DashboardMetrics {
  pendingApprovals: number;
  approvedAssets: number;
  rejectedAssets: number;
  totalUsers: number;
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

export interface DashboardResponse {
  metrics: DashboardMetrics;
  assetCategories: AssetCategoryMetrics;
  assetsSold: AssetsSoldMetrics;
  userManagement: UserManagementMetrics;
  userGrowth: UserGrowthMetrics;
  lastUpdated: Date;
}
