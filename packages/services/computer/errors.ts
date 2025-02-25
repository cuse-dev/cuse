import { BaseError, type ErrorContext } from '../errors/base';
import { ERROR_CODES } from '../errors/codes';

export class ComputerError extends BaseError {
  static alreadyRunning(computerId: string, context?: ErrorContext) {
    return new ComputerError(
      `Computer ${computerId} is already running`,
      ERROR_CODES.COMPUTER.ALREADY_RUNNING,
      400,
      {
        ...context,
        timestamp: new Date(),
        computerId,
      }
    );
  }

  static alreadyStopped(computerId: string, context?: ErrorContext) {
    return new ComputerError(
      `Computer ${computerId} is already stopped`,
      ERROR_CODES.COMPUTER.ALREADY_STOPPED,
      400,
      {
        ...context,
        timestamp: new Date(),
        computerId,
      }
    );
  }

  static quotaExceeded(userId: string, limit: number, context?: ErrorContext) {
    return new ComputerError(
      `User ${userId} has exceeded the computer quota of ${limit}`,
      ERROR_CODES.COMPUTER.QUOTA_EXCEEDED,
      403,
      {
        ...context,
        timestamp: new Date(),
        userId,
        limit,
      }
    );
  }

  static invalidPlatform(
    platform: string,
    availablePlatforms: string[],
    context?: ErrorContext
  ) {
    return new ComputerError(
      `Invalid platform ${platform}. Available platforms: ${availablePlatforms.join(', ')}`,
      ERROR_CODES.COMPUTER.INVALID_PLATFORM,
      400,
      {
        ...context,
        timestamp: new Date(),
        platform,
        availablePlatforms,
      }
    );
  }

  static runtimeError(
    computerId: string,
    error: unknown,
    context?: ErrorContext
  ) {
    return new ComputerError(
      `Runtime error occurred for computer ${computerId}`,
      ERROR_CODES.COMPUTER.RUNTIME_ERROR,
      500,
      {
        ...context,
        timestamp: new Date(),
        computerId,
        originalError:
          process.env.NODE_ENV === 'development' ? error : undefined,
      }
    );
  }

  static notFound() {
    return new ComputerError(
      'Computer not found',
      ERROR_CODES.COMMON.NOT_FOUND,
      404
    );
  }

  static validation(errors: unknown[]) {
    return new ComputerError(
      'Validation failed',
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      400,
      { errors }
    );
  }

  static internal(error: unknown) {
    return new ComputerError(
      'Internal server error',
      ERROR_CODES.COMMON.INTERNAL,
      500,
      { error }
    );
  }
}
