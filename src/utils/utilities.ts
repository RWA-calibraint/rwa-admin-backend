import { QualityLevel } from 'src/assets/types';

export const supportedFormats = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'svg',
  'tiff',
  'avif',
  'heif',
  'raw',
  'dz',
  'jxl',
  'jp2',
];

export function calculateSharpness(
  data: Buffer,
  width: number,
  height: number,
): number {
  let laplacian = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const offset = y * width + x;
      const gray = data[offset];

      const top = data[(y - 1) * width + x];
      const bottom = data[(y + 1) * width + x];
      const left = data[y * width + (x - 1)];
      const right = data[y * width + (x + 1)];

      laplacian += Math.abs(4 * gray - left - right - top - bottom);
      count++;
    }
  }

  const normalizedSharpness = Math.min((laplacian / (count * 255)) * 5, 1);
  return normalizedSharpness;
}

export function calculateMotionBlur(
  data: Buffer,
  width: number,
  height: number,
): number {
  let horizontalDifferences = 0;
  let verticalDifferences = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const offset1 = y * width + x;
      const offset2 = y * width + (x - 1);
      horizontalDifferences += Math.abs(data[offset1] - data[offset2]);
      count++;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 1; y < height; y++) {
      const offset1 = y * width + x;
      const offset2 = (y - 1) * width + x;
      verticalDifferences += Math.abs(data[offset1] - data[offset2]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      count++;
    }
  }

  const horizontalAvg = horizontalDifferences / (width * (height - 1));
  const verticalAvg = verticalDifferences / ((width - 1) * height);

  const minGradient = Math.min(horizontalAvg, verticalAvg);
  const maxGradient = Math.max(horizontalAvg, verticalAvg);

  const motionBlurScore = maxGradient === 0 ? 0 : 1 - minGradient / maxGradient;

  return motionBlurScore;
}

export function estimateImageNoise(
  data: Buffer,
  width: number,
  height: number,
): number {
  let noiseSum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors: number[] = [];

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          neighbors.push(data[(y + dy) * width + (x + dx)]);
        }
      }

      const mean =
        neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;

      const variance =
        neighbors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        neighbors.length;

      const stdDev = Math.sqrt(variance);

      noiseSum += stdDev;
      count++;
    }
  }

  return Math.min((noiseSum / (count * 255)) * 10, 1);
}

export function calculateOverallScore(
  sharpness: number,
  motionBlur: number,
  noise: number,
): number {
  const weights = {
    sharpness: 0.5,
    motionBlur: 0.3,
    noise: 0.2,
  };

  return (
    sharpness * weights.sharpness +
    (1 - motionBlur) * weights.motionBlur +
    (1 - noise) * weights.noise
  );
}

export function determineQualityLevel(score: number): QualityLevel {
  if (score > 0.8) return 'excellent';
  if (score > 0.6) return 'good';
  if (score > 0.4) return 'average';
  if (score > 0.2) return 'poor';
  return 'very-poor';
}

export function getQualityRecommendation(
  score: number,
  format: string,
): string {
  const qualityLevel = determineQualityLevel(score);
  let formatSpecificAdvice = '';

  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      formatSpecificAdvice =
        score < 0.6
          ? ' JPEG compression artifacts may be affecting quality.'
          : '';
      break;
    case 'png':
      formatSpecificAdvice =
        score < 0.6 ? ' Consider checking for PNG optimization issues.' : '';
      break;
    case 'gif':
      formatSpecificAdvice =
        ' Note that GIF has limited color depth which may affect quality metrics.';
      break;
    case 'svg':
      formatSpecificAdvice =
        " SVG analysis is approximate as it's a vector format.";
      break;
    case 'webp':
      formatSpecificAdvice =
        score < 0.6 ? ' Check WebP compression settings.' : '';
      break;
    case 'avif':
    case 'heif':
      formatSpecificAdvice =
        ' Using modern image format, which is good for compression.';
      break;
  }

  const recommendations: Record<QualityLevel, string> = {
    excellent: `Excellent quality image, suitable for all purposes.${formatSpecificAdvice}`,
    good: `Good quality image with minor imperfections.${formatSpecificAdvice}`,
    average: `Average quality image. Consider using for web only.${formatSpecificAdvice}`,
    poor: `Poor quality image. Consider retaking or enhancing.${formatSpecificAdvice}`,
    'very-poor': `Very low quality image. Not recommended for use.${formatSpecificAdvice}`,
  };

  return recommendations[qualityLevel];
}

export function isFormatSupported(format: string): boolean {
  return supportedFormats.includes(format.toLowerCase());
}

export function getSupportedFormats(): string[] {
  return [...supportedFormats];
}
