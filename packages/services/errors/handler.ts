import { logger } from '@repo/logger';
import { BaseError, type ErrorContext, InternalError } from './base';

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStack?: boolean;
  defaultMessage?: string;
}

const defaultOptions: ErrorHandlerOptions = {
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development',
  defaultMessage: 'An unexpected error occurred',
};

export class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = defaultOptions) {
    this.options = options;
  }

  /**
   * Handles any error by converting it to a BaseError
   */
  handle(error: unknown, context?: ErrorContext): BaseError {
    const errorContext = { ...context, timestamp: new Date() };

    // If it's already a BaseError, just return it
    if (BaseError.isBaseError(error)) {
      this.logError(error);
      return error;
    }

    // If it's a standard Error, convert it
    if (error instanceof Error) {
      const baseError = new InternalError(
        error.message || this.options.defaultMessage!,
        error,
        errorContext
      );
      this.logError(baseError);
      return baseError;
    }

    // For unknown errors, create a new InternalError
    const baseError = new InternalError(
      this.options.defaultMessage!,
      error,
      errorContext
    );
    this.logError(baseError);
    return baseError;
  }

  /**
   * Logs the error if logging is enabled
   */
  private logError(error: BaseError): void {
    if (!this.options.logErrors) return;

    const logContext = {
      code: error.code,
      status: error.status,
      context: error.context,
      stack: this.options.includeStack ? error.stack : undefined,
    };

    if (error.status >= 500) {
      logger.error(error.message, logContext);
    } else {
      logger.warn(error.message, logContext);
    }
  }
}

// Create a default instance
export const errorHandler = new ErrorHandler();
