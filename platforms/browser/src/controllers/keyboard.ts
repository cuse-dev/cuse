import type {
  HotkeyRequest,
  KeyPressRequest,
  TypeTextRequest,
} from '../types/requests';
import type { BrowserController } from './browser';

export class KeyboardController {
  constructor(private browserController: BrowserController) {}

  async pressKey({ key }: KeyPressRequest) {
    const page = await this.browserController.getPage();
    await page.keyboard.press(key);
    return new Response(null, { status: 200 });
  }

  async typeText({
    text,
    typing_delay = 12,
    typing_group_size = 50,
  }: TypeTextRequest) {
    const page = await this.browserController.getPage();

    // Split text into groups for more natural typing
    const groups =
      text.match(new RegExp(`.{1,${typing_group_size}}`, 'g')) || [];

    for (const group of groups) {
      await page.keyboard.type(group, { delay: typing_delay });
    }

    return new Response(null, { status: 200 });
  }

  async pressHotkey({ keys }: HotkeyRequest) {
    const page = await this.browserController.getPage();

    // Press all keys in sequence
    for (const key of keys) {
      await page.keyboard.down(key);
    }

    // Release all keys in reverse order
    for (const key of keys.reverse()) {
      await page.keyboard.up(key);
    }

    return new Response(null, { status: 200 });
  }

  async holdKey({ key }: KeyPressRequest) {
    const page = await this.browserController.getPage();
    await page.keyboard.down(key);
    return new Response(null, { status: 200 });
  }

  async releaseKey({ key }: KeyPressRequest) {
    const page = await this.browserController.getPage();
    await page.keyboard.up(key);
    return new Response(null, { status: 200 });
  }
}
