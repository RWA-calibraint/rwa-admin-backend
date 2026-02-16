import { AssetStatus } from 'src/@typings/enums';

import { AssetListing } from '../schemas/asset-listing.schema';
import { Asset as AssetSchema } from '../schemas/asset.schema';
import { Document } from '../schemas/document.schema';
import { PriceHistory } from '../schemas/price-history.schema';

export { AssetStatus };

export enum VerificationType {
  DIGITAL = 'DIGITAL',
  PHYSICAL = 'PHYSICAL',
}

export interface Asset {
  id: string;
  status: AssetStatus;
  remarks?: string;
  ownerId?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationType?: VerificationType;
  lastModifiedAt?: Date;
  lastModifiedBy?: string;
  physicalVerification?: PhysicalVerificationResult;
}

export interface AssetVerification {
  status: AssetStatus;
  remarks?: string;
  verifiedBy: string;
  verifiedAt: Date;
  verificationType: VerificationType;
}

export interface AssetTransfer {
  fromOwnerId: string;
  toOwnerId: string;
  transferredAt: Date;
  transferredBy: string;
  status: AssetStatus.TRANSFERRED;
  remarks?: string;
}

export interface PhysicalVerificationResult {
  status: boolean;
  verifiedAt: Date;
  verifiedBy: string;
  location?: string;
  remarks?: string;
}

interface AssetOwnerInfo {
  name: string;
  tokenCount: number;
  purchasedDate: string;
}

export interface AssetWithDocuments extends Omit<AssetSchema, '_id'> {
  _id: string;
  viewsCount: number;
  likesCount: number;
  listings: AssetListing[];
  documents: Pick<
    Document,
    'type' | 'documentUrl' | 'documentName' | 'assetId' | 'status'
  >[];
  priceHistory: Pick<PriceHistory, 'year' | 'price'>[];
  soldTokens: number;
  assetOwners: AssetOwnerInfo[];
  listingActivity: AssetListing[];
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  isAnimated: boolean;
  colorSpace: string;
  hasAlpha: boolean;
  pageCount: number;
}

export interface ImageQualityMetrics {
  sharpness: number;
  blurScore: number;
  motionBlur: number;
  noise: number;
  overallScore: number;
  qualityLevel: string;
}

export interface ImageAnalysisResult {
  metadata: ImageMetadata;
  quality: ImageQualityMetrics;
  recommendation: string;
}

export type QualityLevel =
  | 'excellent'
  | 'good'
  | 'average'
  | 'poor'
  | 'very-poor';
