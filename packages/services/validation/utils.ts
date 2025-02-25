import { z } from 'zod';
import { ValidationError } from '../errors/base';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

/**
 * Validates data against a schema and returns a strongly typed result
 */
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        errorMessage || 'Validation failed',
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().uuid(),
  timestamp: z.date(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  timeRange: z.enum(['7d', '30d', '90d']),
} as const;
