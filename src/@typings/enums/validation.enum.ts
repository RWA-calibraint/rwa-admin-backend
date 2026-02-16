export enum ValidationErrorType {
  REQUIRED = 'required',
  INVALID_FORMAT = 'invalid_format',
  OUT_OF_RANGE = 'out_of_range',
  UNIQUE_CONSTRAINT = 'unique_constraint',
  CUSTOM = 'custom',
}

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}
