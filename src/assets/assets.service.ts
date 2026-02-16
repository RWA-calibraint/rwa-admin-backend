import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import axios from 'axios';
import mongoose, { FilterQuery, Model, Types } from 'mongoose';
import sharp from 'sharp';

import { AssetStatus } from 'src/@typings/enums';
import { ArweaveService } from 'src/arweave/arweave.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TokenRepository } from 'src/payments/repository/token.repository';
import { encryptPdfWithPassword } from 'src/shared/services/pdf-encrypt/pdf-encrypt';
import { S3Service } from 'src/shared/services/S3/s3.service';
import { SendGridServices } from 'src/shared/services/send-grid/send-grid.service';
import { NOTIFICATION_TEMPLATE } from 'src/shared-kernel/utils/constants/notification-templates';
import { DynamicTimeoutsService } from 'src/shared-kernel/utils/dynamic-timeout/dynamic-timeout';
import { capitalizeFistLetter } from 'src/shared-kernel/utils/text-formatter';
import { User } from 'src/users/schemas/user.schema';
import {
  constructErrorResponse,
  constructSuccessResponse,
  getAssetStatus,
} from 'src/utils/helper';
import {
  calculateMotionBlur,
  calculateOverallScore,
  calculateSharpness,
  determineQualityLevel,
  estimateImageNoise,
  getQualityRecommendation,
  supportedFormats,
} from 'src/utils/utilities';

