import type { BrowserController } from './browser';

interface KeychainItem {
  username?: string;
  password?: string;
  token?: string;
  email?: string;
  phone?: string;
  otp?: string;
}

interface AuthElement {
  type: string;
  coordinates: Record<string, number>;
}

export class KeychainController {
  private storage: Map<string, KeychainItem> = new Map();
  private browserController: BrowserController;

  constructor(browserController: BrowserController) {
    this.browserController = browserController;
  }

  async setItem({
    service,
    item,
  }: {
    service: string;
    item: KeychainItem;
  }): Promise<Response> {
    try {
      this.storage.set(service, item);
      return new Response(null, { status: 204 });
    } catch (_error) {
      return new Response(
        JSON.stringify({ error: 'Failed to store keychain item' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async deleteItem({ service }: { service: string }): Promise<Response> {
    try {
      if (!this.storage.has(service)) {
        return new Response(JSON.stringify({ error: 'Service not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      this.storage.delete(service);
      return new Response(null, { status: 204 });
    } catch (_error) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete keychain item' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async listServices(): Promise<Response> {
    try {
      const services = Array.from(this.storage.keys());
      return new Response(JSON.stringify(services), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_error) {
      return new Response(
        JSON.stringify({ error: 'Failed to list services' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async authenticate({
    service,
    authElements,
  }: {
    service: string;
    authElements: AuthElement[];
  }): Promise<Response> {
    try {
      const item = this.storage.get(service);
      if (!item) {
        return new Response(JSON.stringify(false), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify all required credentials exist first
      for (const element of authElements) {
        const storedValue = item[element.type as keyof KeychainItem];
        if (!storedValue) {
          return new Response(JSON.stringify(false), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Perform the actual login actions
      for (const element of authElements) {
        const storedValue = item[element.type as keyof KeychainItem];
        // Move mouse to coordinates
        await this.browserController.mouse.move({
          x: element.coordinates.x,
          y: element.coordinates.y,
        });
        // Small delay for stability
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Click at the position
        await this.browserController.mouse.leftClick({});
        // Small delay before typing
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Type the stored value
        await this.browserController.keyboard.typeText({
          text: storedValue as string,
        });
        // Small delay after typing
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return new Response(JSON.stringify(true), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_error) {
      return new Response(JSON.stringify({ error: 'Failed to authenticate' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
