import { existsSync, mkdirSync } from 'fs';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import express, { Express, json, urlencoded } from 'express';
import helmet from 'helmet';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

import { AppModule } from './app.module';

// Create Express app instance
const server: Express = express();

// Apply middleware to Express instance
server.use(helmet());
server.use(compression());
server.use(cookieParser());
server.use(json({ limit: '50mb' }));
server.use(urlencoded({ extended: true, limit: '50mb' }));

// Create Winston logger for serverless (console only, no file writes)
const createLogger = () => {
  return WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(), // JSON format for better Vercel logs
          nestWinstonModuleUtilities.format.nestLike(),
        ),
      }),
    ],
  });
};

// Create NestJS application
async function bootstrap() {
  const logger = createLogger();

  try {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger,
        bufferLogs: true,
      },
    );

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Set global prefix
    const prefix = process.env.ADMIN_BACKEND_PREFIX || 'api';
    app.setGlobalPrefix(prefix);

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('RWA Admin API')
      .setDescription('Real World Assets Admin Service API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // CORS configuration
    const allowedOrigins = process.env.DOMAINS
      ? process.env.DOMAINS.split(',').map((domain) => domain.trim())
      : ['*'];

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
      ],
      credentials: true,
    });

    // Create /tmp/uploads directory for file uploads (if needed)
    const uploadDir = '/tmp/uploads';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Initialize the app
    await app.init();

    logger.log('NestJS application initialized successfully');

    // For local development
    if (process.env.NODE_ENV !== 'production') {
      const port = process.env.PORT || 5000;
      await app.listen(port);
      logger.log(
        `Application is running on: http://localhost:${port}/${prefix}`,
      );
      logger.log(
        `Swagger docs available at: http://localhost:${port}/${prefix}/docs`,
      );
    }

    return app;
  } catch (error) {
    logger.error('Failed to start application', error);
    throw error;
  }
}

// Check if running in Vercel (serverless) or local environment
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Serverless: Initialize once and reuse
  bootstrap();
} else {
  // Local development: Traditional bootstrap
  bootstrap().catch((error) => {
    Logger.error('Failed to start application', error);
    process.exit(1);
  });
}

// Export Express app for Vercel
export default server;
