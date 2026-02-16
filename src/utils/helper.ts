import { HttpException, HttpStatus } from '@nestjs/common';

import { AssetStatus } from 'src/@typings/enums';

export const constructResponse = (
  code: number,
  status: 'success' | 'failure',
  result: any = null,
  error: any = null,
) => {
  return {
    response_code: code,
    response_status: status,
    response: result,
    response_error: error,
    message: error,
  };
};

export const constructSuccessResponse = (result: any) =>
  constructResponse(HttpStatus.OK, 'success', result);

export const constructFailureResponse = (code: number, error: any) =>
  constructResponse(code, 'failure', null, error);

export const constructErrorResponse = (error: any) => {
  const errorMessage = error?.message || 'Internal Server Error';
  const statusCode =
    typeof error?.status === 'number' && Number.isInteger(error.status)
      ? error.status
      : HttpStatus.INTERNAL_SERVER_ERROR;
  throw new HttpException(
    constructFailureResponse(statusCode, errorMessage),
    statusCode,
  );
};

export const getAssetStatus = (assetStatus) => {
  if (assetStatus === AssetStatus.PENDING.toLowerCase()) {
    return [
      AssetStatus.NEWLY_ADDED,
      AssetStatus.RESUBMISSION,
      AssetStatus.HOLD,
      AssetStatus.DELIST,
      AssetStatus.SUBMISSION,
    ];
  } else if (assetStatus === AssetStatus.APPROVED.toLowerCase()) {
    return [
      AssetStatus.APPROVED,
      AssetStatus.LIVE,
      AssetStatus.GOING_LIVE,
      AssetStatus.SOLD,
    ];
  } else {
    return [AssetStatus.REJECTED];
  }
};

export const getCustomSort = (
  statusOrder: string[],
): { [key: string]: number } => {
  const sort: { [key: string]: number } = {};
  statusOrder.forEach((status, index) => {
    sort[`status.${status}`] = index;
  });
  return sort;
};
