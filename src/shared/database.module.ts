import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomLoggerService } from 'src/shared-kernel/custom-logger/custom-logger.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new CustomLoggerService('Database');
        return {
          uri: configService.get<string>('MONGODB_URI'),
          replicaSet: configService.get<string>('MONGODB_REPLICA_SET'),
          wtimeoutMS: 5000,
          maxPoolSize: 10,
          minPoolSize: 2,
          socketTimeoutMS: 30000,
          serverSelectionTimeoutMS: 5000,
          heartbeatFrequencyMS: 10000,
          monitorCommands: true,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connected successfully');
            });
            connection.on('disconnected', () => {
              logger.log('MongoDB disconnected');
            });
            connection.on('error', (error) => {
              logger.error('MongoDB connection error:', error);
            });
            connection.on('commandStarted', (event) => {
              logger.log('MongoDB command started:', event.commandName);
            });
            connection.on('commandSucceeded', (event) => {
              logger.log('MongoDB command succeeded:', event.commandName);
            });
            connection.on('commandFailed', (event) => {
              logger.error('MongoDB command failed:', event.commandName);
            });
            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
