export const EMAIL_CONSTANTS = {
  ASSET: {
    APPROVED: {
      SUBJECT: 'Asset approved',
      TEMPLATE: 'approved',
    },
    REJECTED: {
      subject: 'Asset Rejected',
      template: 'rejected',
    },
    HOLD: {
      subject: 'Asset on hold',
      template: 'hold',
    },
    LIST: {
      subject: 'Asset listed',
      template: 'live',
    },
    DELIST: {
      subject: 'Asset delisted',
      template: 'delisted',
    },
    DELETE: {
      subject: 'Asset deleted',
      template: 'deleted',
    },
    FEATURE_ASSET: {
      SUBJECT: 'Exclusive asset',
      TEMPLATE_FILE_KEY: 'exclusive-asset',
    },
    getAssetLink: (assetId) => `https://dev.rareagora.com/asset/${assetId}`,
  },
  DOCUMENT: {
    PENDING: {
      SUBJECT: 'Document approval removed',
      template: 'doc-pending',
    },
    APPROVED: {
      SUBJECT: 'Document approved',
      template: 'doc-approved',
    },
    REJECTED: {
      SUBJECT: 'Document rejected',
      template: 'doc-rejected',
    },
  },
  USER: {
    TERMINATED: {
      SUBJECT: 'User Terminated',
      TEMPLATE_FILE_KEY: 'terminated-user',
    },
    SUSPENDED: {
      SUBJECT: 'User Suspended',
      TEMPLATE_FILE_KEY: 'suspended-user',
    },
    ACTIVATED: { SUBJECT: 'User Activated', TEMPLATE_FILE_KEY: 'active-user' },
  },
  ADMIN: {
    CREATED: {
      SUBJECT: 'Admin account created successfully',
      TEMPLATE_FILE_KEY: 'admin-created',
    },
  },
};
