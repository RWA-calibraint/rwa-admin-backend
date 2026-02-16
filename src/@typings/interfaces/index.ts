export * from './asset.interface';
export * from './auth.interface';
export * from './base.interface';
export * from './common.interface';
export * from './user.interface';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: Date;
  path: string;
}

export interface HealthCheck {
  status: string;
  info: Record<string, any>;
  error?: Record<string, any>;
  details: Record<string, any>;
}
