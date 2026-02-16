export interface SystemHealth {
  services: {
    auth: ServiceStatus;
    database: ServiceStatus;
    cache: ServiceStatus;
    notifications: ServiceStatus;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  lastChecked: Date;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastError?: string;
  metadata?: Record<string, any>;
}

export interface SystemConfig {
  maintenance: {
    enabled: boolean;
    startTime?: Date;
    endTime?: Date;
    message?: string;
  };
  security: {
    maxLoginAttempts: number;
    passwordExpiryDays: number;
    sessionTimeoutMinutes: number;
    requireTwoFactor: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    retentionDays: number;
  };
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface SystemMetrics {
  performance: {
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  };
  usage: {
    totalRequests: number;
    uniqueUsers: number;
    peakConcurrentUsers: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}
