import type Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import {
  type Platform,
  PlatformNotFoundError,
  type RuntimeCreationOptions,
} from '../platform';
import { BaseRuntimeProvider } from '../provider';
import { BaseRuntime, type RuntimeLogOptions } from '../runtime';
import {
  type RuntimeCapabilities,
  type RuntimeConnectionOptions,
  RuntimeError,
  type RuntimeEvent,
  RuntimeEventType,
  RuntimeStatus,
} from '../types';

// We need to import the actual Docker class for instantiation
import { type default as Dockerode, default as RealDocker } from 'dockerode';

/**
 * Helper function to demultiplex Docker logs
 * Docker log format: [8]byte{STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4}[]byte{OUTPUT}
 */
function demultiplexDockerLog(buffer: Buffer): string {
  let output = '';
  let position = 0;

  while (position < buffer.length) {
    // Ensure we have at least a header
    if (position + 8 > buffer.length) break;

    // Read header
    const streamType = buffer[position];
    const size = buffer.readUInt32BE(position + 4);

    // Move past header
    position += 8;

    // Ensure we have the full message
    if (position + size > buffer.length) break;

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

/**
 * Docker-specific runtime implementation
 */
export class DockerRuntime extends BaseRuntime {
  protected containerId: string | null = null;
  private readonly docker: Docker;
  private readonly platform: Platform;
  private readonly logBuffer: string[] = [];
  private readonly maxLogBufferSize = 1000; // Configurable buffer size

  constructor(
    platform: Platform,
    config: RuntimeCreationOptions['config'],
    connectionOptions?: RuntimeConnectionOptions
  ) {
    const containerConfig = {
      id: `${platform.id}-${uuidv4()}`, // Use UUID for unique container names
      name: `${platform.name}`,
      memoryMb: config?.memoryMb ?? platform.defaultResources?.memoryMb ?? 2048,
      cpuCount: config?.cpuCount ?? platform.defaultResources?.cpuCount ?? 2,
      timeoutMs: config?.timeoutMs ?? 300000,
      env: config?.env ?? {},
      metadata: {
        platformId: platform.id,
        platformVersion: platform.version,
        ...config?.metadata,
      },
    };

    super(containerConfig, connectionOptions);
    this.platform = platform;
    this.docker = new RealDocker(connectionOptions);
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
      const autoRemove = this.config.metadata?.autoRemove !== 'false';

      // Create container with proper command handling
      let cmd: string[] | undefined;
      const command = this.config.metadata?.command;
      if (command && typeof command === 'string') {
        cmd = ['/bin/sh', '-c', command];
      } else {
        cmd = ['/bin/sh', '-c', 'echo "Hello, World!"'];
      }

      const containerConfig: Dockerode.ContainerCreateOptions = {
        Image: this.platform.image,
        name: this.config.id,
        Cmd: cmd,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          Memory: this.config.memoryMb * 1024 * 1024,
          NanoCpus: this.config.cpuCount * 1e9,
          AutoRemove: autoRemove,
        },
        Env: envVars,
      };

      const container = await this.docker.createContainer(containerConfig);
      this.containerId = container.id;

      // Start runtime
      await container.start();
      this.updateStatus(RuntimeStatus.RUNNING);

      // Start metrics collection
      this.startMetricsCollection();
    } catch (error) {
      this.updateStatus(RuntimeStatus.ERROR);
      throw new RuntimeError(
        `Failed to start Docker container: ${(error as Error).message}`,
        'DOCKER_START_ERROR'
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.containerId) return;

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

  async exists(): Promise<boolean> {
    if (!this.containerId) return false;

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

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
        tail: options?.tail,
        timestamps: options?.timestamps,
        since:
          options?.since instanceof Date
            ? Math.floor(options.since.getTime() / 1000)
            : options?.since
              ? Math.floor(new Date(options.since).getTime() / 1000)
              : undefined,
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
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        tail: options?.tail,
        timestamps: options?.timestamps,
        follow: true,
        since:
          options?.since instanceof Date
            ? Math.floor(options.since.getTime() / 1000)
            : options?.since
              ? Math.floor(new Date(options.since).getTime() / 1000)
              : undefined,
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
            if (err) return reject(err);

            this.docker.modem.followProgress(stream, (err: Error | null) => {
              if (err) return reject(err);
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
    if (!this.containerId) return;

    const updateInterval = this.connectionOptions?.metricsInterval ?? 5000;
    const container = this.docker.getContainer(this.containerId);
    // biome-ignore lint/style/useConst: This is declared before the function to allow for cleanup
    let interval: NodeJS.Timer;

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

/**
 * Docker runtime provider implementation
 */
export class DockerRuntimeProvider extends BaseRuntimeProvider<DockerRuntime> {
  async createInstance(
    options: RuntimeCreationOptions
  ): Promise<DockerRuntime> {
    const platform = this.getPlatform(options.platformId);
    if (!platform) {
      throw new PlatformNotFoundError(options.platformId);
    }

    return new DockerRuntime(platform, options.config);
  }
}

/**
 * Create a Docker runtime provider with the specified platforms
 */
export function createDockerProvider(
  platforms: Platform[],
  defaultPlatformId: string
): DockerRuntimeProvider {
  return new DockerRuntimeProvider({
    platforms,
    defaultPlatform: defaultPlatformId,
  });
}
