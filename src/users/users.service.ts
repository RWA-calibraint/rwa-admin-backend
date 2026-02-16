import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import mongoose, { FilterQuery, Model, Types } from 'mongoose';

import { AssetStatus } from 'src/@typings/enums';
import { EMAIL_CONSTANTS } from 'src/assets/constants/email.messages';
import { Asset } from 'src/assets/schemas/asset.schema';
import { SendGridServices } from 'src/shared/services/send-grid/send-grid.service';
import { KycStatus } from 'src/shared-kernel/typings/status.enum';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { USER_STATUS } from 'src/shared-kernel/utils/constants/user-enums';
import { capitalizeFistLetter } from 'src/shared-kernel/utils/text-formatter';
import { USER_ERROR_MESSAGES } from 'src/users/constants/error-messages';
import { GetUserDto } from 'src/users/dto/get-user.dto';
import { SuspendUserDto } from 'src/users/dto/suspend-user.dto';
import { UpdateUserStatus } from 'src/users/dto/update-user-status.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UserRepository } from 'src/users/repository/user.repository';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Asset.name) private readonly assetModel: Model<Asset>,
    private readonly userRepository: UserRepository,
    private readonly sendGridServices: SendGridServices,
  ) {}

  async getAllUser({ search, status, page, size }: GetUserDto) {
    let query: FilterQuery<User> = { isVerified: true };

    if (status?.length)
      query = {
        ...query,
        status: { $in: status },
      };
    if (search)
      query = {
        ...query,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ],
      };

    return this.userRepository.findAllUsers(
      query,
      page,
      { createdAt: 1 },
      size,
    );
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(id));
    }
    return user;
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }

    Object.assign(user, updateUserDto);
    return user.save();
  }

  async getKycRequests(): Promise<User[]> {
    return this.userModel
      .find({
        kycStatus: { $in: [KycStatus.PENDING] },
      })
      .exec();
  }

  // TODO: Need to update this is in the future
  // async suspendUser(userId: string): Promise<User> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
  //   }

  //   user.accountStatus = AccountStatus.SUSPENDED;
  //   user.suspendedAt = new Date();
  //   return user.save();
  // }

  // async blockUser(userId: string): Promise<User> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
  //   }

  //   user.accountStatus = AccountStatus.BLOCKED;
  //   user.blockedAt = new Date();
  //   return user.save();
  // }

  // async activateUser(userId: string): Promise<User> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
  //   }

  //   user.accountStatus = AccountStatus.ACTIVE;
  //   user.suspendedAt = null;
  //   user.blockedAt = null;
  //   return user.save();
  // }

  // async updateKycStatus(userId: string, kycData: UpdateKycDto): Promise<User> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
  //   }

  //   user.kycStatus = kycData.status as KycStatus;
  //   user.kycRemarks = kycData.remarks;
  //   user.kycUpdatedAt = new Date();
  //   return user.save();
  // }

  async blockOrActivateUser(
    { status, description }: UpdateUserStatus,
    userId: string,
  ): Promise<User> {
    try {
      await this.validateUser(userId);
      const updatedUser = await this.userRepository.findOneAndUpdate(
        { status, suspendExpiryAt: null, description },
        userId,
      );

      if (status === USER_STATUS.TERMINATED) {
        await this.updateUserAsset(updatedUser._id, USER_STATUS.TERMINATED);
      } else if (status === USER_STATUS.ACTIVE) {
        await this.updateUserAsset(updatedUser._id, USER_STATUS.ACTIVE);
      }

      const { SUBJECT: emailSubject, TEMPLATE_FILE_KEY: templateFileKey } =
        status === USER_STATUS.TERMINATED
          ? EMAIL_CONSTANTS.USER.TERMINATED
          : EMAIL_CONSTANTS.USER.ACTIVATED;

      const emailBodyData = {
        userName: `${capitalizeFistLetter(updatedUser.firstName)} ${updatedUser.lastName}`,
        link: '',
      };

      await this.sendGridServices.sendMail(
        updatedUser.email,
        emailSubject,
        templateFileKey,
        emailBodyData,
      );

      return updatedUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async suspendUser(
    { suspendExpiryAt, description }: SuspendUserDto,
    userId: string,
  ): Promise<User> {
    try {
      if (suspendExpiryAt && suspendExpiryAt.getTime() <= Date.now()) {
        throw new HttpException(
          ERROR_MESSAGES.RESPONSES.USER.IN_VALID_DATE,
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.validateUser(userId);
      const updateData: Record<string, any> = { status: USER_STATUS.SUSPENDED };
      const addMilliseconds = 5.5 * 60 * 60 * 1000;

      if (suspendExpiryAt) {
        updateData.suspendExpiryAt = new Date(
          new Date(suspendExpiryAt).getTime() + addMilliseconds,
        );
      }

      const updatedUser = await this.userRepository.findOneAndUpdate(
        { ...updateData, description },
        userId,
      );

      await this.updateUserAsset(updatedUser._id, USER_STATUS.SUSPENDED);

      const { SUBJECT: emailSubject, TEMPLATE_FILE_KEY: templateFileKey } =
        EMAIL_CONSTANTS.USER.SUSPENDED;

      const emailBodyData = {
        userName: `${capitalizeFistLetter(updatedUser.firstName)} ${updatedUser.lastName}`,
        suspensionExpiryAt: updatedUser.suspendExpiryAt,
        link: '',
      };
      await this.sendGridServices.sendMail(
        updatedUser.email,
        emailSubject,
        templateFileKey,
        emailBodyData,
      );
      return updatedUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateUserAsset(
    userId: mongoose.Types.ObjectId,
    userStatus: USER_STATUS,
  ) {
    if (userStatus === USER_STATUS.ACTIVE) {
      return this.assetModel.updateMany(
        {
          sellerId: String(userId),
        },
        [
          {
            $set: {
              status: {
                $cond: {
                  if: { $eq: ['$status', AssetStatus.DELIST] },
                  then: {
                    $cond: {
                      if: { $eq: ['$sold', true] },
                      then: AssetStatus.SOLD,
                      else: AssetStatus.LIVE,
                    },
                  },
                  else: '$status',
                },
              },
            },
          },
        ],
      );
    } else {
      return this.assetModel.updateMany(
        {
          sellerId: String(userId),
        },
        [
          {
            $set: {
              status: {
                $cond: {
                  if: {
                    $in: ['$status', [AssetStatus.LIVE, AssetStatus.SOLD]],
                  },
                  then: AssetStatus.DELIST,
                  else: '$status',
                },
              },
            },
          },
        ],
      );
    }
  }

  async validateUser(userId: string): Promise<boolean> {
    const userExists = await this.userRepository.findUser(userId);
    if (!userExists) throw new Error(ERROR_MESSAGES.RESPONSES.USER.NOT_FOUND);
    return true;
  }

  async getUser(id: string) {
    const userId = new Types.ObjectId(id);
    const [result] = await this.userRepository.useAggregation([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: 'payments',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$buyerId', '$$userId'] } } },
            { $count: 'total' },
          ],
          as: 'transactions',
        },
      },
      {
        $addFields: {
          transactions: {
            $ifNull: [{ $arrayElemAt: ['$transactions.total', 0] }, 0],
          },
        },
      },
    ]);
    return result;
  }

  async updateUserFeedback(feedbackData) {
    return await this.userRepository.findOneAndUpdate(
      {
        description: feedbackData?.feedback,
      },
      feedbackData?.userId,
    );
  }

  /*
  Cron for checking the suspended user and activate if suspension period expires.
  */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkTheUserSuspension() {
    try {
      const today = new Date().setHours(0, 0, 0, 0);

      const suspendedUsers = await this.userRepository.findAll({
        status: USER_STATUS.SUSPENDED,
        suspendExpiryAt: {
          $ne: null,
          $lte: today,
        },
      });
      if (suspendedUsers?.length > 0) {
        await Promise.all(
          suspendedUsers.map(async ({ userId }: UserDocument) => {
            this.userRepository.updateUserData(
              { status: USER_STATUS.ACTIVE, suspendExpiryAt: null },
              String(userId),
            ),
              await this.updateUserAsset(
                new Types.ObjectId(userId),
                USER_STATUS.ACTIVE,
              );
          }),
        );

        Logger.log(
          `Suspended users activated successfully for the dates before  ${new Date(today)} `,
        );
      } else
        Logger.log(
          `There was no user under suspension before dates- ${new Date(today)} `,
        );
    } catch (error) {
      Logger.error('Error in the activating the user under suspension');
    }
  }
}
