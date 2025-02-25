import type {
  DisplayRequest,
  MouseMoveRequest,
  ScrollRequest,
} from '../types/requests';
import type { BrowserController } from './browser';

export class MouseController {
  private browserController: BrowserController;

  constructor(browserController: BrowserController) {
    this.browserController = browserController;
  }

  async move({ x, y }: MouseMoveRequest) {
    const page = await this.browserController.getPage();
    await page.mouse.move(x, y);
    return new Response(null, { status: 204 });
  }

  async leftClick(_: DisplayRequest) {
    const page = await this.browserController.getPage();
    const position = await this.browserController.getMousePosition();
    await page.mouse.click(position.x, position.y, { button: 'left' });
    return new Response(null, { status: 204 });
  }

  async rightClick(_: DisplayRequest) {
    const page = await this.browserController.getPage();
    const position = await this.browserController.getMousePosition();
    await page.mouse.click(position.x, position.y, { button: 'right' });
    return new Response(null, { status: 204 });
  }

  async middleClick(_: DisplayRequest) {
    const page = await this.browserController.getPage();
    const position = await this.browserController.getMousePosition();
    await page.mouse.click(position.x, position.y, { button: 'middle' });
    return new Response(null, { status: 204 });
  }

  async doubleClick(_: DisplayRequest) {
    const page = await this.browserController.getPage();
    const position = await this.browserController.getMousePosition();
    await page.mouse.dblclick(position.x, position.y);
    return new Response(null, { status: 204 });
  }

  async drag({ x, y }: MouseMoveRequest) {
    const page = await this.browserController.getPage();
    const position = await this.browserController.getMousePosition();

    // Start drag from current position
    await page.mouse.move(position.x, position.y);
    await page.mouse.down();

    // Move to target position
    await page.mouse.move(x, y);

    // Release
    await page.mouse.up();

    return new Response(null, { status: 204 });
  }

  async getPosition() {
    const position = await this.browserController.getMousePosition();

    return new Response(
      JSON.stringify({
        x: position.x,
        y: position.y,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async scroll({ clicks }: ScrollRequest) {
    console.log('scroll', clicks);

    const page = await this.browserController.getPage();
    await page.mouse.wheel(0, clicks * 100); // 100 pixels per click
    return new Response(null, { status: 204 });
  }
}
