import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

import { AuthGuard } from 'src/auth/guard/auth.guard';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { multerConfig } from 'src/config/multer.config';
import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

import { AssetsService } from './assets.service';
import { AssetFilterDto } from './dto/asset-filter.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UploadDocumentDto } from './dto/create-document.dto';
import { AnalyzeImageResponseDto } from './dto/image-dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { VerifyAssetDto } from './dto/verify-asset.dto';
import { ValidateDocumentDto } from './dto/verify-document.dto';

class TokenActionDto {
  @IsString()
  assetId: string;

  @IsString()
  contractTokenId: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @Type(() => Number)
  @IsNumber()
  price: number;
}
@ApiTags('assets')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      multerConfig,
    ),
  )
  async create(
    @Req() request,
    @UploadedFiles()
    files: {
      cover: Express.Multer.File[];
      images: Express.Multer.File[];
    },
    @Body() assetDto: CreateAssetDto,
  ) {
    try {
      if (!files.images || files.images.length === 0) {
        throw new HttpException('No images uploaded', HttpStatus.BAD_REQUEST);
      }

      const userId = request?.user?._id;
      if (!userId) {
        throw new BadRequestException({
          message: 'User not found',
        });
      }
      const coverImage = files.images[0];
      const images = files['images'];
      const result = await this.assetsService.create(
        assetDto,
        coverImage,
        images,
        userId,
      );

      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post(':assetId/update')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      multerConfig,
    ),
  )
  async update(
    @Req() request,
    @UploadedFiles()
    files: {
      cover: Express.Multer.File[];
      images: Express.Multer.File[];
    },
    @Param('assetId') assetId: string,
    @Body() assetDto: UpdateAssetDto,
  ) {
    try {
      const userId = request?.user?._id;
      if (!userId) {
        throw new BadRequestException({
          message: 'User not found',
        });
      }
      const coverImage = files['cover'];
      const images = files['images'];

      const result = await this.assetsService.updateAsset(
        assetId,
        assetDto,
        coverImage,
        images,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('/featured/asset/availability')
  @ApiOperation({
    summary: 'Check if any asset feature currently listing or not',
  })
  async checkAssetFeatureListingAvailability() {
    try {
      const result =
        await this.assetsService.checkAssetFeatureListingAvailability();
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get(':status')
  @ApiOperation({ summary: 'Get all assets based on status' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of assets based on status',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getPendingAssets(
    @Query() query: AssetFilterDto,
    @Param('status') status: string,
  ) {
    try {
      const result = await this.assetsService.findAssetsByStatus(status, query);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get(':assetId/find')
  async findOne(@Param('assetId') assetId: string) {
    try {
      const result = await this.assetsService.findOne(assetId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('/category/list')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns list of categories' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getCategoryList() {
    try {
      const result = await this.assetsService.getAllCategories();
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('/verify')
  @ApiOperation({ summary: 'Verify an asset' })
  @ApiBody({ type: VerifyAssetDto })
  @ApiResponse({ status: 200, description: 'Asset verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyAsset(@Req() request, @Body() verificationData: VerifyAssetDto) {
    try {
      const result = await this.assetsService.verifyAsset(
        verificationData,
        request.user,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('/approve')
  @ApiOperation({ summary: 'Approve an asset' })
  @ApiResponse({ status: 200, description: 'Asset approved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async approveAsset(@Query('assetId') assetId) {
    try {
      const result = await this.assetsService.approveAsset(assetId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('/document/verify')
  @ApiOperation({ summary: 'Validate a document' })
  @ApiBody({ type: ValidateDocumentDto })
  @ApiResponse({ status: 200, description: 'Document validated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async validateDocument(
    @Req() request,
    @Body() validateDocument: ValidateDocumentDto,
  ) {
    try {
      const result = await this.assetsService.validateDocument(
        validateDocument,
        request.user,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('/token/update')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, description: 'Asset token updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async updateAssetById(@Body() updateTokenDto: UpdateTokenDto) {
    try {
      const result = await this.assetsService.updateTokenById(updateTokenDto);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Delete(':assetId')
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async deleteAsset(@Param('assetId') assetId: string) {
    try {
      const result = await this.assetsService.deleteAsset(assetId);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post('create-documents')
  @ApiOperation({
    summary: 'Upload a documents to s3 when the while creating the asset ',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents S3 URL will be provided',
  })
  @ApiResponse({ status: 404, description: 'Bads request' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createDocuments(
    @UploadedFile()
    documentDetails: Express.Multer.File,
    @Body() documentDto: UploadDocumentDto,
  ) {
    return this.assetsService.createDocument(documentDetails, documentDto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze image quality' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image analysis results',
    type: AnalyzeImageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or no file uploaded',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to analyze',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async analyzeImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: Express.Multer.File,
  ): Promise<any> {
    try {
      const res = await this.assetsService.getImageAnalysis(file);
      return constructSuccessResponse(res);
    } catch (error) {
      constructErrorResponse(error);
    }
  }

  @Post('mint-tokens')
  @ApiOperation({ summary: 'Mint additional tokens for an asset' })
  @ApiBody({ type: TokenActionDto })
  @ApiResponse({ status: 200, description: 'Tokens minted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async mintTokens(@Body() body: TokenActionDto) {
    try {
      const { assetId, amount, price } = body;
      // Fetch current asset to calculate new token count
      const asset = await this.assetsService.findOne(assetId);
      if (!asset) {
        throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
      }

      // Call blockchain service to mint tokens
      const result = await this.blockchainService.mintTokens(
        Number(asset.contractTokenId),
        amount,
      );
      // Update database with new token count and price
      const newTokens = asset.tokens + amount;
      await this.assetsService.updateTokenSupply(
        assetId,
        newTokens,
        price,
        'mint',
        undefined, // remarks
        result.transactionUrl,
      );
      return constructSuccessResponse({
        transactionHash: result.transactionHash,
        transactionUrl: result.transactionUrl,
      });
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post('burn-tokens')
  @ApiOperation({ summary: 'Burn tokens for an asset' })
  @ApiBody({ type: TokenActionDto })
  @ApiResponse({ status: 200, description: 'Tokens burned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async burnTokens(@Body() body: TokenActionDto) {
    try {
      const { assetId, amount, price } = body;

      // Fetch current asset to calculate new token count
      const asset = await this.assetsService.findOne(assetId);

      if (!asset) {
        throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
      }
      // Call blockchain service to burn tokens
      const result = await this.blockchainService.burnTokens(
        Number(asset.contractTokenId),
        amount,
      );
      // Update database with new token count and price
      const newTokens = asset.tokens - amount;
      await this.assetsService.updateTokenSupply(
        assetId,
        newTokens,
        price,
        'burn',
      );
      return constructSuccessResponse({
        transactionHash: result.transactionHash,
        transactionUrl: result.transactionUrl,
      });
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('updateAssetPrice/:assetId')
  async updateAssetPrice(
    @Param('assetId') assetId: string,
    @Body('price') price: number,
  ) {
    return this.assetsService.updateAssetPrice(assetId, price);
  }

  @Post('delist')
  async delistAsset(@Body('assetId') assetId: string) {
    return this.assetsService.delistAsset(assetId);
  }

  @Post('relist')
  async relistAsset(@Body('assetId') assetId: string) {
    return this.assetsService.relistAsset(assetId);
  }
}
