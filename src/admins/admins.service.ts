import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { CognitoService } from 'src/shared-kernel/utils/services/aws/cognito.service';

import { Admin, AdminDocument } from './schema/admin.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly cognitoService: CognitoService,
  ) {}
  async getAdminProfile(_id) {
    return await this.adminModel.findOne({ _id });
  }

  async updateAdminProfile(updatedData, user) {
    const { updateType, adminProfile } = updatedData;
    const { _id, email } = user;

    if (updateType === 'update_name') {
      return await this.adminModel.updateOne(
        { _id },
        {
          $set: {
            firstName: adminProfile.firstName,
            lastName: adminProfile.lastName,
          },
        },
      );
    } else if (updateType === 'update_email') {
      try {
        await this.cognitoService.signin({
          email: email,
          password: adminProfile.password,
        });

        if (email === adminProfile.newEmail) {
          throw new BadRequestException(
            'New email should not be same as current email',
          );
        }

        await this.cognitoService.changeEmail(email, adminProfile.newEmail);
        return await this.adminModel.updateOne(
          { _id },
          { $set: { email: adminProfile.newEmail } },
        );
      } catch (error) {
        throw new Error('Password does not match');
      }
    } else if (updateType === 'update_password') {
      try {
        const authAccessResponse = await this.cognitoService.signin({
          email: email,
          password: adminProfile.currentPassword,
        });
        if (adminProfile.newPassword !== adminProfile.confirmPassword) {
          throw new Error('New Password does not match with confirm password');
        }
        if (adminProfile.newPassword === adminProfile.currentPassword) {
          throw new BadRequestException(
            'New password should not be same as current password',
          );
        }
        const accessToken = authAccessResponse.AuthenticationResult.AccessToken;
        return await this.cognitoService.resetPassword(
          accessToken,
          adminProfile.currentPassword,
          adminProfile.newPassword,
        );
      } catch (error) {
        if (error.message.includes('proposedPassword')) {
          throw new Error(
            'Password did not conform with policy: Password not long enough',
          );
        }
        throw new Error(error.message);
      }
    }
  }

  async getAllAdmins(filters) {
    const page = filters['page'];
    const size = filters['size'];
    const matchQuery = {};
    const skip = (parseInt(page || '1') - 1) * parseInt(size || '10');

    if (filters['search']) {
      matchQuery['fullName'] = { $regex: filters['search'], $options: 'i' };
    }

    const [result] = await this.adminModel.aggregate([
      {
        $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } },
      },
      { $match: matchQuery },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(size || '10') }],
          total: [{ $count: 'count' }],
        },
      },
      { $unwind: { path: '$total', preserveNullAndEmptyArrays: true } },
      { $project: { data: 1, total: '$total.count' } },
    ]);
    return result;
  }

  async deleteAdmin(_id) {
    const adminProfile = await this.getAdminProfile(_id);
    await this.cognitoService.deleteUser(adminProfile?.cognitoSubId);
    return await this.adminModel.deleteOne({ _id });
  }
}
