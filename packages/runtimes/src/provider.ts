import type {
  Platform,
  PlatformProviderConfig,
  RuntimeCreationOptions,
} from './platform';
import type { BaseRuntime } from './runtime';
import type { BaseRuntimeConfig } from './types';

/**
 * RuntimeProvider is responsible for creating and managing runtime instances
 * for a specific infrastructure provider (e.g. Docker, AWS, etc.)
 */
export interface RuntimeProvider<T extends BaseRuntime> {
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
  createInstance(options: RuntimeCreationOptions): Promise<T>;
}

/**
 * Base implementation of RuntimeProvider with common functionality
 */
export abstract class BaseRuntimeProvider<T extends BaseRuntime>
  implements RuntimeProvider<T>
{
  protected platforms: Map<string, Platform>;
  protected defaultPlatform: Platform;

  constructor(config: PlatformProviderConfig) {
    this.platforms = new Map(config.platforms.map((p) => [p.id, p]));
    const defaultPlatform = this.platforms.get(config.defaultPlatform);
    if (!defaultPlatform) {
      throw new Error(`Default platform "${config.defaultPlatform}" not found`);
    }
    this.defaultPlatform = defaultPlatform;
  }

  getPlatforms(): Platform[] {
    return Array.from(this.platforms.values());
  }

  getPlatform(id: string): Platform | undefined {
    return this.platforms.get(id);
  }

  /**
   * Create container configuration from platform and options
   */
  protected createContainerConfig(
    platform: Platform,
    options?: RuntimeCreationOptions['config']
  ): BaseRuntimeConfig {
    const defaultResources = platform.defaultResources ?? {
      memoryMb: 2048,
      cpuCount: 2,
    };

    return {
      id: `${platform.id}-${Date.now()}`,
      name: `${platform.name}`,
      memoryMb: options?.memoryMb ?? defaultResources.memoryMb,
      cpuCount: options?.cpuCount ?? defaultResources.cpuCount,
      timeoutMs: options?.timeoutMs ?? 300000,
      metadata: {
        platformId: platform.id,
        platformVersion: platform.version,
        ...options?.metadata,
      },
    };
  }

  abstract createInstance(options: RuntimeCreationOptions): Promise<T>;
}
