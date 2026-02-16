export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VERIFY = 'verify',
  REJECT = 'reject',
  BLOCK = 'block',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
}

export enum AuditEntityType {
  USER = 'user',
  ASSET = 'asset',
  PAYMENT = 'payment',
  KYC = 'kyc',
  DISPUTE = 'dispute',
  REFUND = 'refund',
}
