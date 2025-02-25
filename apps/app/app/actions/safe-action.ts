import { BaseError } from '@repo/services/errors/base';
import { createSafeActionClient } from 'next-safe-action';

// Base action client with error handling
export const action = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof BaseError) {
      return error.message;
    }
    console.error('Unexpected error:', error);
    return 'An unexpected error occurred';
  },
});

export function handleActionError(error: unknown): string {
  if (error instanceof BaseError) {
    return error.message;
  }
  console.error('Unexpected error:', error);
  return 'An unexpected error occurred';
}
