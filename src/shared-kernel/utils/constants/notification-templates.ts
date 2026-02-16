const truncate = (str: string) => {
  const maxLength = 15;
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

export const NOTIFICATION_TEMPLATE = {
  ASSET: {
    featuredAsset: (assetName: string) =>
      `Your asset ["${assetName}] is now live and available on RareAgora!`,

    approvedAsset: (assetName: string) =>
      `Your asset "${assetName}" has been approved by the admin.`,

    approvingAsset: (assetName: string, walletAddress?: string) =>
      walletAddress
        ? `Your Asset "${assetName}" has been approved by the admin and it is connected to this ${walletAddress}`
        : `Your Asset "${assetName}" has been approved by the admin. Please connect your wallet to proceed with listing.`,

    liveAsset: (assetName: string) =>
      `Your asset "${assetName}" is now live and available on RareAgora!`,

    rejectedAsset: (assetName: string) =>
      `Your asset "${assetName}" has been rejected by the admin.`,

    holdAsset: (assetName: string) =>
      `Your asset "${assetName}" is currently on hold.`,

    delistedAsset: (assetName: string) =>
      `Your asset "${assetName}" has been delisted from RareAgora.`,

    deletedAsset: (assetName: string) =>
      `Your asset "${assetName}" has been deleted from RareAgora.`,

    userExclusiveAsset: (assetName: string) =>
      `Asset "${assetName}" has been live now!`,
  },
  DOCUMENT: {
    documentPending: (
      documentName: string,
      documentType: string,
      assetName: string,
    ) =>
      `Your document "${truncate(documentName)}" under "${documentType}" for asset "${assetName}" is pending admin review.`,

    documentApproved: (
      documentName: string,
      documentType: string,
      assetName: string,
    ) =>
      `Your document "${truncate(documentName)}" under "${documentType}" for asset "${assetName}" has been approved!`,

    documentRejected: (
      documentName: string,
      documentType: string,
      assetName: string,
    ) =>
      `Your document "${truncate(documentName)}" under "${documentType}" for asset "${assetName}" was rejected by the admin.`,
  },
};
