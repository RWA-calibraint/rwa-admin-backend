import { InjectModel } from '@nestjs/mongoose';

import {
  FilterQuery,
  Model,
  RootFilterQuery,
  SortOrder,
  UpdateResult,
} from 'mongoose';

import { User, UserDocument } from 'src/users/schemas/user.schema';
import { paginate } from 'src/utils/pagination.utils';

export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}
  async updateUserData(
    userDetails: Partial<User>,
    userId: string,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne({ userId }, userDetails, { new: true });
  }

  async findOneAndUpdate(
    userDetails: Partial<User>,
    userId: string,
  ): Promise<UserDocument> {
    return this.userModel.findOneAndUpdate({ userId }, userDetails, {
      new: true,
    });
  }

  async findUser(userId: string): Promise<User | null> {
    return this.userModel.findOne({ userId });
  }

  async findAllUsers(
    query: FilterQuery<User>,
    page: number,
    sort:
      | string
      | { [key: string]: SortOrder | { $meta: any } }
      | [string, SortOrder][]
      | undefined
      | null,
    limit = 10,
  ) {
    return paginate(this.userModel, page, limit, query, sort);
  }

  async countUsers(query: FilterQuery<User>): Promise<number> {
    return this.userModel.countDocuments(query);
  }

  async findAll(
    query: RootFilterQuery<UserDocument>,
  ): Promise<UserDocument[] | []> {
    return this.userModel.find(query);
  }

  async useAggregation(aggregate) {
    return this.userModel.aggregate(aggregate);
  }
}
