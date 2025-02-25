import { logger } from '@repo/logger';
import Docker from 'dockerode';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { PlatformNotFoundError } from '../platform';
import { BaseRuntimeProvider } from '../provider';
import { BaseRuntime } from '../runtime';
import {
  type BaseRuntimeConfig,
  BaseRuntimeConfigSchema,
  type Platform,
  type RuntimeCapabilities,
  type RuntimeConnectionOptions,
  type RuntimeCreationOptions,
  RuntimeError,
  type RuntimeEvent,
  RuntimeEventType,
  type RuntimeLogOptions,
  type RuntimeProviderConfig,
  RuntimeStatus,
} from '../types';

/**
 * Helper function to demultiplex Docker logs
 * Docker log format: [8]byte{STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4}[]byte{OUTPUT}
 */
function demultiplexDockerLog(buffer: Buffer): string {
  let output = '';
  let position = 0;

  while (position < buffer.length) {
    // Ensure we have at least a header
    if (position + 8 > buffer.length) {
      break;
    }

    // Read header
    const streamType = buffer[position];
    const size = buffer.readUInt32BE(position + 4);

    // Move past header
    position += 8;

    // Ensure we have the full message
    if (position + size > buffer.length) {
      break;
    }

    // Extract message
    const message = buffer.toString('utf8', position, position + size);

    // Only append stdout (1) and stderr (2) messages
    if (streamType === 1 || streamType === 2) {
      output += message;
    }

    // Move to next message
    position += size;
  }

  return output;
}

interface DockerStats {
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
  };
  networks?: {
    eth0?: {
      rx_bytes: number;
      tx_bytes: number;
    };
  };
}

interface DockerRuntimeConfig extends BaseRuntimeConfig {
  containerConfig: Docker.ContainerCreateOptions;
}

const DockerRuntimeConfigSchema = BaseRuntimeConfigSchema.extend({
  containerConfig: z.object({}).passthrough(),
});

/**
 * Default configuration values that will be used if not provided
 */
const DEFAULT_RUNTIME_CONFIG: Partial<DockerRuntimeConfig> = {
  memoryMb: 4096,
  cpuCount: 4,
  timeoutMs: 300000, // 5 minutes
  containerConfig: {
    HostConfig: {
      NetworkMode: 'cuse-default',
    },
  },
};

/**
 * Creates a complete runtime configuration by merging provided config with defaults
 * and ensuring required fields like id and name are present
 */
export function createDockerRuntimeConfig(
  partialConfig?: Partial<DockerRuntimeConfig>
): DockerRuntimeConfig {
  // Generate unique id if not provided
  const id = partialConfig?.id ?? uuidv4();

  // Generate default name if not provided
  const name =
    partialConfig?.name ??
    uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: '-',
      style: 'lowerCase',
    });

  // Get environment variables if they exist
  const envConfig: Partial<DockerRuntimeConfig> = {
    memoryMb: process.env.DEFAULT_RUNTIME_MEMORY_MB
      ? Number.parseInt(process.env.DEFAULT_RUNTIME_MEMORY_MB, 10)
      : DEFAULT_RUNTIME_CONFIG.memoryMb!,
    cpuCount: process.env.DEFAULT_RUNTIME_CPU_COUNT
      ? Number.parseInt(process.env.DEFAULT_RUNTIME_CPU_COUNT, 10)
      : DEFAULT_RUNTIME_CONFIG.cpuCount!,
    timeoutMs: process.env.DEFAULT_RUNTIME_TIMEOUT_MS
      ? Number.parseInt(process.env.DEFAULT_RUNTIME_TIMEOUT_MS, 10)
      : DEFAULT_RUNTIME_CONFIG.timeoutMs!,
    containerConfig: {
      ...DEFAULT_RUNTIME_CONFIG.containerConfig,
      ...partialConfig?.containerConfig,
    },
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
  const validatedConfig = DockerRuntimeConfigSchema.parse(mergedConfig);

  return validatedConfig;
}

