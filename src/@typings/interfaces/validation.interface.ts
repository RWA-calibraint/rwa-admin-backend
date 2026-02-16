import {
  ValidationErrorType,
  ValidationSeverity,
} from '../enums/validation.enum';

export interface ValidationError {
  field: string;
  type: ValidationErrorType;
  message: string;
  severity?: ValidationSeverity;
  constraints?: Record<string, any>;
}

export interface ErrorResponse {
  code: string;
  message: string;
  errors?: ValidationError[];
  stack?: string;
  timestamp: Date;
  path: string;
  method: string;
}

export interface ValidationRule {
  type: ValidationErrorType;
  message: string;
  severity?: ValidationSeverity;
  validate: (value: any) => boolean;
  params?: Record<string, any>;
}

export interface ValidationSchema {
  [field: string]: {
    rules: ValidationRule[];
    isRequired: boolean;
    customValidate?: (
      value: any,
      allValues: Record<string, any>,
    ) => ValidationError | null;
  };
}
