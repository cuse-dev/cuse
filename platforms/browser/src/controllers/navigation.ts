import type { NavigateRequest } from '../types/requests';
import type { BrowserController } from './browser';

export class NavigationController {
  constructor(private browserController: BrowserController) {}

  async navigate({ url, waitUntil = 'load' }: NavigateRequest) {
    const page = await this.browserController.getPage();
    await page.goto(url, { waitUntil });
    return new Response(null, { status: 204 });
  }

  async back() {
    const page = await this.browserController.getPage();
    await page.goBack();
    return new Response(null, { status: 204 });
  }

  async forward() {
    const page = await this.browserController.getPage();
    await page.goForward();
    return new Response(null, { status: 204 });
  }

  async reload() {
    const page = await this.browserController.getPage();
    await page.reload();
    return new Response(null, { status: 204 });
  }

  async getCurrentUrl() {
    const page = await this.browserController.getPage();
    return new Response(JSON.stringify({ url: page.url() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getTitle() {
    const page = await this.browserController.getPage();
    return new Response(JSON.stringify({ title: await page.title() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async waitForNavigation({ waitUntil = 'load' }: Partial<NavigateRequest>) {
    const page = await this.browserController.getPage();
    await page.waitForLoadState(waitUntil);
    return new Response(null, { status: 204 });
  }
}
