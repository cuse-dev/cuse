import { z } from 'zod';
import type { BaseRuntime } from './runtime';

/**
 * Runtime status represents the current state of a runtime instance
 */
export const RuntimeStatus = {
  CREATING: 'creating',
  RUNNING: 'running',
  STOPPED: 'stopped',
  ERROR: 'error',
  TERMINATED: 'terminated',
} as const;

export type RuntimeStatus = (typeof RuntimeStatus)[keyof typeof RuntimeStatus];

/**
 * Base configuration that all runtime providers must support
 */
export const BaseRuntimeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  memoryMb: z.number().min(512).default(2048),
  cpuCount: z.number().min(1).default(2),
  timeoutMs: z.number().min(1000).default(300000), // 5 minutes default
  env: z.record(z.string()),
  metadata: z.record(z.string()).default({}),
});

export type BaseRuntimeConfig = z.infer<typeof BaseRuntimeConfigSchema>;

/**
 * Runtime capabilities define what features a runtime instance supports
 */
export interface RuntimeCapabilities {
  supportsGpu: boolean;
  supportsCustomImages: boolean;
  supportsFileSystem: boolean;
  supportsNetworking: boolean;
  maxMemoryMb: number;
  maxCpuCount: number;
  maxTimeoutMs: number;
}

/**
 * Runtime metrics provide information about resource usage
 */
export interface RuntimeMetrics {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  networkInBytes: number;
  networkOutBytes: number;
  diskUsageBytes: number;
}

/**
 * Runtime events that can be emitted by the runtime instance
 */
export const RuntimeEventType = {
  STATUS_CHANGED: 'status_changed',
  METRICS_UPDATED: 'metrics_updated',
  ERROR: 'error',
} as const;

export type RuntimeEventType =
  (typeof RuntimeEventType)[keyof typeof RuntimeEventType];

export interface RuntimeEvent {
  type: RuntimeEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Base runtime error types
 */
export class RuntimeError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
  }
}

export class RuntimeInitializationError extends RuntimeError {
  constructor(message: string) {
    super(message, 'RUNTIME_INIT_ERROR');
    this.name = 'RuntimeInitializationError';
  }
}

export class RuntimeOperationError extends RuntimeError {
  constructor(message: string) {
    super(message, 'RUNTIME_OPERATION_ERROR');
    this.name = 'RuntimeOperationError';
  }
}

/**
 * Runtime connection options for establishing connection to the runtime instance
 */
export interface RuntimeConnectionOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  metricsInterval?: number;
  socketPath?: string;
  host?: string;
  port?: number;
  protocol?: 'http' | 'https';
  ca?: string;
  cert?: string;
  key?: string;
}

/**
 * Log options for retrieving runtime instance logs
 */
export interface RuntimeLogOptions {
  /** Number of lines to retrieve from the end of logs. If not specified, returns all logs */
  tail?: number;
  /** Whether to follow the log output */
  follow?: boolean;
  /** Timestamp to retrieve logs since (ISO string or Date) */
  since?: string | Date;
  /** Whether to include timestamps in the log output */
  timestamps?: boolean;
}

/**
 * Runtime creation options including platform selection and configuration
 */
export interface RuntimeCreationOptions<
  T extends BaseRuntimeConfig = BaseRuntimeConfig,
> {
  platformId: string;
  config?: Partial<T>;
}

/**
 * Interface for container lifecycle management
 */
export interface Runtime {
  readonly id: string;
  readonly name?: string;
  readonly status: RuntimeStatus;
  readonly config: BaseRuntimeConfig;
  readonly capabilities: RuntimeCapabilities;

  // Lifecycle methods
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  terminate(): Promise<void>;

  // Status and metrics
  getStatus(): Promise<RuntimeStatus>;
  getMetrics(): Promise<RuntimeMetrics>;

  // Logs
  getLogs(options?: RuntimeLogOptions): Promise<string>;
  followLogs(
    onData: (data: string) => void,
    onError: (error: Error) => void,
    options?: Omit<RuntimeLogOptions, 'follow'>
  ): Promise<() => void>;

  // Event handling
  on(event: RuntimeEventType, listener: (event: RuntimeEvent) => void): void;
  off(event: RuntimeEventType, listener: (event: RuntimeEvent) => void): void;
}

/**
 * RuntimeProvider is responsible for creating and managing runtime instances
 * for a specific infrastructure provider (e.g. Docker, AWS, etc.)
 */
export interface RuntimeProvider<
  T extends BaseRuntime,
  C extends BaseRuntimeConfig = BaseRuntimeConfig,
> {
  /**
   * Get available platforms for this provider
   */
  getPlatforms(): Platform[];

  /**
   * Get a specific platform by ID
   */
  getPlatform(id: string): Platform | undefined;

  /**
   * Create a new container for the specified platform
   */
  createInstance(options: RuntimeCreationOptions<C>): Promise<T>;

  /**
   * Get a specific runtime instance by ID
   */
  getInstance(id: string): Promise<T | undefined>;

  /**
   * List all runtime instances
   */
  listInstances(): Promise<T[]>;

  /**
   * Index currently running runtime instances
   */
  indexInstances(): Promise<Record<string, T>>;
}

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
 * Runtime provider configuration
 */
export const RuntimeProviderConfigSchema = z.object({
  platforms: z.array(PlatformSchema),
  defaultPlatform: z.string(), // ID of the default platform
});

export type RuntimeProviderConfig = z.infer<typeof RuntimeProviderConfigSchema>;
