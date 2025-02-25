import type { TimeRange, UsageSummary, UsageTimeSeries } from '@repo/services';

export interface UsageState {
  usageSummary: UsageSummary | null;
  timeSeriesData: UsageTimeSeries | null;
  isLoading: boolean;
  error: string | null;
}

export interface UsageActions {
  fetchUsageSummary: () => Promise<void>;
  fetchTimeSeriesData: (timeRange: TimeRange) => Promise<void>;
  reset: () => void;
}
