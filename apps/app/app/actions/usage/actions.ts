'use server';

import { timeRangeSchema, usageService } from '@repo/services';
import { z } from 'zod';
import { action } from '../safe-action';

// Empty schema for usage summary action
const usageSummarySchema = z.void();

// Schema for time series data
const timeSeriesSchema = z.object({
  timeRange: timeRangeSchema,
});

export const getUsageSummary = action
  .schema(usageSummarySchema)
  .action(async () => {
    const summary = await usageService.getSummary();
    return summary;
  });

export const getTimeSeriesData = action
  .schema(timeSeriesSchema)
  .action(async ({ clientInput }) => {
    const data = await usageService.getTimeSeriesData(clientInput.timeRange);
    return data;
  });
