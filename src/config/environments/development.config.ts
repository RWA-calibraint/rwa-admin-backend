export default () => ({
  environment: 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rwa-admin-dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'rwa-dev-bucket',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },

  email: {
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'noreply@rwa.com',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: 'dev',
    file: {
      enabled: true,
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    },
  },

  api: {
    prefix: '/api',
    version: 'v1',
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
  },

  swagger: {
    title: 'RWA Admin API',
    description: 'RWA Admin Backend API Documentation',
    version: '1.0',
    path: 'api-docs',
  },

  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  security: {
    bcryptSaltRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
});
