import type { BaseRuntime } from './runtime';
import type {
  BaseRuntimeConfig,
  Platform,
  RuntimeCreationOptions,
  RuntimeProvider,
  RuntimeProviderConfig,
} from './types';

/**
 * Base implementation of RuntimeProvider with common functionality
 */
export abstract class BaseRuntimeProvider<
  RuntimeType extends BaseRuntime = BaseRuntime,
  RuntimeConfigType extends BaseRuntimeConfig = BaseRuntimeConfig,
> implements RuntimeProvider<RuntimeType, RuntimeConfigType>
{
  protected platforms: Map<string, Platform>;
  protected defaultPlatform: Platform;

  instances: Map<string, RuntimeType> = new Map();

  constructor(config: RuntimeProviderConfig) {
    this.platforms = new Map(config.platforms.map((p) => [p.id, p]));
    const defaultPlatform = this.platforms.get(
      config.defaultPlatform ?? this.platforms.values().next().value?.id
    );
    if (!defaultPlatform) {
      throw new Error(`Default platform "${config.defaultPlatform}" not found`);
    }
    this.defaultPlatform = defaultPlatform;
  }

  async indexInstances(): Promise<Record<string, RuntimeType>> {
    const instances = await this.listInstances();
    return instances.reduce(
      (acc, instance) => {
        acc[instance.id] = instance;
        return acc;
      },
      {} as Record<string, RuntimeType>
    );
  }

  getPlatforms(): Platform[] {
    return Array.from(this.platforms.values());
  }

  getPlatform(id: string): Platform | undefined {
    return this.platforms.get(id);
  }

  async listInstances(): Promise<RuntimeType[]> {
    return Promise.all(Array.from(this.instances.values()));
  }

  async getInstance(id: string): Promise<RuntimeType | undefined> {
    return this.instances.get(id);
  }

  abstract createInstance(
    options: RuntimeCreationOptions<RuntimeConfigType>
  ): Promise<RuntimeType>;
}
