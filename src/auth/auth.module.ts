import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Admin, AdminSchema } from 'src/admins/schema/admin.schema';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    SharedModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
