import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { PipelineStage } from 'mongoose';

import { RefundDetailsDto } from 'src/payments/dto/refund-details.dto';
import { ReleasePaymentDo } from 'src/payments/dto/release-payment.dto';
import { PaymentRepository } from 'src/payments/repository/payment.repository';
import { Payment } from 'src/payments/schemas/payment.schema';
import { StripeService } from 'src/payments/stripe/stripe.service';
import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';
import { PAYMENT_STATUS } from 'src/shared-kernel/utils/constants/transactions';

import { GetPaymentsDto } from './dto/get-payments.dto';
import { TokenRepository } from './repository/token.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeServices: StripeService,
    private readonly paymentRepository: PaymentRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async releaseThePayment(paymentDetails: ReleasePaymentDo): Promise<string> {
    try {
      const existingPaymentDetails = await this.validateThePayment(
        paymentDetails.checkoutSessionId,
      );

      await this.stripeServices.releaseSellerAmount(
        paymentDetails,
        existingPaymentDetails.amount,
        existingPaymentDetails.transactionId,
      );
      await this.paymentRepository.findByCheckoutSessionIdAndUpdate(
        paymentDetails.checkoutSessionId,
        { paymentStatus: PAYMENT_STATUS.COMPLETED },
      );
      return 'OK';
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async refundBuyerAmount({
    checkoutSessionId,
    refundReason,
  }: RefundDetailsDto): Promise<string> {
    try {
      const existingPaymentDetails =
        await this.validateThePayment(checkoutSessionId);

      await this.stripeServices.refund({
        paymentIntentId: existingPaymentDetails.transactionId,
        amount: existingPaymentDetails.amount,
        refundReason,
      });

      await this.paymentRepository.findByCheckoutSessionIdAndUpdate(
        checkoutSessionId,
        {
          paymentStatus: PAYMENT_STATUS.REFUNDED,
          refundReason,
        },
      );
      return 'OK';
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllPayments({
    page = 1,
    paymentMethod,
    paymentStatus,
    search,
    size = 10,
    from,
    to,
  }: GetPaymentsDto) {
    const skip = (page - 1) * 10;
    const filters = [];

    if (paymentMethod && paymentMethod.length > 0) {
      filters.push({
        $match: {
          'payment.paymentMethod': { $in: paymentMethod },
        },
      });
    }

    if (paymentStatus && paymentStatus.length > 0) {
      filters.push({
        $match: {
          'payment.paymentStatus': { $in: paymentStatus },
        },
      });
    }

    if (from && to) {
      filters.push({
        $match: {
          'payment.createdAt': {
            $gte: new Date(from),
            $lte: new Date(to),
          },
        },
      });
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };

      filters.push({
        $match: {
          $or: [
            { 'buyer.firstName': searchRegex },
            { 'buyer.lastName': searchRegex },
            { 'seller.firstName': searchRegex },
            { 'seller.lastName': searchRegex },
            { 'asset.name': searchRegex },
          ],
        },
      });
    }

    const pipeline: PipelineStage[] = [
      {
        $facet: {
          data: [
            {
              $lookup: {
                from: 'payments',
                localField: 'transactionId',
                foreignField: '_id',
                as: 'payment',
              },
            },
            { $unwind: '$payment' },
            {
              $lookup: {
                from: 'assets',
                localField: 'assetId',
                foreignField: '_id',
                as: 'asset',
              },
            },
            { $unwind: '$asset' },
            {
              $lookup: {
                from: 'users',
                localField: 'buyerId',
                foreignField: '_id',
                as: 'buyer',
              },
            },
            { $unwind: '$buyer' },
            {
              $addFields: {
                sellerId: { $toObjectId: '$payment.sellerId' },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'sellerId',
                foreignField: '_id',
                as: 'seller',
              },
            },
            {
              $unwind: {
                path: '$seller',
                preserveNullAndEmptyArrays: true,
              },
            },
            ...filters,
            {
              $group: {
                _id: '$transactionId',
                transactionId: { $first: '$payment.transactionId' },
                transactionDate: { $first: '$payment.createdAt' },
                tokenCount: { $first: '$payment.quantity' },
                buyerId: { $first: '$buyerId' },
                buyerName: {
                  $first: {
                    $concat: ['$buyer.firstName', ' ', '$buyer.lastName'],
                  },
                },
                sellerId: { $first: '$payment.sellerId' },
                sellerName: {
                  $first: {
                    $concat: [
                      { $ifNull: ['$seller.firstName', 'N/A'] },
                      ' ',
                      { $ifNull: ['$seller.lastName', ''] },
                    ],
                  },
                },
                assetId: { $first: '$assetId' },
                assetName: { $first: '$asset.name' },
                amount: { $first: '$payment.amount' },
                paymentStatus: { $first: '$payment.paymentStatus' },
                paymentMethod: { $first: '$payment.paymentMethod' },
              },
            },

            { $sort: { transactionDate: -1 } },

            { $skip: skip },
            { $limit: size },
          ],

          totalCount: [
            {
              $lookup: {
                from: 'payments',
                localField: 'transactionId',
                foreignField: '_id',
                as: 'payment',
              },
            },
            { $unwind: '$payment' },
            {
              $lookup: {
                from: 'assets',
                localField: 'assetId',
                foreignField: '_id',
                as: 'asset',
              },
            },
            { $unwind: '$asset' },

            {
              $group: {
                _id: '$transactionId',
              },
            },
            { $count: 'count' },
          ],
        },
      },

      {
        $project: {
          data: '$data',
          limit: { $literal: size },
          page: { $literal: page },
          total: {
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
          totalPages: {
            $ceil: {
              $divide: [
                {
                  $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
                },
                size,
              ],
            },
          },
        },
      },
    ];

    return this.tokenRepository.findAllTokenTransactions(pipeline);
  }

  async validateThePayment(checkoutSessionId: string): Promise<Payment> {
    const existingPaymentDetails =
      await this.paymentRepository.findOne(checkoutSessionId);

    if (!existingPaymentDetails)
      throw new Error(ERROR_MESSAGES.RESPONSES.STRIPE.PAYMENT_NOT_FOUND);

    if (
      !existingPaymentDetails.transactionId ||
      existingPaymentDetails.paymentStatus === PAYMENT_STATUS.PENDING
    )
      throw new Error(ERROR_MESSAGES.RESPONSES.STRIPE.PAYMENT_NOT_COMPLETED);

    if (existingPaymentDetails.paymentStatus === PAYMENT_STATUS.REFUNDED)
      throw new Error(ERROR_MESSAGES.RESPONSES.STRIPE.PAYMENT_ALREADY_REFUNDED);

    const { transfer_group: transferGroup } =
      await this.stripeServices.getPaymentIntentDetails(
        existingPaymentDetails.transactionId,
      );
    if (transferGroup)
      throw new Error(
        ERROR_MESSAGES.RESPONSES.STRIPE.PAYMENT_ALREADY_TRANSFERRED,
      );

    return existingPaymentDetails;
  }
}
