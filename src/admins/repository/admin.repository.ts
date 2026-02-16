import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Admin, AdminDocument } from 'src/admins/schema/admin.schema';

export class AdminRepository {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
  ) {}
  async create(adminDetails: Admin) {
    const adminCount = await this.adminModel.countDocuments();
    if (adminCount === 0) {
      adminDetails.isSuperAdmin = true;
    }
    const user = new this.adminModel(adminDetails);
    return user.save();
  }
  async find(email: string) {
    return this.adminModel.findOne({ email });
  }
  async update(userDetails: Partial<Admin>) {
    return this.adminModel.updateOne({ email: userDetails.email }, userDetails);
  }
  async findByCognitoId(email: string) {
    return this.adminModel.findOne({ email: email });
  }
}
