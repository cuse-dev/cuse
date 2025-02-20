import type { Sandbox } from '@e2b/code-interpreter';
import { beforeEach, describe, expect, test } from 'vitest';
import { Platform, RuntimeStatus } from '../types';
import { createE2BProvider } from './e2b';

// Test platforms
const TEST_PLATFORMS: Platform[] = [
  {
    id: 'linux',
    name: 'test-sandbox-ubuntu',
    description: 'Ubuntu 24.04 LTS',
    version: 'latest',
    image: 'hqkthyc6ivmcwknw64tk',
    defaultResources: {
      memoryMb: 4096,
      cpuCount: 4,
    },
  },
];

const DEFAULT_TIMEOUT = 300000;

describe('E2BRuntimeProvider', () => {
  if (!process.env.E2B_API_KEY) {
    throw new Error('E2B_API_KEY must be set to run tests');
  }

  beforeEach(() => {
    // Ensure E2B credentials are set
    if (!process.env.E2B_API_KEY) {
      throw new Error('E2B_API_KEY must be set to run tests');
    }
  });

  test('creates provider with platform', async () => {
    const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
    expect(provider.getPlatforms()).toHaveLength(1);
    expect(provider.getPlatform('linux')).toBeDefined();
  });

  test('throws error for invalid default platform', () => {
    expect(() => createE2BProvider(TEST_PLATFORMS, 'invalid')).toThrow();
  });

  test('creates instance with correct configuration', async () => {
    const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({
      platformId: 'linux',
      config: {
        id: 'test-linux',
        memoryMb: 4096,
        cpuCount: 4,
      },
    });

    expect(instance.id).toContain('linux');
    expect(instance.name).toBe('test-sandbox-ubuntu');
    expect(instance.config.memoryMb).toBe(4096);
    expect(instance.config.cpuCount).toBe(4);
    expect(instance.config.metadata?.platformId).toBe('linux');
    expect(instance.config.metadata?.platformVersion).toBe('latest');
  });

  test('uses default resources when not specified', async () => {
    const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({
      platformId: 'linux',
      config: {
        id: 'test-linux',
      },
    });

    expect(instance.config.memoryMb).toBe(4096); // From defaultResources
    expect(instance.config.cpuCount).toBe(4); // From defaultResources
  });

  test('throws error for non-existent platform', async () => {
    const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
    await expect(
      provider.createInstance({
        platformId: 'invalid',
        config: {
          id: 'test-invalid',
        },
      })
    ).rejects.toThrow();
  });

  test(
    'instance lifecycle events',
    async () => {
      const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({
        platformId: 'linux',
        config: {
          id: 'test-linux',
        },
      });

      // Track status changes
      const statusChanges: RuntimeStatus[] = [];
      instance.on('status_changed', (event) => {
        statusChanges.push(event.data.newStatus as RuntimeStatus);
      });

      // Test lifecycle
      expect(instance.status).toBe(RuntimeStatus.CREATING);

      await instance.start();
      expect(instance.status).toBe(RuntimeStatus.RUNNING);
      expect(statusChanges).toContain(RuntimeStatus.RUNNING);

      // Run a simple command to verify the sandbox is working
      const sandbox = instance.sandbox as Sandbox;
      const result = await sandbox.commands.run('echo "test"');
      expect(result.stdout.trim()).toBe('test');

      await instance.stop();
      expect(instance.status).toBe(RuntimeStatus.TERMINATED);
      expect(statusChanges).toContain(RuntimeStatus.TERMINATED);

      await instance.terminate();
      expect(instance.status).toBe(RuntimeStatus.TERMINATED);
      expect(statusChanges).toContain(RuntimeStatus.TERMINATED);
    },
    DEFAULT_TIMEOUT
  );

  test('instance capabilities', async () => {
    const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
    const instance = await provider.createInstance({
      platformId: 'linux',
      config: {
        id: 'test-linux',
      },
    });

    expect(instance.capabilities).toEqual({
      supportsGpu: false,
      supportsCustomImages: false,
      supportsFileSystem: true,
      supportsNetworking: true,
      maxMemoryMb: 8192,
      maxCpuCount: 4,
      maxTimeoutMs: 3600000,
    });
  });

  test(
    'instance metrics',
    async () => {
      const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({
        platformId: 'linux',
        config: {
          id: 'test-linux',
        },
      });

      await instance.start();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const metrics = await instance.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.cpuUsagePercent).toBe('number');
      expect(typeof metrics.memoryUsageMb).toBe('number');
      expect(typeof metrics.networkInBytes).toBe('number');
      expect(typeof metrics.networkOutBytes).toBe('number');
      expect(typeof metrics.diskUsageBytes).toBe('number');

      await instance.terminate();
    },
    DEFAULT_TIMEOUT
  );

  describe('instance logs', () => {
    test(
      'retrieves logs with default options',
      async () => {
        const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'linux',
          config: {
            id: 'test-linux',
            metadata: {
              command: 'echo "Hello, World!"',
            },
          },
        });

        await instance.start();

        const logs = await instance.getLogs();
        expect(typeof logs).toBe('string');
        expect(logs).toContain('Hello, World!');

        await instance.terminate();
      },
      DEFAULT_TIMEOUT
    );

    test(
      'retrieves logs with tail option',
      async () => {
        const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'linux',
          config: {
            id: 'test-linux',
          },
        });

        await instance.start();

        // Generate multiple log lines
        const sandbox = instance.sandbox as Sandbox;
        for (let i = 1; i <= 10; i++) {
          await sandbox.commands.run(`echo "Line ${i}"`);
        }

        const logs = await instance.getLogs({ tail: 5 });
        expect(typeof logs).toBe('string');
        expect(logs.split('\n').filter(Boolean).length).toBeLessThanOrEqual(5);

        await instance.terminate();
      },
      DEFAULT_TIMEOUT
    );

    test(
      'follows logs with cleanup',
      async () => {
        const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'linux',
          config: {
            id: 'test-linux',
          },
        });

        await instance.start();

        const logLines: string[] = [];
        const onData = (line: string) => logLines.push(line);
        const onError = (error: Error) => {
          throw error;
        };

        const cleanup = await instance.followLogs(onData, onError);
        expect(typeof cleanup).toBe('function');

        // Generate some logs
        const sandbox = instance.sandbox as Sandbox;
        await sandbox.commands.run('echo "Log line 1"');
        await sandbox.commands.run('echo "Log line 2"');
        await sandbox.commands.run('echo "Error line" >&2');

        // Wait for logs to be processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        cleanup();
        expect(logLines.length).toBeGreaterThan(0);

        await instance.terminate();
      },
      DEFAULT_TIMEOUT
    );

    test('throws error when getting logs from non-started container', async () => {
      const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({
        platformId: 'linux',
        config: {
          id: 'test-linux',
        },
      });

      await expect(instance.getLogs()).rejects.toThrow('sandbox not started');
    });

    test('throws error when following logs from non-started container', async () => {
      const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
      const instance = await provider.createInstance({
        platformId: 'linux',
        config: {
          id: 'test-linux',
        },
      });

      await expect(
        instance.followLogs(
          () => {},
          () => {}
        )
      ).rejects.toThrow('sandbox not started');
    });
  });

  describe('environment variables', () => {
    test(
      'passes environment variables to sandbox',
      async () => {
        const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'linux',
          config: {
            id: 'test-linux',
            env: {
              TEST_VAR: 'test_value',
              ANOTHER_VAR: '123',
            },
          },
        });

        await instance.start();

        // Verify environment variables were set
        const sandbox = instance.sandbox as Sandbox;
        const result = await sandbox.commands.run(
          'echo $TEST_VAR $ANOTHER_VAR'
        );
        expect(result.stdout.trim()).toBe('test_value 123');

        await instance.terminate();
      },
      DEFAULT_TIMEOUT
    );
  });

  describe('computer api', () => {
    test(
      'computer api is available',
      async () => {
        const provider = await createE2BProvider(TEST_PLATFORMS, 'linux');
        const instance = await provider.createInstance({
          platformId: 'linux',
          config: {
            id: 'test-linux',
            env: {
              DISPLAY: ':99',
              WIDTH: '1024',
              HEIGHT: '768',
            },
          },
        });

        await instance.start();

        const info = await instance.sandbox?.getHost(8000);
        expect(info).toBeDefined();

        const docsResponse = await fetch(`https://${info}/docs`);
        expect(docsResponse.status).toBe(200);

        const mousePositionResponse = await fetch(
          `https://${info}/api/mouse/position`
        );
        expect(mousePositionResponse.status).toBe(200);

        await instance.terminate();
      },
      DEFAULT_TIMEOUT
    );
  });
});
