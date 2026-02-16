import { InjectModel } from '@nestjs/mongoose';

import { Model, PipelineStage, RootFilterQuery } from 'mongoose';

import { Token, TokenDocument } from '../schemas/token.schema';

export class TokenRepository {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async findAllTokenTransactions(pipeline: PipelineStage[]) {
    return this.tokenModel.aggregate(pipeline);
  }

  async getTotalCount(query: RootFilterQuery<TokenDocument>) {
    return this.tokenModel.countDocuments(query);
  }
}
