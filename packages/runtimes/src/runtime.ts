import { EventEmitter } from 'node:events';
import {
  type BaseRuntimeConfig,
  type Runtime,
  type RuntimeCapabilities,
  type RuntimeConnectionOptions,
  RuntimeEventType,
  type RuntimeLogOptions,
  type RuntimeMetrics,
  RuntimeStatus,
} from './types';

/**
 * Abstract base class for container providers
 * Implements common functionality that all providers should have
 */
export abstract class BaseRuntime<
    T extends BaseRuntimeConfig = BaseRuntimeConfig,
  >
  extends EventEmitter
  implements Runtime
{
  private _status: RuntimeStatus = RuntimeStatus.CREATING;
  private _metrics: RuntimeMetrics = {
    cpuUsagePercent: 0,
    memoryUsageMb: 0,
    networkInBytes: 0,
    networkOutBytes: 0,
    diskUsageBytes: 0,
  };

  readonly config: T;
  protected readonly connectionOptions: RuntimeConnectionOptions;

  constructor(config: T, connectionOptions?: RuntimeConnectionOptions) {
    super();
    this.config = config;
    this.connectionOptions = connectionOptions ?? {};
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get status(): RuntimeStatus {
    return this._status;
  }

  abstract get capabilities(): RuntimeCapabilities;

  /**
   * Start the container
   */
  abstract start(): Promise<void>;

  /**
   * Stop the container
   */
  abstract stop(): Promise<void>;

  /**
   * Restart the container
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Terminate and cleanup the container
   */
  abstract terminate(): Promise<void>;

  /**
   * Get current container status
   */
  async getStatus(): Promise<RuntimeStatus> {
    return this._status;
  }

  /**
   * Get current container metrics
   */
  async getMetrics(): Promise<RuntimeMetrics> {
    return this._metrics;
  }

  /**
   * Get container logs
   */
  abstract getLogs(options?: RuntimeLogOptions): Promise<string>;

  /**
   * Follow container logs
   * Returns a function to stop following logs
   */
  abstract followLogs(
    onData: (data: string) => void,
    onError: (error: Error) => void,
    options?: Omit<RuntimeLogOptions, 'follow'>
  ): Promise<() => void>;

  /**
   * Update container status and emit event
   */
  protected updateStatus(newStatus: RuntimeStatus): void {
    const oldStatus = this._status;
    this._status = newStatus;

    this.emit(RuntimeEventType.STATUS_CHANGED, {
      type: RuntimeEventType.STATUS_CHANGED,
      timestamp: new Date(),
      data: {
        oldStatus,
        newStatus,
      },
    });
  }

  /**
   * Update container metrics and emit event
   */
  protected updateMetrics(metrics: Partial<RuntimeMetrics>): void {
    this._metrics = {
      ...this._metrics,
      ...metrics,
    };

    this.emit(RuntimeEventType.METRICS_UPDATED, {
      type: RuntimeEventType.METRICS_UPDATED,
      timestamp: new Date(),
      data: this._metrics,
    });
  }
}
