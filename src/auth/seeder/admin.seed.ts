import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Admin, AdminDocument } from '../../admins/schema/admin.schema';

@Injectable()
export class SuperAdminSeeder {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
  ) {}

  async seed() {
    console.log('Seeding Admin...');

    const superAdmin = [
      {
        firstName: 'Rare',
        lastName: 'Agora',
        email: 'rareagoraadmin@mailsac.com',
        cognitoSubId: 'b1e3bd7a-9031-7020-c49b-2de635bee9b2',
        isSuperAdmin: true,
      },
    ];

    await this.adminModel.insertMany(superAdmin);
    console.log('Super Admin seeded successfully!');
  }
}
