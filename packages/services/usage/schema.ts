import { z } from 'zod';
import { baseSchemas } from '../validation/database-types';
import { commonSchemas } from '../validation/utils';

export const timeRangeSchema = commonSchemas.timeRange;
export type TimeRange = z.infer<typeof timeRangeSchema>;

export const usageMetricSchema = z
  .object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    timestamp: commonSchemas.timestamp,
  })
  .strict();

export const usageDataPointSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    actions: z.number().int().min(0),
    computers: z.number().int().min(0),
  })
  .strict();

export const usageTimeSeriesSchema = z
  .object({
    data: z.array(usageDataPointSchema),
    timeRange: timeRangeSchema,
    startDate: z.string(),
    endDate: z.string(),
  })
  .strict();

export const usageSummarySchema = z
  .object({
    totalActions: z.number().int().min(0),
    totalInstances: z.number().int().min(0),
    runningInstances: z.number().int().min(0),
    mostUsedPlatform: z.string(),
    metrics: z.array(usageMetricSchema).optional(),
  })
  .strict();

// Action schema that extends the base action schema with specific usage data
export const usageActionSchema = baseSchemas.action.extend({
  data: z.object({
    type: z.string(),
    details: z.record(z.string(), z.unknown()),
    duration: z.number().optional(),
    status: z.enum(['success', 'failure']).optional(),
  }),
});

export type UsageMetric = z.infer<typeof usageMetricSchema>;
export type UsageDataPoint = z.infer<typeof usageDataPointSchema>;
export type UsageTimeSeries = z.infer<typeof usageTimeSeriesSchema>;
export type UsageSummary = z.infer<typeof usageSummarySchema>;
export type UsageAction = z.infer<typeof usageActionSchema>;

export const validateTimeRange = (timeRange: unknown): TimeRange => {
  return timeRangeSchema.parse(timeRange);
};

export const validateUsageDataPoint = (data: unknown): UsageDataPoint => {
  return usageDataPointSchema.parse(data);
};

export const validateUsageTimeSeries = (data: unknown): UsageTimeSeries => {
  return usageTimeSeriesSchema.parse(data);
};

export const validateUsageSummary = (data: unknown): UsageSummary => {
  return usageSummarySchema.parse(data);
};
