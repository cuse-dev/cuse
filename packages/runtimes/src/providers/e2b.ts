import { Sandbox, type SandboxOpts } from '@e2b/code-interpreter';
import { EventEmitter } from 'node:events';
import {
  adjectives,
  names,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { PlatformNotFoundError } from '../platform';
import { BaseRuntimeProvider } from '../provider';
import { BaseRuntime } from '../runtime';
import {
  BaseRuntimeConfig,
  BaseRuntimeConfigSchema,
  Platform,
  type RuntimeCapabilities,
  type RuntimeConnectionOptions,
  RuntimeCreationOptions,
  RuntimeError,
  RuntimeLogOptions,
  RuntimeProviderConfig,
  RuntimeStatus,
} from '../types';

interface E2BRuntimeConfig extends BaseRuntimeConfig {
  sandboxCreateOptions?: SandboxOpts;
}

const E2BRuntimeConfigSchema = BaseRuntimeConfigSchema.extend({
  sandboxCreateOptions: z.object({}).optional(),
});

/**
 * Default configuration values that will be used if not provided
 */
const DEFAULT_RUNTIME_CONFIG: Partial<E2BRuntimeConfig> = {
  memoryMb: 4096,
  cpuCount: 4,
  timeoutMs: 300000, // 5 minutes
};

/**
 * Creates a complete runtime configuration by merging provided config with defaults
 * and ensuring required fields like id and name are present
 */
export function createE2BRuntimeConfig(
  partialConfig?: Partial<E2BRuntimeConfig>
): E2BRuntimeConfig {
  // Generate unique id if not provided
  const id = partialConfig?.id ?? uuidv4();

  // Generate default name if not provided
  const name =
    partialConfig?.name ??
    uniqueNamesGenerator({
      dictionaries: [adjectives, names],
    });

  // Get environment variables if they exist
  const envConfig: Partial<E2BRuntimeConfig> = {
    memoryMb: process.env.DEFAULT_RUNTIME_MEMORY_MB
      ? parseInt(process.env.DEFAULT_RUNTIME_MEMORY_MB, 10)
      : DEFAULT_RUNTIME_CONFIG.memoryMb!,
    cpuCount: process.env.DEFAULT_RUNTIME_CPU_COUNT
      ? parseInt(process.env.DEFAULT_RUNTIME_CPU_COUNT, 10)
      : DEFAULT_RUNTIME_CONFIG.cpuCount!,
    timeoutMs: process.env.DEFAULT_RUNTIME_TIMEOUT_MS
      ? parseInt(process.env.DEFAULT_RUNTIME_TIMEOUT_MS, 10)
      : DEFAULT_RUNTIME_CONFIG.timeoutMs!,
  };

  // Merge configs in order of precedence:
  // 1. Provided config
  // 2. Environment variables
  // 3. Default values
  const mergedConfig = {
    ...DEFAULT_RUNTIME_CONFIG,
    ...envConfig,
    ...partialConfig,
    name,
    id,
  };

  // Validate the config using zod schema
  const validatedConfig = E2BRuntimeConfigSchema.parse(mergedConfig);

  return validatedConfig;
}

export class E2BRuntime extends BaseRuntime {
  sandbox: Sandbox | null = null;
  private readonly platform: Platform;
  private logBuffer: string[] = [];
  private readonly maxLogBufferSize = 1000;
  private readonly emitter = new EventEmitter();

  private readonly logger = {
    debug: (message: string) => {
      this.logBuffer.push(message);
      this.emitter.emit('log', { message, level: 'debug' });
    },
    info: (message: string) => {
      this.logBuffer.push(message);
      this.emitter.emit('log', { message, level: 'info' });
    },
    error: (message: string) => {
      this.logBuffer.push(message);
      this.emitter.emit('log', { message, level: 'error' });
    },
  };

  constructor(
    platform: Platform,
    config: Partial<E2BRuntimeConfig>,
    connectionOptions?: RuntimeConnectionOptions
  ) {
    const containerConfig = createE2BRuntimeConfig({
      ...config,
      memoryMb:
        platform.defaultResources?.memoryMb ??
        config?.memoryMb ??
        DEFAULT_RUNTIME_CONFIG.memoryMb!,
      cpuCount:
        config?.cpuCount ??
        platform.defaultResources?.cpuCount ??
        DEFAULT_RUNTIME_CONFIG.cpuCount!,
      timeoutMs: config?.timeoutMs ?? DEFAULT_RUNTIME_CONFIG.timeoutMs!,
      metadata: {
        platformId: platform.id,
        platformVersion: platform.version,
        ...config?.metadata,
      },
      env: {
        ...config?.env,
      },
    });

    super(containerConfig, connectionOptions);
    this.platform = platform;

    if (!process.env.E2B_API_KEY) {
      throw new Error('E2B_API_KEY must be set');
    }
  }

  get capabilities(): RuntimeCapabilities {
    return {
      supportsGpu: false,
      supportsCustomImages: false, // E2B uses predefined templates
      supportsFileSystem: true,
      supportsNetworking: true,
      maxMemoryMb: 8192, // 8GB max for E2B sandboxes
      maxCpuCount: 4, // 4 CPU cores max
      maxTimeoutMs: 3600000, // 1 hour max runtime
    };
  }

  async start(): Promise<void> {
    try {
      if (!process.env.E2B_API_KEY) {
        throw new Error('E2B_API_KEY must be set');
      }

      const sandboxCreateOptions: SandboxOpts = {
        logger: this.logger,
        timeoutMs: this.config.timeoutMs ?? 300000,
        apiKey: process.env.E2B_API_KEY,
        ...(this.config.env && { envs: this.config.env }),
      };

      // Create new E2B sandbox instance
      if (this.platform.image) {
        this.sandbox = await Sandbox.create(
          this.platform.image,
          sandboxCreateOptions
        );
      } else {
        this.sandbox = await Sandbox.create(
          'ubuntu:24.04',
          sandboxCreateOptions
        );
      }

      if (!this.sandbox) {
        throw new Error('Failed to create sandbox');
      }

      // Set environment variables if any
      if (this.config.env) {
        for (const [key, value] of Object.entries(this.config.env)) {
          await this.sandbox.commands.run(`export ${key}=${value}`);
        }
      }

      console.log('sandbox', this.sandbox);
      if (this.config.metadata?.command) {
        console.log('running command', this.config.metadata.command);

        const out = await this.sandbox.commands.run(
          this.config.metadata.command
        );

        if (out.stderr) {
          this.logger.error(out.stderr);
        }

        if (out.stdout) {
          this.logger.info(out.stdout);
        }
      }

      await this.sandbox.setTimeout(300000);

      this.logger.info('Starting virtual display...');

      console.log('starting all');

      await this.sandbox.commands.run('./start_all.sh', {
        onStderr: (data) => {
          console.log('stderr', data);
          this.logger.error(data);
          //throw new Error(data);
        },
        onStdout: (data) => {
          console.log('stdout', data);
          this.logger.info(`stdout: ${data}`);
        },
        timeoutMs: 300000,
        background: true,
      });

      console.log('started all');

      this.logger.info('Starting computer api...');
      await this.sandbox.commands.run('./entrypoint.sh', {
        onStderr: (data) => {
          this.logger.error(data);
          //throw new Error(data);
        },
        onStdout: (data) => {
          this.logger.info(`stdout: ${data}`);
        },
        background: true,
        requestTimeoutMs: 300000,
      });

      await new Promise((resolve) =>
        this.followLogs(
          (data) => {
            if (data.includes('All services started successfully')) {
              resolve(true);
            }
          },
          (_error) => {}
        )
      );

      this.updateStatus(RuntimeStatus.RUNNING);

      // // Start metrics collection
      this.startMetricsCollection();
    } catch (error) {
      console.log('error');
      console.log(error);

      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to start E2B sandbox: ${(error as Error).message}`,
        'E2B_START_ERROR'
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.sandbox) return;

    try {
      await this.sandbox.kill();
      this.updateStatus(RuntimeStatus.TERMINATED);
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to stop E2B sandbox: ${(error as Error).message}`,
        'E2B_STOP_ERROR'
      );
    }
  }

  async terminate(): Promise<void> {
    if (!this.sandbox) {
      this.updateStatus(RuntimeStatus.TERMINATED);
      return;
    }

    try {
      await this.sandbox.kill();
      this.updateStatus(RuntimeStatus.TERMINATED);
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to terminate E2B sandbox: ${(error as Error).message}`,
        'E2B_TERMINATE_ERROR'
      );
    }
  }

  async getLogs(options?: RuntimeLogOptions): Promise<string> {
    if (!this.sandbox) {
      throw new RuntimeError(
        'Cannot get logs: sandbox not started',
        'E2B_LOGS_ERROR'
      );
    }

    try {
      const logs = this.logBuffer.join('\n');
      return options?.tail
        ? logs.split('\n').slice(-options.tail).join('\n')
        : logs;
    } catch (error) {
      throw new RuntimeError(
        `Failed to get E2B sandbox logs: ${(error as Error).message}`,
        'E2B_LOGS_ERROR'
      );
    }
  }

  async followLogs(
    onData: (data: string) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    if (!this.sandbox) {
      throw new RuntimeError(
        'Cannot follow logs: sandbox not started',
        'E2B_LOGS_ERROR'
      );
    }

    try {
      // Set up log listener
      const listener = (message: { message: string; level: string }) => {
        if (message.level === 'error') {
          onError(new Error(message.message));
        } else {
          onData(message.message);
        }
      };

      this.emitter.on('log', listener);

      // Return cleanup function
      return () => {
        this.emitter.off('log', listener);
      };
    } catch (error) {
      throw new RuntimeError(
        `Failed to follow E2B sandbox logs: ${(error as Error).message}`,
        'E2B_LOGS_ERROR'
      );
    }
  }

  private async startMetricsCollection(): Promise<void> {
    if (!this.sandbox) return;

    const updateInterval = this.connectionOptions?.metricsInterval ?? 15000;

    // biome-ignore lint/style/useConst: <explanation>
    let interval: NodeJS.Timer;

    const collectMetrics = async () => {
      try {
        if (!this.sandbox) {
          clearInterval(interval);
          return;
        }

        // TODO: Get metrics from sandbox via API
        const metricsCpu = 0;
        const metricsMemory = 0;
        const metricsNetwork = 0;
        const metricsDisk = 0;

        this.updateMetrics({
          cpuUsagePercent: metricsCpu,
          memoryUsageMb: metricsMemory,
          networkInBytes: metricsNetwork,
          networkOutBytes: metricsNetwork,
          diskUsageBytes: metricsDisk,
        });
      } catch (error) {
        // Reset metrics on error
        this.updateMetrics({
          cpuUsagePercent: 0,
          memoryUsageMb: 0,
          networkInBytes: 0,
          networkOutBytes: 0,
          diskUsageBytes: 0,
        });
      }
    };

    // Start periodic collection
    interval = setInterval(collectMetrics, updateInterval);

    // Clean up interval when sandbox is terminated
    this.once('status_changed', (event) => {
      if (
        event.data.newStatus === RuntimeStatus.TERMINATED ||
        event.data.newStatus === RuntimeStatus.ERROR ||
        event.data.newStatus === RuntimeStatus.STOPPED
      ) {
        clearInterval(interval);
      }
    });

    // Initial collection
    await collectMetrics().catch(() => {
      // Ignore initial collection errors
    });
  }
}

interface E2BRuntimeProviderConfig extends RuntimeProviderConfig {
  apiKey?: string;
}

interface E2BRuntimeCreationOptions
  extends RuntimeCreationOptions<E2BRuntimeConfig> {}

/**
 * E2B runtime provider implementation
 */
export class E2BRuntimeProvider extends BaseRuntimeProvider<
  E2BRuntime,
  E2BRuntimeConfig
> {
  private readonly apiKey: string;

  constructor(config: E2BRuntimeProviderConfig) {
    super(config);
    this.apiKey = config.apiKey ?? process.env.E2B_API_KEY ?? '';

    if (!this.apiKey) {
      throw new Error(
        'E2B_API_KEY must be set either in environment or provider config'
      );
    }
  }

  async createInstance(
    options: E2BRuntimeCreationOptions
  ): Promise<E2BRuntime> {
    const platform = this.getPlatform(options.platformId);
    if (!platform) {
      throw new PlatformNotFoundError(options.platformId);
    }

    const config: Partial<E2BRuntimeConfig> = {
      ...options.config,
      metadata: {
        platformId: platform.id,
        platformVersion: platform.version,
        ...options.config?.metadata,
      },
    };

    const runtime = new E2BRuntime(platform, config);
    this.instances.set(runtime.id, runtime);
    return runtime;
  }

  async getInstance(id: string): Promise<E2BRuntime | undefined> {
    return this.instances.get(id);
  }

  async listInstances(): Promise<E2BRuntime[]> {
    return Array.from(this.instances.values());
  }

  async indexInstances(): Promise<Map<string, E2BRuntime>> {
    // E2B doesn't provide a way to list existing sandboxes
    // So we just return the current instances
    const instances = await Sandbox.list();
    const instancesMap = new Map<string, E2BRuntime>();
    instances.forEach((instance) => {
      const platform = this.getPlatforms().find(
        (p) => p.image === instance.templateId
      );
      if (!platform) {
        console.log(
          'e2b platform not found by templateId',
          instance.templateId
        );
      } else {
        const runtime = new E2BRuntime(platform, {
          id: instance.sandboxId,
          name: instance.name ?? instance.sandboxId,
        });
        this.instances.set(runtime.id, runtime);
        instancesMap.set(runtime.id, runtime);
      }
    });
    return instancesMap;
  }
}

/**
 * Create an E2B runtime provider with the specified platforms
 */
export async function createE2BProvider(
  platforms: Platform[],
  defaultPlatformId: string,
  apiKey?: string
): Promise<E2BRuntimeProvider> {
  const provider = new E2BRuntimeProvider({
    platforms,
    defaultPlatform: defaultPlatformId,
    apiKey: apiKey ?? process.env.E2B_API_KEY!,
  });

  await provider.indexInstances();

  return provider;
}
