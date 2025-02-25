import type { Computer } from './Computer';

export interface AppConfig {
  name: string;
  platform: string;
  autoStart: boolean;
}

export abstract class App {
  config: AppConfig;
  computer!: Computer;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async _init(computer: Computer, ...args: any[]): Promise<void> {
    this.computer = computer;
    await this.init(...args);
  }

  abstract init(...args: any[]): Promise<void>;
  abstract install(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
