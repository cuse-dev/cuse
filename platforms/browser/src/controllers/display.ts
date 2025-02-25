import { ElementLocatorService } from '../services/element';
import { ScreenshotService } from '../services/screenshot';
import type { ImageLocateRequest, PixelColorRequest } from '../types/requests';
import type { BrowserController } from './browser';

export class DisplayController {
  private elementLocator: ElementLocatorService;
  private screenshotService: ScreenshotService;
  private browserController: BrowserController;

  constructor(browserController: BrowserController) {
    this.browserController = browserController;
    this.elementLocator = new ElementLocatorService(browserController);
    this.screenshotService = new ScreenshotService(browserController);
  }

  async takeScreenshot(params?: {
    format?: string;
    quality?: number;
  }) {
    const page = await this.browserController.getPage();
    const screenshot = await this.screenshotService.capture(page);

    return new Response(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }

  async getScreenSize() {
    const page = await this.browserController.getPage();
    const viewport = page.viewportSize();

    return new Response(
      JSON.stringify({
        width: viewport?.width || 0,
        height: viewport?.height || 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async locateImage({ image_path, confidence = 0.9 }: ImageLocateRequest) {
    const location = await this.elementLocator.findImage(
      image_path,
      confidence
    );

    if (!location) {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(location), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getPixelColor({ x, y }: PixelColorRequest) {
    const page = await this.browserController.getPage();

    // Use page.evaluate to get pixel color from canvas
    const color = await page.evaluate(
      ([px, py]) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        // Get color data for the pixel
        const data = context.getImageData(px, py, 1, 1).data;
        return [data[0], data[1], data[2]]; // RGB values
      },
      [x, y]
    );

    return new Response(JSON.stringify(color || [0, 0, 0]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
