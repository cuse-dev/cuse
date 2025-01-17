import * as client from './client';
import {
  KeyboardInterface,
  SystemConfig,
  PressKeyParams,
  TypeParams,
} from './types';
import { handleResponse } from './utils';

/**
 * Keyboard control implementation
 * Provides functionality for keyboard input operations
 */
export class Keyboard implements KeyboardInterface {
  constructor(private config: SystemConfig) {}

  /**
   * Simulate pressing a single key on the keyboard
   * @param params Parameters containing the key to press
   * @throws Error if key press operation fails
   */
  async pressKey({ key }: PressKeyParams): Promise<void> {
    await handleResponse(
      client.computerPressKey({
        body: { key: key, display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Simulate typing a sequence of text
   * @param params Parameters containing the text to type
   * @throws Error if typing operation fails
   */
  async type({ text }: TypeParams): Promise<void> {
    await handleResponse(
      client.computerTypeText({
        body: { text, display_num: this.config.displayNum },
      })
    );
  }
}
