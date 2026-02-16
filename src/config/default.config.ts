import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: '/api',
  version: '1.0.0',

  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },

  security: {
    bcryptSaltRounds: 10,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: '1d',
  },
}));
