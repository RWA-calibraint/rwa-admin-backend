import { ApiProperty } from '@nestjs/swagger';

import {
  ImageAnalysisResult,
  ImageMetadata,
  ImageQualityMetrics,
} from '../types';

export class AnalyzeImageResponseDto implements ImageAnalysisResult {
  @ApiProperty({
    example: {
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: 1024000,
    },
    description: 'Image metadata information',
  })
  metadata: ImageMetadata;

  @ApiProperty({
    example: {
      sharpness: 0.7234,
      blurScore: 0.2766,
      motionBlur: 0.1542,
      noise: 0.0856,
      overallScore: 0.8123,
    },
    description: 'Image quality metrics',
  })
  quality: ImageQualityMetrics;

  @ApiProperty({
    example: 'Excellent quality image, suitable for all purposes.',
    description: 'Quality assessment and recommendation',
  })
  recommendation: string;
}
