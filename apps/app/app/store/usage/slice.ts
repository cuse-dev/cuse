import { toast } from '@repo/design-system/hooks/use-toast';
import { logger } from '@repo/logger';
import type { TimeRange } from '@repo/services/usage';
import type { StateCreator } from 'zustand';
import {
  getTimeSeriesData,
  getUsageSummary,
} from '../../actions/usage/actions';
import type { UsageActions, UsageState } from './types';

const initialState: UsageState = {
  usageSummary: null,
  timeSeriesData: null,
  isLoading: false,
  error: null,
};

export const createUsageSlice: StateCreator<UsageState & UsageActions> = (
  set
) => ({
  ...initialState,

  fetchUsageSummary: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await getUsageSummary();
      if (result?.data) {
        set({ usageSummary: result.data, isLoading: false });
      } else {
        set({ error: 'Failed to fetch usage summary', isLoading: false });
      }
    } catch (error) {
      logger.error('Failed to fetch usage summary', { error });
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch usage summary';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to fetch usage summary',
        description: message,
        variant: 'destructive',
      });
    }
  },

  fetchTimeSeriesData: async (timeRange: TimeRange = '30d') => {
    try {
      set({ isLoading: true, error: null });
      const result = await getTimeSeriesData({ timeRange });
      if (result?.data) {
        set({ timeSeriesData: result.data, isLoading: false });
      } else {
        set({ error: 'Failed to fetch time series data', isLoading: false });
      }
    } catch (error) {
      logger.error('Failed to fetch time series data', { error });
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch time series data';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to fetch time series data',
        description: message,
        variant: 'destructive',
      });
    }
  },

  reset: () => {
    set(initialState);
  },
});
