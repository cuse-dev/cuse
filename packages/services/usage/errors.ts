import { BaseError, type ErrorContext } from '../errors/base';
import { ERROR_CODES } from '../errors/codes';

export class UsageError extends BaseError {
  static limitExceeded(
    userId: string,
    metric: string,
    current: number,
    limit: number,
    context?: ErrorContext
  ) {
    return new UsageError(
      `User ${userId} has exceeded the ${metric} limit of ${limit} (current: ${current})`,
      ERROR_CODES.USAGE.LIMIT_EXCEEDED,
      403,
      {
        ...context,
        timestamp: new Date(),
        userId,
        metric,
        current,
        limit,
      }
    );
  }

  static invalidMetric(
    metric: string,
    validMetrics: string[],
    context?: ErrorContext
  ) {
    return new UsageError(
      `Invalid usage metric: ${metric}. Valid metrics are: ${validMetrics.join(', ')}`,
      ERROR_CODES.USAGE.INVALID_METRIC,
      400,
      {
        ...context,
        timestamp: new Date(),
        metric,
        validMetrics,
      }
    );
  }
}