import { EMAIL_CONSTANTS } from './constants/email.messages';
import { ASSET_ERROR_MESSAGES } from './constants/error-messages';
import { AssetFilterDto } from './dto/asset-filter.dto';
import { CreateAssetDto, DocumentInterface } from './dto/create-asset.dto';
import { UploadDocumentDto } from './dto/create-document.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { VerifyAssetDto } from './dto/verify-asset.dto';
import {
  documentReportStatus,
  ValidateDocumentDto,
} from './dto/verify-document.dto';
import { ExclusiveAccessRepository } from './repositories/exclusive-access.repository';
import { AssetHistory } from './schemas/asset-history.schema';
import {
  AssetListing,
  AssetListingDocument,
} from './schemas/asset-listing.schema';
import { Asset, AssetDocument } from './schemas/asset.schema';
import { AssetCategory } from './schemas/category.schema';
import { Document } from './schemas/document.schema';
import { PriceHistory } from './schemas/price-history.schema';
import { Token, TokenDocument } from './schemas/token.schema';
import { WishlistAsset } from './schemas/wishlistAsset.schema';
import {
  AssetWithDocuments,
  ImageMetadata,
  ImageQualityMetrics,
} from './types';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Document.name)
    private readonly documentModel: Model<Document>,
    @InjectModel(AssetCategory.name)
    private readonly assetCategoryModel: Model<AssetCategory>,
    @InjectModel(AssetHistory.name)
    private readonly assetHistoryModel: Model<AssetHistory>,
    @InjectModel(PriceHistory.name)
    private readonly priceHistoryModel: Model<PriceHistory>,
    @InjectModel(WishlistAsset.name)
    private readonly wishlistAssetModel: Model<WishlistAsset>,
    @InjectModel(AssetListing.name)
    private readonly assetListingModel: Model<AssetListingDocument>,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
    private readonly sendGridServices: SendGridServices,
    private readonly s3Service: S3Service,
    private readonly exclusiveAccessRepository: ExclusiveAccessRepository,
    private readonly dynamicTimeoutService: DynamicTimeoutsService,
    private readonly tokenRepository: TokenRepository,
    private readonly notificationService: NotificationsService,
    private readonly arweaveService: ArweaveService,
    private blockchainService: BlockchainService,
    private readonly configService: ConfigService,
  ) {}

  async create(assetDto: CreateAssetDto, coverImage, images, userId) {
    const cover = await this.s3Service.uploadFile(
      coverImage.path,
      coverImage?.mimetype,
    );
    const uploadedImages = await Promise.all(
      images?.map((image) =>
        this.s3Service.uploadFile(image.path, image?.mimetype),
      ) || [],
    );

    const priceHistory = assetDto.priceHistory
      ? JSON.parse(assetDto.priceHistory)
      : [];

    const assetDbData: Partial<Asset> = {
      ...assetDto,
      price: Number(assetDto.price),
      category: new mongoose.Types.ObjectId(assetDto.category),
      listedDate: assetDto.listedDate as unknown as Date,
      coverImage: cover,
      images: uploadedImages,
      sellerId: userId,
      isAdminAsset: true,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const listedDate = assetDto.listedDate;
    listedDate.setDate(listedDate.getDate() + 1);
    listedDate.setHours(0, 0, 0, 0);

    if (listedDate.getTime() === today.getTime()) {
      assetDbData.status = AssetStatus.LIVE;
    } else if (listedDate.getTime() > today.getTime()) {
      assetDbData.status = AssetStatus.GOING_LIVE;
      assetDbData.isVerified = true;
      assetDbData.verifiedBy = userId;
    }

    const asset = new this.assetModel(assetDbData);
    const createdAsset: AssetDocument = await asset.save();
    await Promise.all(
      Object.entries(assetDto.documents).flatMap(([key, documents]) =>
        documents.map(({ name, url }: DocumentInterface) =>
          new this.documentModel({
            assetId: createdAsset?.assetId,
            type: key,
            documentName: name,
            documentUrl: url,
          }).save(),
        ),
      ),
    );

    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      const newPriceHistory = priceHistory.map((priceData) => ({
        ...priceData,
        assetId: createdAsset?.assetId,
      }));
      await this.priceHistoryModel.insertMany(newPriceHistory);
    }

    // await this.createArweaveConfig(asset);
    this.dynamicTimeoutService.addDynamicTimeouts(
      this.createExclusiveAssetNotificationTimerName(
        createdAsset._id as string,
      ),
      new Date(createdAsset.listedDate).getMilliseconds(),
      function () {
        this.exclusiveAssetNotification(createdAsset);
      }.bind(this),
    );
    return createdAsset;
  }

  private async createArweaveConfig(asset: AssetDocument): Promise<void> {
    await this.uploadToArweaveAndUpdateAsset(asset);

    const seller = await this.userModel.findById(asset.sellerId);
    const walletAddress = seller?.walletAddress;

    if (!walletAddress) throw new Error('Wallet address missing');
    await this.mintAndListAsset(asset.assetId);
  }

  private async uploadToArweaveAndUpdateAsset(
    asset: AssetDocument,
  ): Promise<AssetDocument> {
    const documents = await this.documentModel
      .find({ assetId: asset.assetId })
      .lean();

    const arweaveLinks = await this.arweaveService.publishAssetToArweave(
      asset.assetId,
      asset,
      documents,
    );

    asset.arweaveImageUrl = arweaveLinks.imageUrl;
    asset.arweaveDocumentUrls = arweaveLinks.documentUrls;
    asset.arweaveMetadataUrl = arweaveLinks.metadataUrl;

    await asset.save();

    return asset;
  }

  private async mintAssetToken(
    asset: AssetDocument,
    walletAddress: string,
  ): Promise<{
    tokenId: string;
    tokenAssetId: string;
    transactionUrl: string;
  }> {
    const metadata = await axios
      .get(asset.arweaveMetadataUrl)
      .then((res) => res.data)
      .catch(() => ({
        name: asset.name,
        description: asset.arweaveMetadataUrl,
      }));
    return await this.blockchainService.mintToken(
      walletAddress,
      asset.arweaveMetadataUrl,
      metadata.name || asset.name || 'Unnamed Asset',
      metadata.description || asset.arweaveMetadataUrl,
      (asset.tokens || 1) * 1000000,
      asset.tokens || 1,
      asset.assetId,
      walletAddress,
    );
  }

  private async createAssetListing(
    asset: AssetDocument,
    walletAddress: string,
    tokenId: string,
    tokenAssetId: string,
  ): Promise<{
    listingId: string;
    transactionUrl: string;
    initialSeller: string;
  }> {
    const collectionId = this.configService.get('COLLECTION_ID');
    const pricePerToken = Math.round((asset.price / asset.tokens) * 10 ** 6);

    return await this.blockchainService.createListing(
      collectionId,
      tokenId,
      tokenAssetId,
      tokenAssetId,
      asset.tokens || 1,
      pricePerToken,
      walletAddress,
    );
  }

  async mintAndListAsset(assetId: string): Promise<void> {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }

    const seller = await this.userModel.findById(asset.sellerId);
    const walletAddress = seller?.walletAddress;
    if (!walletAddress)
      throw new BadRequestException('Seller has not connected a wallet');

    if (!asset.arweaveMetadataUrl) {
      await this.uploadToArweaveAndUpdateAsset(asset);
    }
    let mintResult;
    if (asset.contractTokenId && asset.tokenAssetId) {
      mintResult = {
        tokenId: asset.contractTokenId,
        tokenAssetId: asset.tokenAssetId,
      };
    } else {
      mintResult = await this.mintAssetToken(asset, walletAddress);
      await this.assetModel.updateOne(
        { assetId: asset.assetId },
        {
          $set: {
            contractTokenId: mintResult.tokenId,
            tokenAssetId: mintResult.tokenAssetId,
            transactionUrl: mintResult.transactionUrl,
          },
        },
      );
      asset.tokenAssetId = mintResult.tokenAssetId;
    }
    let listingResult;
    if (asset.ContractListingId) {
      listingResult = {
        ContractListingId: asset.ContractListingId,
      };
    } else {
      listingResult = await this.createAssetListing(
        asset,
        walletAddress,
        mintResult.tokenId,
        mintResult.tokenAssetId,
      );

      asset.ContractListingId = listingResult.listingId;
      asset.listingTransactionUrl = listingResult.transactionUrl;
      asset.initialSeller = listingResult.initialSeller;
    }
    await asset.save();
  }

  async createDocument(
    file: Express.Multer.File,
    documentDto: UploadDocumentDto,
  ) {
    try {
      let filePathToUpload = file.path;

      if (documentDto.password && file.mimetype === 'application/pdf') {
        filePathToUpload = await encryptPdfWithPassword(
          filePathToUpload,
          documentDto.password,
        );
      }
      const result = await this.s3Service.uploadFile(
        filePathToUpload,
        file?.mimetype,
      );
      const response = {
        documentS3URL: result,
      };
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  async exclusiveAssetNotification({ name, coverImage, _id }: AssetDocument) {
    try {
      const { SUBJECT: emailSubject, TEMPLATE_FILE_KEY: templateFileKey } =
        EMAIL_CONSTANTS.ASSET.FEATURE_ASSET;

      const exclusivelyAccessedUsers =
        await this.exclusiveAccessRepository.findAll(
          {
            assetId: _id,
          },
          {
            path: 'userId',
          },
        );

      const notifications = exclusivelyAccessedUsers.map((userDetails) => {
        return {
          receiverId: userDetails.userId,
          message: NOTIFICATION_TEMPLATE.ASSET.userExclusiveAsset(name),
        };
      });
      await this.notificationService.sendExclusiveAccessNotification(
        notifications,
      );
      await Promise.all(
        exclusivelyAccessedUsers.map((userDetails) => {
          const { firstName, lastName, email } =
            userDetails.userId as unknown as User;
          const emailBodyData = {
            userName: `${capitalizeFistLetter(firstName)} ${lastName}`,
            assetName: capitalizeFistLetter(name),
            assetImage: coverImage,
            link: '',
          };
          return this.sendGridServices.sendMail(
            email,
            emailSubject,
            templateFileKey,
            emailBodyData,
          );
        }),
      );
    } catch (error) {
      Logger.error(
        `Error in the sending exclusive asset notification mail`,
        error,
      );
    }
  }

  createExclusiveAssetNotificationTimerName(assetId: string) {
    return `exclusiveAsset-${assetId}`;
  }
  async updateAsset(
    assetId: string,
    assetDto: UpdateAssetDto,
    coverImage,
    images,
  ) {
    const assetDetail = await this.assetModel.findOne({
      assetId,
    });
    if (!assetDetail) {
      throw new BadRequestException({ message: 'Asset not found' });
    }
    if (coverImage?.length > 0) {
      const cover = await this.s3Service.uploadFile(
        coverImage[0].path,
        coverImage[0]?.mimetype,
      );
      assetDto['coverImage'] = cover;
    }
    if (images?.length > 0) {
      const uploadedImages = await Promise.all(
        images.map((image) =>
          this.s3Service.uploadFile(image.path, image?.mimetype),
        ),
      );
      assetDto.images = uploadedImages;
    }
    const priceHistory = assetDto.priceHistory
      ? JSON.parse(assetDto.priceHistory)
      : [];
    const assetDocuments = assetDto.documents;
    delete assetDto['documents'];
    await this.assetModel.updateOne({ assetId }, { $set: assetDto });

    if (Object.keys(assetDocuments).length > 0) {
      const newDocumentEntries = new Set<string>();

      const bulkOperations = Object.entries(assetDocuments).flatMap(
        ([type, documents]) =>
          documents.map(({ name, url }: DocumentInterface) => {
            const uniqueKey = `${name}_${type}`;
            newDocumentEntries.add(uniqueKey);

            return {
              updateOne: {
                filter: { assetId, documentName: name, type },
                update: {
                  $set: {
                    type,
                    documentUrl: url,
                  },
                },
                upsert: true,
              },
            };
          }),
      );
      await Promise.all([
        this.documentModel.deleteMany({
          assetId,
          $expr: {
            $not: {
              $in: [
                { $concat: ['$documentName', '_', '$type'] },
                Array.from(newDocumentEntries),
              ],
            },
          },
        }),
        this.documentModel.bulkWrite(bulkOperations),
      ]);
    }

    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      await this.priceHistoryModel.deleteMany({ assetId });
      const newPriceHistory = priceHistory.map((data) => ({
        ...data,
        assetId,
      }));
      await this.priceHistoryModel.insertMany(newPriceHistory);
    }
    return {
      message: 'Asset updated successfully',
    };
  }

  async findOne(assetId: string): Promise<AssetWithDocuments | null> {
    const documents = await this.documentModel
      .find({ assetId }, 'type documentUrl documentName assetId status')
      .lean();
    const priceHistory = await this.priceHistoryModel
      .find({ assetId }, 'year price')
      .lean();
    const assetDetail = await this.assetModel
      .findOne({ assetId })
      .populate(['category', 'sellerId'])
      .lean();

    if (!assetDetail) return null;

    const soldTokens = await this.tokenRepository.getTotalCount({
      assetId: assetDetail._id,
    });

    const likesCount = await this.wishlistAssetModel.countDocuments({
      assetId: assetDetail._id as Types.ObjectId,
    });

    const asset = await this.assetModel
      .findById(assetDetail._id as Types.ObjectId)
      .select('viewedBy');
    const viewsCount = asset?.viewedBy.length;
    assetDetail.isAdminAsset = !assetDetail?.sellerId;

    const listings = await this.assetListingModel
      .find({
        assetId: assetDetail._id,
        deletedAt: null,
      })
      .populate('sellerId');

    const activity = await this.assetListingModel
      .find({
        assetId: assetDetail._id,
      })
      .populate('sellerId');

    const assetTokens = await this.tokenModel
      .find({ assetId: assetDetail._id })
      .sort({ createdAt: 1 })
      .populate('buyerId', 'firstName')
      .lean<
        Array<{
          buyerId: {
            _id: mongoose.Types.ObjectId;
            firstName: string;
          };
          createdAt: Date;
        }>
      >();

    const assetOwners = assetTokens.reduce(
      (acc, token) => {
        const buyerId = token.buyerId._id.toString();

        if (!acc[buyerId]) {
          acc[buyerId] = {
            name: token.buyerId.firstName || 'Unknown',
            tokenCount: 0,
            purchasedDate: token.createdAt.toISOString(),
          };
        }

        acc[buyerId].tokenCount++;
        return acc;
      },
      {} as Record<
        string,
        { name: string; tokenCount: number; purchasedDate: string }
      >,
    );

    return {
      ...assetDetail,
      _id: (assetDetail._id as Types.ObjectId).toString(),
      documents,
      soldTokens,
      priceHistory,
      viewsCount,
      likesCount,
      listings,
      assetOwners: Object.values(assetOwners),
      listingActivity: activity,
    };
  }

  async findAll(filter: FilterQuery<AssetDocument> = {}): Promise<Asset[]> {
    return this.assetModel.find(filter).exec();
  }

  async update(id: string, updateData: Partial<Asset>): Promise<Asset> {
    const asset = await this.assetModel
      .findByIdAndUpdate(
        id,
        { $set: updateData } as FilterQuery<AssetDocument>,
        { new: true },
      )
      .exec();

    if (!asset) {
      throw new NotFoundException(ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(id));
    }
    return asset;
  }

  async findAssetsByStatus(assetStatus: string, query: AssetFilterDto) {
    const filter: any = {
      deletedAt: null,
    };
    const statusOrder = getAssetStatus(assetStatus);

    if (query.status) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : query.status?.split(',') || [];
      filter.status = { $in: statuses };
    } else {
      filter.status = { $in: getAssetStatus(assetStatus) };
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      const categoryIds = Array.isArray(query.category)
        ? query.category
        : query.category.split(',');
      if (categoryIds.length) {
        filter.category = { $in: categoryIds };
      }
      filter.category = { $in: categoryIds };
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const sortObject: any = {
      createdAt: -1,
    };

    if (assetStatus === AssetStatus.PENDING.toLowerCase()) {
      sortObject.status = {
        $in: [
          AssetStatus.NEWLY_ADDED,
          AssetStatus.RESUBMISSION,
          AssetStatus.HOLD,
          AssetStatus.DELIST,
          AssetStatus.SUBMISSION,
        ],
      };
    } else if (assetStatus === AssetStatus.APPROVED.toLowerCase()) {
      sortObject.status = {
        $in: [
          AssetStatus.LIVE,
          AssetStatus.RESUBMISSION,
          AssetStatus.GOING_LIVE,
          AssetStatus.SOLD,
        ],
      };
    }

    const [result] = await this.assetModel.aggregate([
      {
        $match: filter,
      },
      {
        $addFields: {
          sellerIdObj: {
            $convert: {
              input: '$sellerId',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
          categoryObj: {
            $convert: {
              input: '$category',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sellerIdObj',
          foreignField: '_id',
          as: 'sellerId',
        },
      },
      {
        $unwind: {
          path: '$sellerId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'assetcategories',
          localField: 'categoryObj',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
          ],
          totalCount: [{ $count: 'total' }],
        },
      },
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ['$totalCount.total', 0] }, 0] },
          page: query.page,
          limit: query.limit,
        },
      },
      {
        $addFields: {
          totalPages: {
            $ceil: { $divide: ['$total', query.limit] },
          },
        },
      },
      {
        $project: {
          data: 1,
          total: 1,
          page: 1,
          limit: 1,
          totalPages: 1,
        },
      },
    ]);

    const finalData = result.data.sort((a: any, b: any) => {
      const indexA = statusOrder.indexOf(a.status);
      const indexB = statusOrder.indexOf(b.status);
      return indexA - indexB;
    });
    const assetIds = finalData.map((item: any) => item._id);
    const tokenCounts = await Promise.all(
      assetIds.map((id: string) =>
        this.tokenRepository.getTotalCount({ assetId: id }),
      ),
    );

    result.data = finalData.map((item: any, index: number) => ({
      assetId: item._id,
      ...item,
      sellerName:
        [item.sellerId?.firstName, item.sellerId?.lastName]
          .filter(Boolean)
          .join(' ') || 'N/A',
      sellerStatus: item.sellerId?.status,
      isAdminAsset: !item.sellerId?.firstName && !item.sellerId?.lastName,
      category: item.category?.category,
      coverImage: item.images?.[0],
      sellerId: undefined,
      soldTokens: tokenCounts[index],
      pricePerToken: item.price / item.tokens,
      viewCount: item.viewedBy.length,
    }));

    return result;
  }

  async getAllCategories() {
    return this.assetCategoryModel.find({}, 'category');
  }

  private async sendAssetDocumentEmail(
    documentId: string,
    status: string,
    remarks?: string,
  ): Promise<void> {
    const documentDetail = await this.documentModel.findById(documentId);

    const assetDetail = await this.assetModel
      .findOne({ assetId: documentDetail?.assetId })
      .populate('sellerId');
    if (!assetDetail.sellerId) {
      return;
    }
    const sellerEmail = assetDetail.sellerId['email'];
    let subject: string;
    let template: string;
    let notificationMessage: string;
    const emailData = {
      name: sellerEmail,
      asset: assetDetail.name,
      assetLink: '',
    };
    switch (status) {
      case AssetStatus.PENDING:
        subject = EMAIL_CONSTANTS.DOCUMENT.PENDING.SUBJECT;
        template = EMAIL_CONSTANTS.DOCUMENT.PENDING.template;
        notificationMessage = NOTIFICATION_TEMPLATE.DOCUMENT.documentPending(
          documentDetail.documentName,
          documentDetail.type,
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        break;
      case AssetStatus.APPROVED:
        subject = EMAIL_CONSTANTS.DOCUMENT.APPROVED.SUBJECT;
        template = EMAIL_CONSTANTS.DOCUMENT.APPROVED.template;
        notificationMessage = NOTIFICATION_TEMPLATE.DOCUMENT.documentApproved(
          documentDetail.documentName,
          documentDetail.type,
          assetDetail.name,
        );
        break;

      case AssetStatus.REJECTED:
        subject = EMAIL_CONSTANTS.DOCUMENT.REJECTED.SUBJECT;
        template = EMAIL_CONSTANTS.DOCUMENT.REJECTED.template;
        notificationMessage = NOTIFICATION_TEMPLATE.DOCUMENT.documentRejected(
          documentDetail.documentName,
          documentDetail.type,
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        break;

      default:
        break;
    }
    try {
      await this.sendGridServices.sendMail(
        sellerEmail,
        subject,
        template,
        emailData,
      );
      const notification = {
        userId: assetDetail.sellerId,
        message: notificationMessage,
      };
      await this.notificationService.sendNotification(notification);
    } catch (error) {
      Logger.error(`Failed to send email for asset ${documentId}:`, error);
    }
  }

  private async sendAssetEmail(
    assetId: string,
    status: string,
    remarks?: string,
  ): Promise<void> {
    const assetDetail = await this.assetModel
      .findOne({ assetId })
      .populate('sellerId');
    if (!assetDetail.sellerId) {
      return;
    }
    const sellerEmail = assetDetail.sellerId['email'];
    let subject: string;
    let template: string;
    const emailData = {
      name: sellerEmail,
      asset: assetDetail.name,
      assetLink: EMAIL_CONSTANTS.ASSET.getAssetLink(assetId),
    };
    let notificationMessage: string;
    switch (status) {
      case AssetStatus.GOING_LIVE:
        subject = EMAIL_CONSTANTS.ASSET.APPROVED.SUBJECT;
        template = EMAIL_CONSTANTS.ASSET.APPROVED.TEMPLATE;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.approvedAsset(
          assetDetail.name,
        );
        break;

      case AssetStatus.LIVE:
        subject = EMAIL_CONSTANTS.ASSET.LIST.subject;
        template = EMAIL_CONSTANTS.ASSET.LIST.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.liveAsset(
          assetDetail.name,
        );
        break;

      case AssetStatus.REJECTED:
        subject = EMAIL_CONSTANTS.ASSET.REJECTED.subject;
        template = EMAIL_CONSTANTS.ASSET.REJECTED.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.rejectedAsset(
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        break;

      case AssetStatus.LIVE:
        subject = EMAIL_CONSTANTS.ASSET.LIST.subject;
        template = EMAIL_CONSTANTS.ASSET.LIST.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.liveAsset(
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        emailData['assetLink'] = '';
        break;

      case AssetStatus.HOLD:
        subject = EMAIL_CONSTANTS.ASSET.HOLD.subject;
        template = EMAIL_CONSTANTS.ASSET.HOLD.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.holdAsset(
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        emailData['assetLink'] = '';
        break;

      case AssetStatus.DELIST:
        subject = EMAIL_CONSTANTS.ASSET.DELIST.subject;
        template = EMAIL_CONSTANTS.ASSET.DELIST.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.delistedAsset(
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        emailData['assetLink'] = '';
        break;

      case AssetStatus.DELETE:
        subject = EMAIL_CONSTANTS.ASSET.DELETE.subject;
        template = EMAIL_CONSTANTS.ASSET.DELETE.template;
        notificationMessage = NOTIFICATION_TEMPLATE.ASSET.deletedAsset(
          assetDetail.name,
        );
        emailData['reason'] = remarks;
        emailData['assetLink'] = '';
        break;

      default:
        break;
    }
    try {
      await this.sendGridServices.sendMail(
        sellerEmail,
        subject,
        template,
        emailData,
      );
      const notification = {
        userId: assetDetail.sellerId,
        message: notificationMessage,
      };
      await this.notificationService.sendNotification(notification);
    } catch (error) {
      Logger.error(`Failed to send email for asset ${assetId}:`, error);
    }
  }

  async delistAsset(assetId: string): Promise<{ transactionUrl: string }> {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }

    if (!asset.ContractListingId) {
      throw new BadRequestException(`No listing found for assetId: ${assetId}`);
    }

    // Call cancelListing on the blockchain
    const cancelResult = await this.blockchainService.cancelListing(
      asset.ContractListingId,
    );

    // Update the asset in the database
    await this.assetModel.updateOne(
      { assetId },
      {
        $set: {
          status: AssetStatus.DELIST,
          listingTransactionUrl: cancelResult.transactionUrl,
        },
      },
    );

    return cancelResult;
  }

  async relistAsset(assetId: string): Promise<{ transactionUrl: string }> {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }

    if (!asset.contractTokenId || !asset.tokenAssetId) {
      throw new BadRequestException(`Token not minted for assetId: ${assetId}`);
    }

    if (!asset.ContractListingId) {
      throw new BadRequestException(
        `No listingId found for assetId: ${assetId} to relist`,
      );
    }

    const seller = await this.userModel.findById(asset.sellerId);
    const sellerWalletAddress = seller?.walletAddress;
    if (!sellerWalletAddress) {
      throw new Error('Seller wallet address not configured');
    }

    // Use updateListing to relist with the existing listingId
    const updateResult = await this.blockchainService.updateListing(
      asset.ContractListingId,
    );

    // Update the asset in the database
    await this.assetModel.updateOne(
      { assetId },
      {
        $set: {
          status: asset.sold ? AssetStatus.SOLD : AssetStatus.LIVE,
          listingTransactionUrl: updateResult.transactionUrl,
        },
      },
    );

    return updateResult;
  }
  async verifyAsset(
    verificationData: VerifyAssetDto,
    userDetails: any,
  ): Promise<Asset> {
    const asset = await this.assetModel.findOne({
      assetId: verificationData.assetId,
    });

    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(verificationData.assetId),
      );
    }

    asset.status = verificationData.status;
    asset.adminRemarks = verificationData.remarks;
    asset.verifiedBy = userDetails?._id;
    asset.verificationDate = new Date();

    if (
      verificationData.status === AssetStatus.APPROVED ||
      verificationData.status === AssetStatus.GOING_LIVE
    ) {
      if (
        new Date(verificationData.listedDate).toDateString() ===
        new Date().toDateString()
      ) {
        asset.status = AssetStatus.LIVE;
      }
      asset.listedDate = new Date(
        new Date(verificationData.listedDate).setHours(0, 0, 0, 0),
      );
      asset.isFeaturedAsset = verificationData.isfeaturedAsset;
      // await this.createArweaveConfig(asset);
    }

    if (verificationData?.isfeaturedAsset) {
      asset.status = AssetStatus.GOING_LIVE;
    } else if (verificationData.status === AssetStatus.LIVE) {
      asset.status = asset.sold ? AssetStatus.SOLD : AssetStatus.LIVE;
    }

    const assetHistory = {
      assetId: verificationData.assetId,
      status: verificationData.status,
      remarks: verificationData.remarks,
      verificationDate: new Date(),
    };

    await asset.save();
    await new this.assetHistoryModel(assetHistory).save();
    await this.sendAssetEmail(
      verificationData.assetId,
      verificationData.status,
      verificationData.remarks,
    );
    return asset;
  }

  async approveAsset(assetId) {
    const asset = await this.assetModel.findOne({
      assetId: assetId,
    });

    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }
    asset.verificationDate = new Date();
    asset.save();

    const seller = await this.userModel.findById(asset.sellerId);
    const walletAddress = seller?.walletAddress;

    const notificationMessage = NOTIFICATION_TEMPLATE.ASSET.approvingAsset(
      asset.name,
      walletAddress,
    );
    const notification = {
      userId: asset.sellerId,
      message: notificationMessage,
    };
    await this.notificationService.sendNotification(notification);

    // const documents = await this.documentModel
    //     .find({ assetId: asset.assetId })
    //     .lean();
    //   await this.createArweaveConfig( asset, documents);
    return asset;
  }

  async validateDocument(
    validateDocumentDto: ValidateDocumentDto,
    userData: any,
  ) {
    const documentDetail = await this.documentModel.findById(
      validateDocumentDto.documentId,
    );
    if (!documentDetail)
      throw new BadRequestException({
        message: 'Document not found',
      });
    validateDocumentDto['verificationDate'] = new Date();
    validateDocumentDto['verifiedBy'] = userData?._id;
    validateDocumentDto['adminRemarks'] = validateDocumentDto.remarks;

    return await this.documentModel
      .findByIdAndUpdate(validateDocumentDto.documentId, validateDocumentDto)
      .then(async (result) => {
        if (validateDocumentDto.status === documentReportStatus.REJECTED) {
          await this.assetModel.updateOne(
            { assetId: documentDetail.assetId },
            { $set: { status: AssetStatus.ADJUSTMENT_REQUIRED } },
          );
        }
        await this.sendAssetDocumentEmail(
          validateDocumentDto.documentId,
          validateDocumentDto.status,
          validateDocumentDto.remarks,
        );
        return result;
      });
  }

  async deleteAsset(assetId: string): Promise<Asset> {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }

    asset.deletedAt = new Date();
    return asset.save().then((result) => {
      this.sendAssetEmail(assetId, AssetStatus.DELETE);
      return result;
    });
  }

  async updateTokenById(updateTokenDto: UpdateTokenDto): Promise<Asset> {
    const asset = await this.assetModel.findOne({
      assetId: updateTokenDto.assetId,
    });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(updateTokenDto.assetId),
      );
    }

    asset.tokens = updateTokenDto.tokens;
    return asset.save();
  }

  async checkAssetFeatureListingAvailability(): Promise<{
    isListingExist: boolean;
  }> {
    const isListingExist = await this.assetModel.exists({
      isFeaturedAsset: true,
      deletedAt: null,
    });

    return { isListingExist: !!isListingExist };
  }

  async getImageAnalysis(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    try {
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.format) {
        throw new Error('Unknown image format');
      }

      if (!supportedFormats.includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      const isAnimated = metadata.pages && metadata.pages > 1;

      const imageData = await sharp(file.buffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const sharpness = calculateSharpness(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );
      const motionBlur = calculateMotionBlur(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );
      const noise = estimateImageNoise(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );

      const blurScore = 1 - sharpness;
      const overallScore = calculateOverallScore(sharpness, motionBlur, noise);

      const analysisMetadata: ImageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: file.buffer.length,
        isAnimated: isAnimated || false,
        colorSpace: metadata.space || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
        pageCount: metadata.pages || 1,
      };

      const qualityMetrics: ImageQualityMetrics = {
        sharpness: Number(sharpness.toFixed(4)),
        blurScore: Number(blurScore.toFixed(4)),
        motionBlur: Number(motionBlur.toFixed(4)),
        noise: Number(noise.toFixed(4)),
        overallScore: Number(overallScore.toFixed(4)),
        qualityLevel: determineQualityLevel(overallScore),
      };

      return {
        metadata: analysisMetadata,
        quality: qualityMetrics,
        recommendation: getQualityRecommendation(overallScore, metadata.format),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image analysis failed:   calculateMotionBlur,
  calculateOverallScore,
  calculateSharpness,${error.message}`);
      }
      throw new Error('Unknown error during image analysis');
    }
  }

  async updateTokenSupply(
    assetId: string,
    newTokens: number,
    newPrice: number,
    action: 'mint' | 'burn',
    remarks?: string,
    transactionUrl?: string,
  ): Promise<Asset> {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }
    // Validate new token count
    if (newTokens < 0) {
      throw new BadRequestException('Token count cannot be negative');
    }

    // Save asset history
    const assetHistory = {
      assetId,
      status: asset.status, // Retain current status
      remarks:
        remarks ||
        `${action === 'mint' ? 'Minted' : 'Burned'} ${action === 'mint' ? newTokens - asset.tokens : asset.tokens - newTokens} tokens`,
      verificationDate: new Date(),
      tokensCount: newTokens,
      price: newPrice,
      transactionUrl,
      actionStatus: action,
    };
    await new this.assetHistoryModel(assetHistory).save();

    // Update asset fields
    asset.tokens = newTokens;
    asset.price = newPrice;

    // Save updated asset
    const updatedAsset = await asset.save();

    // Send notification email (optional, based on your requirements)
    await this.sendAssetEmail(
      assetId,
      asset.status, // Use current status or a custom status if needed
      remarks ||
        `${action === 'mint' ? 'Minted' : 'Burned'} ${newTokens - (action === 'mint' ? asset.tokens : -asset.tokens)} tokens`,
    );

    return updatedAsset;
  }

  async updateAssetPrice(assetId, price) {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ASSET_ERROR_MESSAGES.ASSET_NOT_FOUND(assetId),
      );
    }
    asset.price = price;
    asset.save();

    return asset;
  }
}
