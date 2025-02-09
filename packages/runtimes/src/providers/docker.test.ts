import Docker from 'dockerode';
import { afterAll, describe, expect, test, vi } from 'vitest';
import type { Platform } from '../platform';
import { RuntimeStatus } from '../types';
import { createDockerProvider } from './docker';

// Mock test platforms
const TEST_PLATFORMS: Platform[] = [
  {
    id: 'linux',
    name: 'test-container-ubuntu',
    description: 'Ubuntu 24.04 LTS',
    version: 'latest',
    image: 'ghcr.io/cuse-dev/cuse/linux:latest',
    defaultResources: {
      memoryMb: 4096,
      cpuCount: 4,
    },
  },
  {
    id: 'alpine-linux',
    name: 'test-container-alpine',
    description: 'Alpine Linux',
    version: 'latest',
    image: 'alpine:latest',
    defaultResources: {
      memoryMb: 4096,
      cpuCount: 4,
    },
  },
];

const DEFAULT_TIMEOUT = 60000;

const cleanupContainers = async () => {
  const docker = new Docker();
  const containers = await docker.listContainers({
    all: true,
  });
  for (const container of containers.filter((c) =>
    c.Names.includes('test-container')
  )) {
    await docker.getContainer(container.Id).remove({ force: true });
  }
};

