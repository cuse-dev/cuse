import type { Page } from 'playwright';
import type { BrowserController } from '../controllers/browser';

export class ScreenshotService {
  private browserController: BrowserController;

  constructor(browserController: BrowserController) {
    this.browserController = browserController;
  }

  async capture(page?: Page) {
    const targetPage = page || (await this.browserController.getPage());

    // Take full page screenshot
    const screenshot = await targetPage.screenshot({
      fullPage: false,
      type: 'png',
    });

    return screenshot;
  }

  async captureElement(selector: string, page?: Page) {
    const targetPage = page || (await this.browserController.getPage());
    const element = await targetPage.$(selector);

    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Take element screenshot
    const screenshot = await element.screenshot({
      type: 'png',
    });

    return screenshot;
  }

  async captureViewport(page?: Page) {
    const targetPage = page || (await this.browserController.getPage());

    // Take viewport screenshot
    const screenshot = await targetPage.screenshot({
      fullPage: false,
      type: 'png',
    });

    return screenshot;
  }

  async captureRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    page?: Page
  ) {
    const targetPage = page || (await this.browserController.getPage());

    // Take region screenshot
    const screenshot = await targetPage.screenshot({
      clip: {
        x,
        y,
        width,
        height,
      },
      type: 'png',
    });

    return screenshot;
  }
}
