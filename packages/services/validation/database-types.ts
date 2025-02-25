import { $Enums } from '@repo/database';
import { z } from 'zod';
import { commonSchemas } from './utils';
/**
 * Enum matching Prisma ComputerPlatform
 */
export const ComputerPlatformEnum = z.enum([
  $Enums.ComputerPlatform.MACOS,
  $Enums.ComputerPlatform.WINDOWS,
  $Enums.ComputerPlatform.LINUX,
  $Enums.ComputerPlatform.BROWSER,
]);
export type ComputerPlatform = z.infer<typeof ComputerPlatformEnum>;

/**
 * Base schemas that match Prisma models exactly
 */
export const baseSchemas = {
  computerInstance: z.object({
    id: commonSchemas.id,
    name: z.string(),
    platform: ComputerPlatformEnum,
    sandboxId: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  action: z.object({
    id: commonSchemas.id,
    computerId: z.string(),
    data: z.record(z.string(), z.unknown()),
    createdAt: z.date(),
  }),
} as const;