describe('DockerRuntimeProvider', () => {
  afterAll(async () => {
    await cleanupContainers();
  });

  test('creates provider with platform', () => {
    const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
    expect(provider.getPlatforms()).toHaveLength(2);
    expect(provider.getPlatform('linux')).toBeDefined();
  });

  test('throws error for invalid default platform', () => {
    expect(() => createDockerProvider(TEST_PLATFORMS, 'invalid')).toThrow();
  });

  test('creates instance with correct configuration', async () => {
    const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({
      platformId: 'linux',
      config: {
        memoryMb: 4096,
        cpuCount: 4,
      },
    });

    expect(instance.id).toContain('linux');
    expect(instance.name).toBe('test-container-ubuntu');
    expect(instance.config.memoryMb).toBe(4096);
    expect(instance.config.cpuCount).toBe(4);
    expect(instance.config.metadata?.platformId).toBe('linux');
    expect(instance.config.metadata?.platformVersion).toBe('latest');
  });

  test('uses default resources when not specified', async () => {
    const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({
      platformId: 'linux',
    });

    expect(instance.config.memoryMb).toBe(4096); // From defaultResources
    expect(instance.config.cpuCount).toBe(4); // From defaultResources
  });

  test('throws error for non-existent platform', async () => {
    const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
    await expect(
      provider.createInstance({
        platformId: 'invalid',
      })
    ).rejects.toThrow();
  });

  test(
    'instance lifecycle events',
    async () => {
      const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({ platformId: 'linux' });

      // Mock event listener
      const statusChanges: RuntimeStatus[] = [];
      instance.on('status_changed', (event) => {
        statusChanges.push(event.data.newStatus as RuntimeStatus);
      });

      // Test lifecycle
      expect(instance.status).toBe(RuntimeStatus.CREATING);

      await instance.start();
      expect(instance.status).toBe(RuntimeStatus.RUNNING);
      expect(statusChanges).toContain(RuntimeStatus.RUNNING);

      await instance.stop();
      expect(instance.status).toBe(RuntimeStatus.STOPPED);
      expect(statusChanges).toContain(RuntimeStatus.STOPPED);

      await instance.terminate();
      expect(instance.status).toBe(RuntimeStatus.TERMINATED);
      expect(statusChanges).toContain(RuntimeStatus.TERMINATED);
    },
    DEFAULT_TIMEOUT
  );

  test('instance capabilities', async () => {
    const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({ platformId: 'linux' });

    expect(instance.capabilities).toEqual({
      supportsGpu: false,
      supportsCustomImages: true,
      supportsFileSystem: true,
      supportsNetworking: true,
      maxMemoryMb: 16384,
      maxCpuCount: 8,
      maxTimeoutMs: 3600000,
    });
  });

  test(
    'instance metrics',
    async () => {
      const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({
        platformId: 'alpine-linux',
        config: {
          metadata: {
            command: 'sleep 5',
            autoRemove: 'false', // Prevent auto-removal to ensure clean termination
          },
        },
      });

      try {
        await instance.start();
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const metrics = await instance.getMetrics();
        expect(metrics).toBeDefined();
        expect(typeof metrics.cpuUsagePercent).toBe('number');
        expect(typeof metrics.memoryUsageMb).toBe('number');
        expect(typeof metrics.networkInBytes).toBe('number');
        expect(typeof metrics.networkOutBytes).toBe('number');
        expect(typeof metrics.diskUsageBytes).toBe('number');
      } finally {
        await instance.terminate().catch(console.error);
      }
    },
    DEFAULT_TIMEOUT
  );

  describe('instance logs', () => {
    test(
      'retrieves logs with default options',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'alpine-linux',
          config: {
            metadata: {
              command: 'echo "Hello, World!"',
            },
          },
        });

        await instance.start();

        const logs = await instance.getLogs();

        console.log('logs');
        console.log(logs);

        expect(typeof logs).toBe('string');
        expect(logs).toContain('Hello, World!');
      },
      DEFAULT_TIMEOUT
    );

    test(
      'retrieves logs with tail option',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'alpine-linux',
          config: {
            metadata: {
              command: 'for i in {1..10}; do echo "Line $i"; done',
            },
          },
        });

        await instance.start();

        // Wait for container to exit
        const container = (instance as any).docker.getContainer(
          (instance as any).containerId
        );
        await container.wait();

        const logs = await instance.getLogs({ tail: 5 });
        expect(typeof logs).toBe('string');
        expect(logs.split('\n').filter(Boolean).length).toBeLessThanOrEqual(5);
      },
      DEFAULT_TIMEOUT
    );

    test(
      'retrieves logs with timestamps',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'alpine-linux',
          config: {
            metadata: {
              command: 'echo "Hello, World!"',
            },
          },
        });

        await instance.start();

        const logs = await instance.getLogs({ timestamps: true });
        expect(typeof logs).toBe('string');
        expect(logs).toContain('Hello, World!');
      },
      DEFAULT_TIMEOUT
    );

    test(
      'follows logs with cleanup',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'alpine-linux',
          config: {
            metadata: {
              command: 'for i in {1..5}; do echo "Line $i"; sleep 1; done',
            },
          },
        });

        await instance.start();

        const logLines: string[] = [];
        const onData = (line: string) => logLines.push(line);
        const onError = vi.fn();

        const cleanup = await instance.followLogs(onData, onError);
        expect(typeof cleanup).toBe('function');

        // Wait for some logs
        await new Promise((resolve) => setTimeout(resolve, 3000));

        cleanup();
        expect(onError).not.toHaveBeenCalled();
        expect(logLines.length).toBeGreaterThan(0);
      },
      DEFAULT_TIMEOUT
    );

    test('throws error when getting logs from non-started container', async () => {
      const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({ platformId: 'linux' });

      await expect(instance.getLogs()).rejects.toThrow('container not started');
    });

    test('throws error when following logs from non-started container', async () => {
      const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({ platformId: 'linux' });

      await expect(
        instance.followLogs(
          () => {},
          () => {}
        )
      ).rejects.toThrow('container not started');
    });
  });

  describe('environment variables', () => {
    test(
      'passes environment variables to container',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');
        const docker = new Docker();
        let containerId: string | undefined;

        // Set autoRemove to false to allow inspecting the container
        const instance = await provider.createInstance({
          platformId: 'alpine-linux',
          config: {
            env: {
              TEST_VAR: 'test_value',
              ANOTHER_VAR: '123',
            },
            metadata: {
              command: 'env', // Just dump all environment variables
              autoRemove: 'false',
            },
          },
        });

        try {
          await instance.start();
          containerId = (instance as any).containerId as string;

          // Get container info
          const container = docker.getContainer(containerId);
          await container.wait();

          const logs = await instance.getLogs();
          expect(logs).toContain('TEST_VAR=test_value');
          expect(logs).toContain('ANOTHER_VAR=123');
        } finally {
          if (containerId) {
            const container = docker.getContainer(containerId);
            await container.remove({ force: true }).catch(console.error);
          }
        }
      },
      DEFAULT_TIMEOUT
    );
  });

  describe('image management', () => {
    test(
      'reuses existing image',
      async () => {
        const provider = createDockerProvider(TEST_PLATFORMS, 'linux');

        // First instance will pull the image if needed
        const instance1 = await provider.createInstance({
          platformId: 'linux',
          config: {
            metadata: {
              command: 'echo "test"',
              autoRemove: 'false',
            },
          },
        });

        await instance1.start();
        await instance1.terminate();

        // Wait for container cleanup
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Second instance should reuse the image
        const instance2 = await provider.createInstance({
          platformId: 'linux',
          config: {
            metadata: {
              command: 'echo "test"',
              autoRemove: 'false',
            },
          },
        });

        const startTime = Date.now();
        await instance2.start();
        const duration = Date.now() - startTime;

        // If image exists locally, starting should be relatively quick
        expect(duration).toBeLessThan(5000);

        await instance2.terminate();
      },
      DEFAULT_TIMEOUT
    );
  });
});
