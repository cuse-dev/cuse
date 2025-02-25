import { create } from 'zustand';

import { createComputerSlice } from './computer/slice';
import type { ComputerActions, ComputerState } from './computer/types';
import { createUsageSlice } from './usage/slice';
import type { UsageActions, UsageState } from './usage/types';

export const useStore = create<
  ComputerState & ComputerActions & UsageState & UsageActions
>()((...a) => ({
  ...createComputerSlice(...a),
  ...createUsageSlice(...a),
}));
