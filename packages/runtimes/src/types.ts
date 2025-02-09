import { z } from 'zod';

/**
 * Runtime status represents the current state of a runtime instance
 */
export enum RuntimeStatus {
  CREATING = 'creating',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

/**
 * Base configuration that all runtime providers must support
 */
export const BaseRuntimeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  memoryMb: z.number().min(512).default(2048),
  cpuCount: z.number().min(1).default(2),
  timeoutMs: z.number().min(1000).default(300000), // 5 minutes default
  env: z.record(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
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
export enum RuntimeEventType {
  STATUS_CHANGED = 'status_changed',
  METRICS_UPDATED = 'metrics_updated',
  ERROR = 'error',
}

export interface RuntimeEvent {
  type: RuntimeEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Base runtime error types
 */
export class RuntimeError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = 'RuntimeError';
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
