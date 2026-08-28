export enum ErrorCode {
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SLOT_EXPIRED = 'SLOT_EXPIRED',
  SLOT_ALREADY_BOOKED = 'SLOT_ALREADY_BOOKED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, statusCode?: number, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public static fromApiError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }
    const statusCode = error?.response?.status;
    const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
    
    let code = ErrorCode.UNKNOWN_ERROR;
    if (statusCode === 401) code = ErrorCode.UNAUTHORIZED;
    else if (statusCode === 403) code = ErrorCode.FORBIDDEN;
    else if (statusCode === 404) code = ErrorCode.NOT_FOUND;
    else if (statusCode === 409) code = ErrorCode.SLOT_ALREADY_BOOKED;
    else if (statusCode >= 500) code = ErrorCode.INTERNAL_SERVER_ERROR;
    else if (!error.response && error.message?.includes('Network Error')) {
      code = ErrorCode.NETWORK_UNAVAILABLE;
    }

    return new AppError(message, code, statusCode, error);
  }
}
