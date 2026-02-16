export interface BaseActivityStats {
  userId: string;
  count: number;
  lastActive: Date;
}

export interface EnhancedActivityStats extends BaseActivityStats {
  username: string;
  actions: number;
  type: string;
}
