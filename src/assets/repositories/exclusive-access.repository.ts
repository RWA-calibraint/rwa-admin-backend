import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model, PopulateOptions, RootFilterQuery } from 'mongoose';

import {
  ExclusiveAccess,
  ExclusiveAccessDocument,
} from 'src/assets/schemas/exclusive-access.schema';

export class ExclusiveAccessRepository {
  constructor(
    @InjectModel(ExclusiveAccess.name)
    private readonly exclusiveAccessModel: Model<ExclusiveAccessDocument>,
  ) {}

  async create(
    userId: mongoose.Types.ObjectId,
    assetId: mongoose.Types.ObjectId,
  ) {
    const exclusiveAccess = new this.exclusiveAccessModel({ userId, assetId });
    return exclusiveAccess.save();
  }

  async find(
    query: RootFilterQuery<ExclusiveAccessDocument>,
  ): Promise<ExclusiveAccess | null> {
    return this.exclusiveAccessModel.findOne(query);
  }

  async findAll(
    query: RootFilterQuery<ExclusiveAccessDocument>,
    populateQuery?: PopulateOptions | (PopulateOptions | string)[] | undefined,
  ) {
    return this.exclusiveAccessModel.find(query).populate(populateQuery);
  }
}
