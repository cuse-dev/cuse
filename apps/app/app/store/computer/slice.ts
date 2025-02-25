import { toast } from '@repo/design-system/hooks/use-toast';
import { logger } from '@repo/logger';
import type { StateCreator } from 'zustand';
import {
  createComputer as createComputerAction,
  deleteComputer as deleteComputerAction,
  listActions as listActionsAction,
  listComputers as listComputersAction,
  startComputer as startComputerAction,
  stopComputer as stopComputerAction,
  updateComputer as updateComputerAction,
} from '../../actions/computer';
import type { ComputerActions, ComputerState } from './types';

const initialState: ComputerState = {
  computers: [],
  actions: [],
  isLoading: false,
  error: null,
};

export const createComputerSlice: StateCreator<
  ComputerState & ComputerActions
> = (set, get) => ({
  ...initialState,

  fetchComputers: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await listComputersAction();
      if (result?.data) {
        set({ computers: result.data, isLoading: false });
      } else {
        set({ error: 'Failed to fetch computers', isLoading: false });
      }
    } catch (error) {
      logger.error('Failed to fetch computers', { error });
      set({ error: 'Failed to fetch computers', isLoading: false });
    }
  },

  createComputer: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const result = await createComputerAction(data);
      if (result) {
        await get().fetchComputers();
        toast({
          title: 'Computer created successfully',
        });
      } else {
        set({ error: 'Failed to create computer', isLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create computer';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to create computer',
        description: message,
        variant: 'destructive',
      });
    }
  },

  updateComputer: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const result = await updateComputerAction({ id, data });
      if (result?.data) {
        await get().fetchComputers();
        toast({
          title: 'Computer updated successfully',
        });
      } else {
        set({ error: 'Failed to update computer', isLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update computer';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to update computer',
        description: message,
        variant: 'destructive',
      });
    }
  },

  deleteComputer: async (id) => {
    try {
      // Optimistically remove the computer from the state
      const currentComputers = get().computers;
      set({
        computers: currentComputers.filter((c) => c.id !== id),
        isLoading: true,
        error: null,
      });

      const result = await deleteComputerAction({ id });

      // If there was an error
      if (!result?.data && (result?.validationErrors || result?.serverError)) {
        // Revert the state
        set({
          computers: currentComputers,
          error: result.serverError || 'Failed to delete computer',
          isLoading: false,
        });
        toast({
          title: 'Failed to delete computer',
          description: result.serverError || 'Failed to delete computer',
          variant: 'destructive',
        });
      } else {
        set({ isLoading: false });
        toast({
          title: 'Computer deleted successfully',
        });
      }
    } catch (error) {
      // If there was an error, revert the state
      const currentComputers = get().computers;
      const message =
        error instanceof Error ? error.message : 'Failed to delete computer';
      set({
        computers: currentComputers,
        error: message,
        isLoading: false,
      });
      toast({
        title: 'Failed to delete computer',
        description: message,
        variant: 'destructive',
      });
    }
  },

  startComputer: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const result = await startComputerAction({ id });
      if (result?.data) {
        await get().fetchComputers();
        toast({
          title: 'Computer started successfully',
        });
      } else {
        set({ error: 'Failed to start computer', isLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start computer';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to start computer',
        description: message,
        variant: 'destructive',
      });
    }
  },

  stopComputer: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const result = await stopComputerAction({ id });
      if (result?.data) {
        await get().fetchComputers();
        toast({
          title: 'Computer stopped successfully',
        });
      } else {
        set({ error: 'Failed to stop computer', isLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to stop computer';
      set({ error: message, isLoading: false });
      toast({
        title: 'Failed to stop computer',
        description: message,
        variant: 'destructive',
      });
    }
  },

  fetchActions: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await listActionsAction({ id });
      if (result?.data) {
        set({ actions: result.data, isLoading: false });
      } else {
        set({ error: 'Failed to fetch actions', isLoading: false });
      }
    } catch (error) {
      logger.error('Failed to fetch actions', { error });
      set({ error: 'Failed to fetch actions', isLoading: false });
    }
  },

  reset: () => {
    set(initialState);
  },
});
