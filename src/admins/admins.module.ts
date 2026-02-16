import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminController } from 'src/admins/admins.controller';
import { AdminService } from 'src/admins/admins.service';
import { AdminRepository } from 'src/admins/repository/admin.repository';
import { Admin, AdminSchema } from 'src/admins/schema/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminRepository],
})
export class AdminModule {}
