import type { Action, Computer, ComputerInput } from '@repo/services';

export interface ComputerState {
  computers: Computer[];
  actions: Action[];
  isLoading: boolean;
  error: string | null;
}

export interface ComputerActions {
  fetchComputers: () => Promise<void>;
  fetchActions: (id: string) => Promise<void>;
  createComputer: (data: ComputerInput) => Promise<void>;
  updateComputer: (id: string, data: Partial<ComputerInput>) => Promise<void>;
  deleteComputer: (id: string) => Promise<void>;
  startComputer: (id: string) => Promise<void>;
  stopComputer: (id: string) => Promise<void>;
  reset: () => void;
}
