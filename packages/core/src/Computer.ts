import type { App } from './App';
import { initSystem } from './system';

export interface DisplayConfig {
  number: number;
  width: number;
  height: number;
}

export interface ComputerConfig {
  baseUrl: string;
  display?: DisplayConfig;
}

const defaultDisplay = {
  number: 1,
  width: 1024,
  height: 768,
};

export class Computer<T extends Record<string, App> = Record<string, App>> {
  apps: T;
  system: ReturnType<typeof initSystem>;
  config: ComputerConfig & { display: DisplayConfig };

  constructor({ apps, config }: { apps?: T; config: ComputerConfig }) {
    this.apps = apps ?? ({} as T);

    this.config = {
      baseUrl: config.baseUrl,
      display: config.display ?? defaultDisplay,
    };

    this.system = initSystem({
      displayNum: this.config.display.number,
      baseUrl: this.config.baseUrl,
    });
  }

  async boot() {
    await Promise.all(Object.values(this.apps).map((app) => app._init(this)));
    await Promise.all(
      Object.values(this.apps).map((app) => app.config.autoStart && app.start())
    );
  }

  async setup() {
    await Promise.all(Object.values(this.apps).map((app) => app.install()));
  }

  async shutdown() {
    await Promise.all(Object.values(this.apps).map((app) => app.stop()));
  }

  static async create(config: ComputerConfig) {
    const computer = new Computer({ config });
    await computer.boot();
    await computer.setup();
    return computer;
  }
}
