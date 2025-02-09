import { z } from 'zod';

/**
 * Platform represents a specific execution environment configuration
 * e.g. Node.js 18, Python 3.9, etc.
 */
export const PlatformSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  image: z.string(), // Docker image or other provider-specific identifier
  defaultResources: z
    .object({
      memoryMb: z.number().min(512).default(2048),
      cpuCount: z.number().min(1).default(2),
    })
    .optional(),
  metadata: z.record(z.string()).optional(),
});

export type Platform = z.infer<typeof PlatformSchema>;

/**
 * Platform provider configuration
 */
export const PlatformProviderConfigSchema = z.object({
  platforms: z.array(PlatformSchema),
  defaultPlatform: z.string(), // ID of the default platform
});

export type PlatformProviderConfig = z.infer<
  typeof PlatformProviderConfigSchema
>;

/**
 * Runtime creation options including platform selection and configuration
 */
export const RuntimeCreationOptionsSchema = z.object({
  platformId: z.string(),
  config: z
    .object({
      memoryMb: z.number().optional(),
      cpuCount: z.number().optional(),
      timeoutMs: z.number().optional(),
      env: z.record(z.string()).optional(),
      metadata: z.record(z.string()).optional(),
    })
    .optional(),
});

export type RuntimeCreationOptions = z.infer<
  typeof RuntimeCreationOptionsSchema
>;

/**
 * Error thrown when platform is not found
 */
export class PlatformNotFoundError extends Error {
  constructor(platformId: string) {
    super(`Platform with ID "${platformId}" not found`);
    this.name = 'PlatformNotFoundError';
  }
}
