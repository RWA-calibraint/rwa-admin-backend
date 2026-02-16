import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Admin, AdminSchema } from '../../admins/schema/admin.schema';

import { SuperAdminSeeder } from './admin.seed';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
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
            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  providers: [SuperAdminSeeder],
  exports: [SuperAdminSeeder],
})
export class SeederModule {}
