import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ethers } from 'ethers';

import * as RareAgoraMarketplaceABI from 'src/utils/abis/RareAgoraMarketplace.json';
import * as RWATokenABI from 'src/utils/abis/RWAToken.json';

@Injectable()
export class BlockchainService {
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly rwaToken: ethers.Contract;
  private readonly marketplace: ethers.Contract;
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('AMOY_RPC_URL');
    if (!rpcUrl) throw new Error('AMOY_RPC_URL is not configured');

    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, {
      chainId: 80002,
      name: 'amoy',
    });

    const privateKey = this.configService.get('ADMIN_PRIVATE_KEY');
    if (!privateKey) throw new Error('ADMIN_PRIVATE_KEY is not configured');
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    const rwaTokenAddress = this.configService.get(
      'RWA_TOKEN_CONTRACT_ADDRESS',
    );
    if (!rwaTokenAddress)
      throw new Error('RWA_TOKEN_CONTRACT_ADDRESS is not configured');
    this.rwaToken = new ethers.Contract(
      rwaTokenAddress,
      RWATokenABI.abi,
      this.wallet,
    );

    const marketplaceAddress = this.configService.get('MARKETPLACE_PROXY');
    if (!marketplaceAddress)
      throw new Error('MARKETPLACE_PROXY is not configured');
    this.marketplace = new ethers.Contract(
      marketplaceAddress,
      RareAgoraMarketplaceABI.abi,
      this.wallet,
    );
  }

  async mintToken(
    to: string,
    uri: string,
    name: string,
    metadata: string,
    maxSupply: number,
    amount: number,
    physicalId: string,
    seller: string,
  ): Promise<{
    tokenId: string;
    transactionUrl: string;
    tokenAssetId: string;
  }> {
    this.logger.log(
      `Starting mintToken: to=${to}, seller=${seller}, physicalId=${physicalId}`,
    );
    try {
      if (!ethers.utils.isAddress(to))
        throw new Error(`Invalid 'to' address: ${to}`);
      if (!ethers.utils.isAddress(seller))
        throw new Error(`Invalid 'seller' address: ${seller}`);

      this.logger.log('Estimating gas for mint...');
      const gasEstimate = await this.rwaToken.estimateGas.mint(
        to,
        uri,
        name,
        metadata,
        maxSupply,
        amount,
        physicalId,
        seller,
      );
      this.logger.log(gasEstimate);

      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');
      const tx = await this.rwaToken.mint(
        to,
        uri,
        name,
        metadata,
        maxSupply,
        amount,
        physicalId,
        seller,
        {
          gasLimit: gasEstimate.mul(12).div(10),
          maxPriorityFeePerGas,
          maxFeePerGas,
        },
      );
      this.logger.log(tx);

      const receipt = await tx.wait();

      const tokenMintedEvent = receipt.events.find(
        (e) => e.event === 'TokenMinted',
      );
      if (!tokenMintedEvent)
        throw new Error('TokenMinted event not found in receipt');

      const tokenId = tokenMintedEvent.args.tokenId;
      const tokenAssetId = tokenMintedEvent.args.assetId;

      this.logger.log(`Mint transaction receipt: ${tokenId}`);

      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;

      return {
        tokenId: tokenId.toString(),
        transactionUrl,
        tokenAssetId,
      };
    } catch (error) {
      this.logger.error(`Minting failed: ${error.message}`, error.stack);
      throw new Error(`Minting failed: ${error.message}`);
    }
  }

  async createListing(
    collectionId: string,
    tokenId: string,
    assetId: string,
    physicalId: string,
    amount: number,
    pricePerToken: number,
    seller: string,
  ): Promise<{
    listingId: string;
    transactionUrl: string;
    initialSeller: string;
  }> {
    try {
      if (!ethers.utils.isAddress(seller))
        throw new Error(`Invalid seller address: ${seller}`);
      if (!ethers.utils.isHexString(collectionId, 32))
        throw new Error(`Invalid collectionId: ${collectionId}`);
      if (!ethers.utils.isHexString(assetId, 32))
        throw new Error(`Invalid assetId: ${assetId}`);
      if (!ethers.utils.isHexString(physicalId, 32))
        throw new Error(`Invalid physicalId: ${physicalId}`);
      const balance = await this.rwaToken.balanceOf(seller, tokenId);
      if (balance.lt(amount))
        throw new Error(
          `Insufficient token balance: ${balance.toString()} < ${amount}`,
        );

      this.logger.log('Setting approval for marketplace...');
      const approvalTx = await this.rwaToken.setApprovalForAll(
        this.marketplace.address,
        true,
        {
          gasLimit: ethers.utils.parseUnits('100000', 'wei'),
          maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
          maxFeePerGas: ethers.utils.parseUnits('60', 'gwei'),
        },
      );
      this.logger.log(`Approval transaction sent: ${approvalTx.hash}`);
      await approvalTx.wait();

      this.logger.log('Estimating gas for createListing...');
      const gasEstimate = await this.marketplace.estimateGas.createListing(
        1,
        collectionId,
        tokenId,
        assetId,
        physicalId,
        amount,
        pricePerToken,
        seller,
      );
      this.logger.log(gasEstimate);
      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');

      const tx = await this.marketplace.createListing(
        1,
        collectionId,
        tokenId,
        assetId,
        physicalId,
        amount,
        pricePerToken,
        seller,

        {
          gasLimit: gasEstimate.mul(12).div(10),
          maxPriorityFeePerGas,
          maxFeePerGas,
        },
      );
      this.logger.log(tx);
      const receipt = await tx.wait();

      const listingEvent = receipt.events.find((e) => e.event === 'Listed');
      if (!listingEvent) throw new Error('Listed event not found in receipt');

      const listingId = listingEvent.args.listingId.toString();
      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;
      const initialSeller = listingEvent.args.seller.toString();
      this.logger.log('selleraddress', initialSeller);

      return {
        listingId,
        transactionUrl,
        initialSeller,
      };
    } catch (error) {
      throw new Error(`Listing creation failed: ${error.message}`);
    }
  }

  async mintTokens(
    tokenId: number,
    amount: number,
  ): Promise<{ transactionUrl: string; transactionHash: string }> {
    this.logger.log(
      `Starting mintTokens: tokenId=${tokenId}, amount=${amount}`,
    );
    try {
      // Validate inputs
      if (tokenId < 0 || !Number.isInteger(tokenId))
        throw new Error(`Invalid tokenId: ${tokenId}`);
      if (amount <= 0 || !Number.isInteger(amount))
        throw new Error(`Invalid amount: ${amount}`);

      // Estimate gas for increaseSupply
      this.logger.log('Estimating gas for increaseSupply...');

      // Get fee data
      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');

      // Try estimating gas
      let gasLimit;
      try {
        this.logger.log('Estimating gas for increaseSupply...');
        const gasEstimate = await this.rwaToken.estimateGas.increaseSupply(
          tokenId,
          amount,
        );
        gasLimit = gasEstimate.mul(12).div(10); // buffer
      } catch (err) {
        this.logger.warn(
          `estimateGas failed: ${err.message}, using fallback limit.`,
        );
        gasLimit = ethers.BigNumber.from('500000'); // fallback to 500k
      }

      // Call increaseSupply
      const tx = await this.rwaToken.increaseSupply(tokenId, amount, {
        gasLimit,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      const receipt = await tx.wait();
      this.logger.log(
        `increaseSupply tx successful: ${receipt.transactionHash}`,
      );

      // Check for SupplyIncreased event
      const supplyIncreasedEvent = receipt.events.find(
        (e) => e.event === 'SupplyIncreased',
      );
      if (!supplyIncreasedEvent)
        throw new Error('SupplyIncreased event not found in receipt');

      this.logger.log(
        `increaseSupply transaction successful: ${receipt.transactionHash}`,
      );

      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;

      return {
        transactionHash: receipt.transactionHash,
        transactionUrl,
      };
    } catch (error) {
      this.logger.error(`increaseSupply failed: ${error.message}`, error.stack);
      throw new Error(`increaseSupply failed: ${error.message}`);
    }
  }

  async burnTokens(
    tokenId: number,
    amount: number,
  ): Promise<{ transactionUrl: string; transactionHash: string }> {
    this.logger.log(
      `Starting burnTokens: tokenId=${tokenId}, amount=${amount}`,
    );
    try {
      // Validate inputs
      if (tokenId < 0 || !Number.isInteger(tokenId))
        throw new Error(`Invalid tokenId: ${tokenId}`);
      if (amount <= 0 || !Number.isInteger(amount))
        throw new Error(`Invalid amount: ${amount}`);

      // Check balance
      const balance = await this.rwaToken.balanceOf(
        this.wallet.address,
        tokenId,
      );
      if (balance.lt(amount)) {
        throw new Error(
          `Insufficient balance: ${balance.toString()} < ${amount}`,
        );
      }

      // Estimate gas for burn
      this.logger.log('Estimating gas for burn...');
      const gasEstimate = await this.rwaToken.estimateGas.burn(tokenId, amount);

      // Get fee data
      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');

      // Call burn
      const tx = await this.rwaToken.burn(tokenId, amount, {
        gasLimit: gasEstimate.mul(12).div(10),
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      const receipt = await tx.wait();

      // Check for TokenBurned event
      const tokenBurnedEvent = receipt.events.find(
        (e) => e.event === 'TokenBurned',
      );
      if (!tokenBurnedEvent)
        throw new Error('TokenBurned event not found in receipt');

      this.logger.log(
        `burn transaction successful: ${receipt.transactionHash}`,
      );

      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;

      return {
        transactionHash: receipt.transactionHash,
        transactionUrl,
      };
    } catch (error) {
      this.logger.error(`burn failed: ${error.message}`, error.stack);
      throw new Error(`burn failed: ${error.message}`);
    }
  }

  async cancelListing(listingId: string): Promise<{ transactionUrl: string }> {
    this.logger.log(`Starting cancelListing: listingId=${listingId}`);
    try {
      // Validate listingId
      const listingIdBigNumber = ethers.BigNumber.from(listingId);
      if (listingIdBigNumber.lt(0)) {
        throw new Error(`Invalid listingId: ${listingId}`);
      }

      // Estimate gas for cancelListing
      this.logger.log('Estimating gas for cancelListing...');
      let gasLimit;
      try {
        this.logger.log('Estimating gas for increaseSupply...');
        const gasEstimate =
          await this.marketplace.estimateGas.cancelListing(listingId);
        gasLimit = gasEstimate.mul(12).div(10); // buffer
      } catch (err) {
        this.logger.warn(
          `estimateGas failed: ${err.message}, using fallback limit.`,
        );
        gasLimit = ethers.BigNumber.from('500000'); // fallback to 500k
      }

      // Get fee data
      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');

      // Call cancelListing
      const tx = await this.marketplace.cancelListing(listingId, {
        gasLimit,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      const receipt = await tx.wait();

      // Check for ListingCancelled event
      const listingCancelledEvent = receipt.events.find(
        (e) => e.event === 'ListingCancelled',
      );
      if (!listingCancelledEvent) {
        throw new Error('ListingCancelled event not found in receipt');
      }

      this.logger.log(
        `cancelListing transaction successful: ${receipt.transactionHash}`,
      );

      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;

      return { transactionUrl };
    } catch (error) {
      this.logger.error(`cancelListing failed: ${error.message}`, error.stack);
      throw new Error(`cancelListing failed: ${error.message}`);
    }
  }

  async updateListing(listingId: string): Promise<{ transactionUrl: string }> {
    this.logger.log(`Starting updateListing: listingId=${listingId}`);
    try {
      // Validate inputs
      const listingIdBigNumber = ethers.BigNumber.from(listingId);
      if (listingIdBigNumber.lt(0)) {
        throw new Error(`Invalid listingId: ${listingId}`);
      }

      // Estimate gas for updateListing
      this.logger.log('Estimating gas for updateListing...');
      const gasEstimate =
        await this.marketplace.estimateGas.reactivateListing(listingId);

      // Get fee data
      const feeData = await this.provider.getFeeData();
      const maxPriorityFeePerGas = ethers.utils.parseUnits('30', 'gwei');
      const maxFeePerGas = feeData.lastBaseFeePerGas
        ? feeData.lastBaseFeePerGas.add(maxPriorityFeePerGas)
        : ethers.utils.parseUnits('60', 'gwei');

      // Call updateListing
      const tx = await this.marketplace.reactivateListing(listingId, {
        gasLimit: gasEstimate.mul(12).div(10),
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      const receipt = await tx.wait();

      // Check for ListingUpdated event
      const listingUpdatedEvent = receipt.events.find(
        (e) => e.event === 'ListingReactivated',
      );
      if (!listingUpdatedEvent) {
        throw new Error('ListingUpdated event not found in receipt');
      }

      this.logger.log(
        `updateListing transaction successful: ${receipt.transactionHash}`,
      );

      const transactionUrl = `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`;

      return { transactionUrl };
    } catch (error) {
      this.logger.error(`updateListing failed: ${error.message}`, error.stack);
      throw new Error(`updateListing failed: ${error.message}`);
    }
  }
}
