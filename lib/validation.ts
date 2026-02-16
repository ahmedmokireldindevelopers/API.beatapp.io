import { z } from 'zod';
import { ApiError, ErrorCode } from './error-handler';

/**
 * Validation schemas for API requests
 */

export const LocationIdSchema = z
  .string()
  .min(1, 'Location ID is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Location ID must contain only alphanumeric characters, hyphens, and underscores');

export const ApiKeySchema = z
  .string()
  .min(10, 'API key must be at least 10 characters')
  .max(500, 'API key is too long');

export const OAuthStateSchema = z
  .string()
  .min(20, 'OAuth state must be at least 20 characters');

export const OAuthCodeSchema = z
  .string()
  .min(10, 'Authorization code must be at least 10 characters');

// Wafeq Link Request
export const WafeqLinkRequestSchema = z.object({
  locationId: LocationIdSchema,
  apiKey: ApiKeySchema,
});

// Wafeq Revoke Request
export const WafeqRevokeRequestSchema = z.object({
  locationId: LocationIdSchema,
});

// OAuth Callback Request
export const OAuthCallbackQuerySchema = z.object({
  code: OAuthCodeSchema,
  state: OAuthStateSchema,
});

/**
 * Validate request data and throw ApiError if invalid
 */
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  errorCode: ErrorCode = ErrorCode.BAD_REQUEST
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new ApiError(
        errorCode,
        400,
        'Validation failed',
        { errors: fieldErrors }
      );
    }

    throw error;
  }
}
