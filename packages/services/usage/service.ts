import { database } from '@repo/database';
import { logger } from '@repo/logger';
import { addDays, endOfDay, format, startOfDay, subDays } from 'date-fns';
import 'server-only';
import { errorHandler } from '../errors/handler';
import { validateData } from '../validation/utils';
import { UsageError } from './errors';
import {
  type TimeRange,
  type UsageSummary,
  type UsageTimeSeries,
  timeRangeSchema,
  usageSummarySchema,
  usageTimeSeriesSchema,
} from './schema';

const VALID_TIME_RANGES = ['7d', '30d', '90d'] as const;

export function createUsageService(
  prismaAction = database.action,
  prismaComputer = database.computerInstance
) {
  return {
    async getSummary(): Promise<UsageSummary> {
      try {
        // Get total actions
        const totalActions = await prismaAction.count();

        // Get total instances count
        const totalInstances = await prismaComputer.count();

        // Get running instances count
        const runningInstances = await prismaComputer.count({
          where: {
            sandboxId: {
              not: null,
            },
          },
        });

        // Get most used platform
        const platforms = await prismaComputer.groupBy({
          by: ['platform'],
          _count: {
            platform: true,
          },
          orderBy: {
            _count: {
              platform: 'desc',
            },
          },
          take: 1,
        });

        const mostUsedPlatform = platforms[0]?.platform ?? 'None';

        const summary = {
          totalActions,
          totalInstances,
          runningInstances,
          mostUsedPlatform,
        };

        // Validate the summary data before returning
        return await validateData(
          usageSummarySchema,
          summary,
          'Invalid usage summary data'
        );
      } catch (error) {
        logger.error('Error getting usage summary:', { error });
        throw errorHandler.handle(error, { operation: 'getSummary' });
      }
    },

    async getTimeSeriesData(
      timeRange: TimeRange = '30d'
    ): Promise<UsageTimeSeries> {
      try {
        // Validate time range
        await validateData(timeRangeSchema, timeRange, 'Invalid time range');

        const now = new Date();
        const endDate = endOfDay(now);
        const daysToSubtract =
          timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
        const startDate = startOfDay(subDays(now, daysToSubtract - 1)); // -1 to include today

        // Get all actions within the time range
        const actions = await prismaAction.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            computerId: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Group actions by day and count unique computers
        const data = [];
        let currentDay = startDate;
        while (currentDay <= endDate) {
          const dayStr = format(currentDay, 'yyyy-MM-dd');
          const dayStart = startOfDay(currentDay);
          const dayEnd = endOfDay(currentDay);

          // Get actions for the current day
          const dayActions = actions.filter(
            (action) =>
              action.createdAt >= dayStart && action.createdAt <= dayEnd
          );

          // Count unique computers for the day
          const uniqueComputers = new Set(
            dayActions.map((action) => action.computerId)
          );

          data.push({
            date: dayStr,
            actions: dayActions.length,
            computers: uniqueComputers.size,
          });

          currentDay = addDays(currentDay, 1);
        }

        const timeSeries = {
          data,
          timeRange,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        };

        // Validate the time series data before returning
        return await validateData(
          usageTimeSeriesSchema,
          timeSeries,
          'Invalid time series data'
        );
      } catch (error) {
        logger.error('Error getting time series data:', { error });
        if (error instanceof UsageError) {
          throw error;
        }
        throw errorHandler.handle(error, {
          operation: 'getTimeSeriesData',
          timeRange,
        });
      }
    },
  };
}

// Create a default instance using the database client
export const usageService = createUsageService();
