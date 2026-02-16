import { NextResponse } from 'next/server';
import { logger } from './logger';

export enum ErrorCode {
  // OAuth Errors
  INVALID_STATE = 'INVALID_STATE',
  INVALID_AUTH_CODE = 'INVALID_AUTH_CODE',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  
  // Validation Errors
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  WAFEQ_CONNECTION_FAILED = 'WAFEQ_CONNECTION_FAILED',
  GHL_CONNECTION_FAILED = 'GHL_CONNECTION_FAILED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // OAuth
  [ErrorCode.INVALID_STATE]: 'Invalid OAuth state parameter',
  [ErrorCode.INVALID_AUTH_CODE]: 'Invalid or expired authorization code',
  [ErrorCode.TOKEN_EXCHANGE_FAILED]: 'Failed to exchange authorization code for token',
  
  // Validation
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCode.INVALID_LOCATION_ID]: 'Invalid location ID format',
  [ErrorCode.INVALID_API_KEY]: 'Invalid or expired API key',
  
  // Database
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.RECORD_NOT_FOUND]: 'Requested record not found',
  [ErrorCode.DUPLICATE_RECORD]: 'Record already exists',
  
  // External Services
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error occurred',
  [ErrorCode.WAFEQ_CONNECTION_FAILED]: 'Failed to connect to Wafeq service',
  [ErrorCode.GHL_CONNECTION_FAILED]: 'Failed to connect to GoHighLevel service',
  
  // Server
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.FORBIDDEN]: 'Access forbidden',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || 'An unexpected error occurred';
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString();

  if (error instanceof ApiError) {
    logger.error(`API Error [${error.code}]: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
          timestamp,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    const statusCode = 400;
    logger.error('JSON Parse Error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: 'Invalid JSON format',
          statusCode,
          timestamp,
        },
      },
      { status: statusCode }
    );
  }

  if (error instanceof Error) {
    logger.error('Unexpected Error', error);
  } else {
    logger.error('Unknown Error', { error: String(error) });
  }

  const statusCode = 500;
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR),
        statusCode,
        timestamp,
      },
    },
    { status: statusCode }
  );
}

export function handleSuccess<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