/**
 * Docker-specific runtime implementation
 */
export class DockerRuntime extends BaseRuntime<DockerRuntimeConfig> {
  protected containerId: string | null = null;
  container: Docker.Container | null = null;
  private readonly docker: Docker;
  private readonly platform: Platform;
  private readonly logBuffer: string[] = [];
  private readonly maxLogBufferSize = 1000; // Configurable buffer size

  constructor(
    platform: Platform,
    config: Partial<DockerRuntimeConfig>,
    connectionOptions?: RuntimeConnectionOptions
  ) {
    const containerConfig = createDockerRuntimeConfig({
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
    this.docker = new Docker({});
  }

  get capabilities(): RuntimeCapabilities {
    return {
      supportsGpu: false,
      supportsCustomImages: true,
      supportsFileSystem: true,
      supportsNetworking: true,
      maxMemoryMb: 16384,
      maxCpuCount: 8,
      maxTimeoutMs: 3600000,
    };
  }

  async start(): Promise<void> {
    try {
      // Check if image exists locally first
      const images = await this.docker.listImages({
        filters: { reference: [this.platform.image] },
      });

      if (images.length === 0) {
        await this.pullImage();
      }

      // Prepare environment variables
      const envVars = Object.entries(this.config.env ?? {}).map(
        ([key, value]) => `${key}=${value}`
      );

      // Create runtime with AutoRemove configurable through metadata
      const autoRemove = this.config.metadata?.autoRemove === 'true';

      // Create container with proper command handling
      let cmd: string[] | undefined;
      const command = this.config.metadata?.command;
      if (command && typeof command === 'string') {
        cmd = ['/bin/sh', '-c', command];
      }

      const containerConfig: Docker.ContainerCreateOptions = {
        ...this.config.containerConfig,
        Image: this.platform.image,
        name: this.config.id,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          Memory: this.config.memoryMb
            ? this.config.memoryMb * 1024 * 1024
            : undefined,
          NanoCpus: this.config.cpuCount
            ? this.config.cpuCount * 1e9
            : undefined,
          AutoRemove: autoRemove,
          ...this.config.containerConfig.HostConfig,
        },
        ...(cmd && { Cmd: cmd }),
        Env: envVars,
      };

      const container = await this.docker.createContainer(containerConfig);
      this.containerId = container.id;
      this.container = container;

      // Start runtime
      await container.start();
      this.updateStatus(RuntimeStatus.RUNNING);

      // Start metrics collection
      this.startMetricsCollection();
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      logger.error('Error starting Docker container:', { error });
      throw new RuntimeError(
        `Failed to start Docker container: ${(error as Error).message}`,
        'DOCKER_START_ERROR'
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.containerId) {
      return;
    }

    try {
      const container = this.docker.getContainer(this.containerId);

      const inspect = await container.inspect();
      if (inspect.State.Status === 'stopped') {
        this.updateStatus(RuntimeStatus.STOPPED);
        return;
      }

      await container.stop();
      this.updateStatus(RuntimeStatus.STOPPED);
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to stop Docker container: ${(error as Error).message}`,
        'DOCKER_STOP_ERROR'
      );
    }
  }

  async getUrl(): Promise<string> {
    if (!this.containerId) {
      throw new RuntimeError('Container not started', 'DOCKER_URL_ERROR');
    }

    return `${this.connectionOptions.protocol ?? 'http'}://${this.connectionOptions.host}:${this.connectionOptions.port}`;
  }

  async exists(): Promise<boolean> {
    if (!this.containerId) {
      return false;
    }

    const containers = await this.docker.listContainers({
      all: true, // Include stopped containers in the check
      filters: {
        id: [this.containerId],
      },
    });

    return containers.length > 0;
  }

  async terminate(): Promise<void> {
    if (!this.containerId) {
      this.updateStatus(RuntimeStatus.TERMINATED);
      return;
    }

    try {
      const exists = await this.exists();
      if (!exists) {
        // Container already removed (e.g. due to autoRemove)
        this.containerId = null;
        this.updateStatus(RuntimeStatus.TERMINATED);
        return;
      }

      const container = this.docker.getContainer(this.containerId);

      // Stop container if running
      try {
        const state = await container.inspect().then((info) => info.State);
        if (state.Running) {
          await container.stop();
        }
      } catch (error) {
        // Ignore error if container doesn't exist (might have been auto-removed)
        if ((error as { statusCode?: number })?.statusCode !== 404) {
          throw error;
        }
      }

      // Remove container with retry logic
      try {
        await container.remove({ force: true });
      } catch (error) {
        // Ignore 404 errors (container already removed)
        if ((error as { statusCode?: number })?.statusCode !== 404) {
          throw error;
        }
      }

      this.containerId = null;
      this.updateStatus(RuntimeStatus.TERMINATED);
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to terminate Docker container: ${(error as Error).message}`,
        'DOCKER_TERMINATE_ERROR'
      );
    }
  }

  async getLogs(options?: RuntimeLogOptions): Promise<string> {
    if (!this.containerId) {
      throw new RuntimeError(
        'Cannot get logs: container not started',
        'DOCKER_LOGS_ERROR'
      );
    }

    try {
      // If container does not exist, return from buffer
      if (
        !(await this.exists()) &&
        this.config.metadata?.autoRemove !== 'false'
      ) {
        const logs = this.logBuffer.join('\n');
        return options?.tail
          ? logs.split('\n').slice(-options.tail).join('\n')
          : logs;
      }

      const container = this.docker.getContainer(this.containerId);

      let sinceTimestamp: number | undefined;
      if (options?.since instanceof Date) {
        sinceTimestamp = Math.floor(options.since.getTime() / 1000);
      } else if (options?.since) {
        sinceTimestamp = Math.floor(new Date(options.since).getTime() / 1000);
      }

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
        tail: options?.tail,
        timestamps: options?.timestamps,
        since: sinceTimestamp,
      });

      // Demultiplex and clean up the logs
      return demultiplexDockerLog(logs as Buffer).replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: This regex is used to remove ANSI escape codes
        /\u001b\[[0-9;]*[a-zA-Z]/g,
        ''
      );
    } catch (error) {
      throw new RuntimeError(
        `Failed to get Docker container logs: ${(error as Error).message}`,
        'DOCKER_LOGS_ERROR'
      );
    }
  }

  async followLogs(
    onData: (data: string) => void,
    onError: (error: Error) => void,
    options?: Omit<RuntimeLogOptions, 'follow'>
  ): Promise<() => void> {
    if (!this.containerId) {
      throw new RuntimeError(
        'Cannot follow logs: container not started',
        'DOCKER_LOGS_ERROR'
      );
    }

    try {
      const container = this.docker.getContainer(this.containerId);
      let sinceTimestamp: number | undefined;
      if (options?.since instanceof Date) {
        sinceTimestamp = Math.floor(options.since.getTime() / 1000);
      } else if (options?.since) {
        sinceTimestamp = Math.floor(new Date(options.since).getTime() / 1000);
      }

      const stream = await container.logs({
        stdout: true,
        stderr: true,
        tail: options?.tail,
        timestamps: options?.timestamps,
        follow: true,
        since: sinceTimestamp,
      });

      // Handle log stream with buffer management and proper demultiplexing
      stream.on('data', (chunk: Buffer) => {
        const logLine = demultiplexDockerLog(chunk).replace(
          // biome-ignore lint/suspicious/noControlCharactersInRegex: This regex is used to remove ANSI escape codes
          /\u001b\[[0-9;]*[a-zA-Z]/g,
          ''
        );

        if (logLine.trim()) {
          // Add to ring buffer
          this.logBuffer.push(logLine);
          if (this.logBuffer.length > this.maxLogBufferSize) {
            this.logBuffer.shift();
          }

          onData(logLine);
        }
      });

      stream.on('error', (error: Error) => {
        onError(
          new RuntimeError(
            `Docker log stream error: ${error.message}`,
            'DOCKER_LOGS_ERROR'
          )
        );
      });

      // Return cleanup function
      return () => {
        if ('destroy' in stream) {
          (stream as { destroy: () => void }).destroy();
        }
      };
    } catch (error) {
      throw new RuntimeError(
        `Failed to follow Docker container logs: ${(error as Error).message}`,
        'DOCKER_LOGS_ERROR'
      );
    }
  }

  private async pullImage(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(
          this.platform.image,
          (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) {
              return reject(err);
            }

            this.docker.modem.followProgress(stream, (err: Error | null) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          }
        );
      });
    } catch (error) {
      throw new RuntimeError(
        `Failed to pull Docker image: ${(error as Error).message}`,
        'DOCKER_PULL_ERROR'
      );
    }
  }

  private async startMetricsCollection(): Promise<void> {
    if (!this.containerId) {
      return;
    }

    const updateInterval = this.connectionOptions?.metricsInterval ?? 15000;
    const container = this.docker.getContainer(this.containerId);
    // biome-ignore lint/style/useConst: <explanation>
    let interval: NodeJS.Timeout;

    const collectMetrics = async () => {
      try {
        // First check if container still exists
        const exists = await this.exists();
        if (!exists) {
          clearInterval(interval);
          return;
        }

        const stats = (await container.stats({ stream: false })) as DockerStats;

        // Validate stats data before processing
        if (
          !stats?.cpu_stats?.cpu_usage?.total_usage ||
          !stats?.precpu_stats?.cpu_usage?.total_usage ||
          !stats?.cpu_stats?.system_cpu_usage ||
          !stats?.precpu_stats?.system_cpu_usage ||
          !stats?.memory_stats?.usage
        ) {
          return;
        }

        // Calculate CPU usage percentage
        const cpuDelta =
          stats.cpu_stats.cpu_usage.total_usage -
          stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta =
          stats.cpu_stats.system_cpu_usage -
          stats.precpu_stats.system_cpu_usage;

        // Avoid division by zero and ensure valid values
        const cpuUsagePercent =
          systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;

        // Calculate memory usage with fallback
        const memoryUsageMb = stats.memory_stats.usage / (1024 * 1024);

        // Calculate network usage with safe defaults
        const networkStats = stats.networks?.eth0 ?? {
          rx_bytes: 0,
          tx_bytes: 0,
        };

        this.updateMetrics({
          cpuUsagePercent: Math.max(0, Math.min(100, cpuUsagePercent)),
          memoryUsageMb: Math.max(0, memoryUsageMb),
          networkInBytes: networkStats.rx_bytes,
          networkOutBytes: networkStats.tx_bytes,
          diskUsageBytes: 0,
        });
      } catch (error) {
        // Only clear interval on fatal errors, ignore transient ones
        if ((error as { statusCode?: number })?.statusCode === 404) {
          clearInterval(interval);
          return;
        }
        // For other errors, just reset metrics to zero
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

    // Clean up interval when container is terminated, stopped, or errored
    this.once(RuntimeEventType.STATUS_CHANGED, (event: RuntimeEvent) => {
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

interface DockerRuntimeProviderConfig extends RuntimeProviderConfig {
  socketPath?: string;
  network: string;
}
interface DockerRuntimeCreationOptions
  extends RuntimeCreationOptions<DockerRuntimeConfig> {}

/**
 * Docker runtime provider implementation
 */
export class DockerRuntimeProvider extends BaseRuntimeProvider<
  DockerRuntime,
  DockerRuntimeConfig
> {
  private readonly docker: Docker;
  private readonly network: string;

  constructor(config: DockerRuntimeProviderConfig) {
    super(config);
    this.docker = new Docker({
      ...(config.socketPath ? { socketPath: config.socketPath } : {}),
    });
    this.network = config.network;
  }

  async ensureNetworkExists(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [this.network] },
      });
      if (networks.length === 0) {
        await this.docker.createNetwork({
          Name: this.network,
          Driver: 'bridge',
          CheckDuplicate: true,
        });
      }
    } catch (error) {
      throw new RuntimeError(
        `Failed to ensure Docker network exists: ${(error as Error).message}`,
        'DOCKER_NETWORK_ERROR'
      );
    }
  }

  async createInstance(
    options: DockerRuntimeCreationOptions
  ): Promise<DockerRuntime> {
    await this.ensureNetworkExists();

    // random port between 3010 and 4010
    const port = Math.floor(Math.random() * (4010 - 3010)) + 3010;

    const platform = this.getPlatform(options.platformId);
    if (!platform) {
      throw new PlatformNotFoundError(options.platformId);
    }

    const connectionOptions: RuntimeConnectionOptions = {
      host: 'localhost',
      port,
      protocol: 'http',
    };

    const runtimeConfig: Partial<DockerRuntimeConfig> = {
      ...options.config,
      metadata: {
        platformId: platform.id,
        platformVersion: platform.version,
        port: connectionOptions.port!.toString(),
        ...options.config?.metadata,
      },
      containerConfig: {
        ExposedPorts: {
          '8000/tcp': {},
        },
        HostConfig: {
          NetworkMode: this.network,
          PortBindings: {
            '8000/tcp': [
              {
                HostPort: connectionOptions.port!.toString(),
                HostIp: '0.0.0.0', // Bind to all network interfaces
              },
            ],
          },
        },
        ...((options.config?.name || options.config?.id) && {
          NetworkingConfig: {
            EndpointsConfig: {
              [this.network]: {
                Aliases: [`${options.config?.name || options.config?.id}`],
              },
            },
          },
        }),
      },
    };

    const runtime = new DockerRuntime(
      platform,
      runtimeConfig,
      connectionOptions
    );
    this.instances.set(runtime.id, runtime);
    return runtime;
  }

  async getInstance(id: string): Promise<DockerRuntime | undefined> {
    return this.instances.get(id);
  }

  async listInstances(): Promise<DockerRuntime[]> {
    return Array.from(this.instances.values());
  }

  async indexInstances(): Promise<Record<string, DockerRuntime>> {
    await this.ensureNetworkExists();

    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        ancestor: Array.from(this.platforms.values()).map((p) => p.image),
      },
    });

    for (const container of containers) {
      const platform = Array.from(this.platforms.values()).find((p) =>
        p.image.includes(container.Image)
      );
      if (platform) {
        this.instances.set(
          container.Id,
          new DockerRuntime(platform, {
            id: container.Id,
            name: container.Names[0]?.replace('/', '') || container.Id,
            containerConfig: {
              HostConfig: {
                NetworkMode: this.network,
              },
            },
            memoryMb: platform.defaultResources?.memoryMb || 2048,
            cpuCount: platform.defaultResources?.cpuCount || 2,
            timeoutMs: 300000,
            env: {},
            metadata: {
              platformId: platform.id,
              platformVersion: platform.version,
            },
          })
        );
      }
    }

    return Object.fromEntries(this.instances.entries());
  }
}

/**
 * Create a Docker runtime provider with the specified platforms
 */
export function createDockerProvider(
  platforms: Platform[],
  defaultPlatformId: string,
  network = 'cuse-default',
  socketPath?: string
): DockerRuntimeProvider {
  const provider = new DockerRuntimeProvider({
    platforms,
    defaultPlatform: defaultPlatformId,
    socketPath,
    network,
  } as DockerRuntimeProviderConfig);

  // Ensure network exists before indexing instances
  provider.ensureNetworkExists();
  provider.indexInstances();

  return provider;
}
