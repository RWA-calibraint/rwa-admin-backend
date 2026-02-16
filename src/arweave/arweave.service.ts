import { extname } from 'path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import Arweave from 'arweave';
import { Model } from 'mongoose';

import { Asset } from 'src/assets/schemas/asset.schema';
import { Document } from 'src/assets/schemas/document.schema';
import { S3Service } from 'src/shared/services/S3/s3.service';

// Fallback to require
const ArweaveModule = Arweave || require('arweave');

@Injectable()
export class ArweaveService implements OnModuleInit {
  private arweave: Arweave;
  private wallet: any;

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    @InjectModel(Asset.name) private readonly assetModel: Model<Asset>,
  ) {
    if (!ArweaveModule) {
      throw new Error(
        'Arweave module is undefined - check import or installation',
      );
    }
    const walletJson = this.configService.get('ARWEAVE_WALLET');
    if (!walletJson) {
      throw new Error('ARWEAVE_WALLET not configured in environment');
    }

    try {
      const jwk = JSON.parse(walletJson);
      if (!jwk || !jwk.n || !jwk.e || !jwk.d) {
        throw new Error('Invalid JWK: missing required fields (n, e, d)');
      }
      this.wallet = jwk;
    } catch (error: any) {
      throw new Error(`Invalid ARWEAVE_WALLET configuration: ${error.message}`);
    }

    this.arweave = ArweaveModule.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
      fetch: fetch,
    });
  }

  async onModuleInit() {
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        await this.arweave.api.get('/info');
        await this.arweave.wallets.jwkToAddress(this.wallet);
        await this.arweave.wallets.getBalance(
          await this.arweave.wallets.jwkToAddress(this.wallet),
        );
        return;
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw new Error(
            `ArweaveService initialization failed after ${maxRetries} attempts: ${error.message}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempt++;
      }
    }
  }

  private getContentType(fileUrl: string): string {
    const extension = extname(fileUrl).toLowerCase();
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  async publishAssetToArweave(
    assetId: string,
    asset: Asset,
    documents: Document[],
  ): Promise<{
    imageUrl: string | null;
    documentUrls: string[];
    metadataUrl: string;
  }> {
    try {
      const imageTxIds: string[] = [];
      const allMediaUrls = [asset.coverImage, ...(asset.images || [])].filter(
        (url) => url,
      );

      await Promise.all(
        allMediaUrls.map(async (mediaUrl) => {
          try {
            const mediaBuffer = await this.s3Service.getFileBuffer(mediaUrl);
            if (!mediaBuffer || !(mediaBuffer instanceof Buffer)) {
              return;
            }

            const transaction = await this.arweave.createTransaction(
              { data: mediaBuffer },
              this.wallet,
            );
            const contentType = this.getContentType(mediaUrl);
            transaction.addTag('Content-Type', contentType);
            transaction.addTag('Content-Disposition', 'inline');
            await this.arweave.transactions.sign(transaction, this.wallet);
            const uploader =
              await this.arweave.transactions.getUploader(transaction);
            while (!uploader.isComplete) {
              await uploader.uploadChunk();
            }
            imageTxIds.push(transaction.id);
          } catch (error: any) {
            // Skip silently
          }
        }),
      );

      const docTxIds: string[] = [];
      const certificateTxIds: string[] = [];
      const nonCertificateDocs: Document[] = [];

      await Promise.all(
        documents.map(async (doc) => {
          try {
            if (!doc.documentUrl) {
              return;
            }
            const fileBuffer = await this.s3Service.getFileBuffer(
              doc.documentUrl,
            );
            if (!fileBuffer || !(fileBuffer instanceof Buffer)) {
              return;
            }

            const transaction = await this.arweave.createTransaction(
              { data: fileBuffer },
              this.wallet,
            );
            transaction.addTag(
              'Content-Type',
              doc.type || this.getContentType(doc.documentUrl),
            );
            transaction.addTag('Content-Disposition', 'inline');
            await this.arweave.transactions.sign(transaction, this.wallet);
            const uploader =
              await this.arweave.transactions.getUploader(transaction);
            while (!uploader.isComplete) {
              await uploader.uploadChunk();
            }

            if (doc.type === 'certificates') {
              certificateTxIds.push(transaction.id);
            } else {
              docTxIds.push(transaction.id);
              nonCertificateDocs.push(doc);
            }
          } catch (error: any) {
            // Skip silently
          }
        }),
      );

      const metadata = {
        name: asset.name || 'Unnamed Asset',
        description: asset.description || '',
        image:
          imageTxIds.length > 0
            ? imageTxIds.map((txId) => `https://arweave.net/${txId}`)
            : null,
        external_url: `https://rareagora.com/assets/${assetId}`,
        attributes: [{ trait_type: 'Asset ID', value: assetId }],
        documents: [
          ...(certificateTxIds.length > 0
            ? [
                {
                  name: 'Certificates',
                  type: 'certificates',
                  url: certificateTxIds.map(
                    (txId) => `https://arweave.net/${txId}`,
                  ),
                },
              ]
            : []),
          ...nonCertificateDocs.map((doc, index) => ({
            name: doc.documentName || 'Unnamed Document',
            type: doc.type || 'application/pdf',
            url: `https://arweave.net/${docTxIds[index]}`,
          })),
        ],
      };

      let metadataTxId: string;
      try {
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        const transaction = await this.arweave.createTransaction(
          { data: metadataBuffer },
          this.wallet,
        );
        transaction.addTag('Content-Type', 'application/json');
        transaction.addTag('Content-Disposition', 'inline');
        await this.arweave.transactions.sign(transaction, this.wallet);
        const uploader =
          await this.arweave.transactions.getUploader(transaction);
        while (!uploader.isComplete) {
          await uploader.uploadChunk();
        }
        metadataTxId = transaction.id;
        const metadataUrl = `https://arweave.net/${metadataTxId}`;

        const transactionUrl = `https://viewblock.io/arweave/tx/${metadataTxId}`;
        await this.assetModel.updateOne(
          { assetId },
          {
            $set: {
              arweaveImageUrl:
                imageTxIds.length > 0
                  ? imageTxIds
                      .map((txId) => `https://arweave.net/${txId}`)
                      .join(',')
                  : null,
              arweaveDocumentUrls: [
                ...certificateTxIds.map(
                  (txId) => `https://arweave.net/${txId}`,
                ),
                ...docTxIds.map((txId) => `https://arweave.net/${txId}`),
              ],
              arweaveMetadataUrl: metadataUrl,
              arweaveTransactionUrl: transactionUrl,
            },
          },
        );
      } catch (error: any) {
        throw new Error(
          `Metadata upload or URL storage failed: ${error.message}`,
        );
      }

      return {
        imageUrl: imageTxIds.length > 0 ? imageTxIds[0] : null,
        documentUrls: [...certificateTxIds, ...docTxIds],
        metadataUrl: `https://arweave.net/${metadataTxId}`,
      };
    } catch (error: any) {
      throw new Error(`Arweave publishing failed: ${error.message}`);
    }
  }

  async fetchArweaveData(txId: string): Promise<Buffer> {
    try {
      const data = (await this.arweave.transactions.getData(txId, {
        decode: true,
      })) as Uint8Array;
      if (!data) throw new Error('No data returned for transaction');
      return Buffer.from(data);
    } catch (error: any) {
      throw new Error(`Data fetch failed: ${error.message}`);
    }
  }
}
