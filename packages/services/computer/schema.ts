import {
  $Enums,
  type ComputerInstance,
  type Action as DbAction,
} from '@repo/database';
import { z } from 'zod';

export type Computer = ComputerInstance;
export type Action = DbAction;

export const computerSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(1),
  platform: z.nativeEnum($Enums.ComputerPlatform),
  sandboxId: z.string().optional(),
  metadata: z.record(z.any()),
});

export const updateComputerSchema = z.object({
  id: z.string(),
  data: computerSchema.omit({ platform: true }).partial(),
});

export const deleteComputerSchema = z.object({
  id: z.string(),
});

// Schema for starting/stopping a computer
export const computerIdSchema = z.object({
  id: z.string(),
});

export const actionSchema = z.object({
  id: z.string(),
  computerId: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()),
  createdAt: z.date(),
});

export const actionInputSchema = z.object({
  computerId: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()),
});

export type ComputerInput = z.infer<typeof computerSchema>;
export type ActionInput = z.infer<typeof actionInputSchema>;
