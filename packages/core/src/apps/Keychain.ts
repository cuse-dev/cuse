import { App } from '../App';
import { AuthElement, KeychainItem } from '../system/types';
export type { AuthElement };
export class Keychain extends App {
  public services: string[] = [];

  constructor() {
    super({
      name: 'keychain',
      platform: 'linux',
      autoStart: true,
    });
  }

  async start() {}
  async stop() {}
  async install() {}

  async init() {
    const keys = await this.computer.system.keychain.listServices();
    this.services = keys;
  }

  async authenticate(serviceId: string, form: AuthElement[]) {
    return await this.computer.system.keychain.authenticate({
      service: serviceId,
      authElements: form,
    });
  }

  async setKey(key: string, value: KeychainItem) {
    await this.computer.system.keychain.setItem({
      service: key,
      item: value,
    });
  }
}
