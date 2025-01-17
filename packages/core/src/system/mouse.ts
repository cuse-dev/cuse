import * as client from './client';
import {
  MouseInterface,
  Position,
  SystemConfig,
  MoveParams,
  DragParams,
} from './types';
import { handleResponse } from './utils';

/**
 * Mouse control implementation
 * Provides functionality for cursor movement and mouse click operations
 */
export class Mouse implements MouseInterface {
  constructor(private config: SystemConfig) {}

  /**
   * Get the current position of the mouse cursor
   * @returns Promise resolving to cursor coordinates
   * @throws Error if getting cursor position fails
   */
  async getPosition(): Promise<Position> {
    const response = await handleResponse(
      client.computerGetCursorPosition({
        body: { display_num: this.config.displayNum },
      })
    );
    return response as Position;
  }

  /**
   * Move the mouse cursor to specified coordinates
   * @param params Movement parameters containing target coordinates
   * @throws Error if cursor movement fails
   */
  async move({ x, y }: MoveParams): Promise<void> {
    await handleResponse(
      client.computerMoveCursor({
        body: { x, y, display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Perform a left mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async leftClick(): Promise<void> {
    await handleResponse(
      client.computerLeftClick({
        body: { display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Perform a right mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async rightClick(): Promise<void> {
    await handleResponse(
      client.computerRightClick({
        body: { display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Perform a middle mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async middleClick(): Promise<void> {
    await handleResponse(
      client.computerMiddleClick({
        body: { display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Perform a double click with left mouse button at current cursor position
   * @throws Error if click operation fails
   */
  async doubleClick(): Promise<void> {
    await handleResponse(
      client.computerDoubleClick({
        body: { display_num: this.config.displayNum },
      })
    );
  }

  /**
   * Perform a left mouse button click and drag to a specified position
   * @param params Drag parameters containing target coordinates
   * @throws Error if click drag operation fails
   */
  async leftClickDrag({ x, y }: DragParams): Promise<void> {
    await handleResponse(
      client.computerLeftClickDrag({
        body: { x, y, display_num: this.config.displayNum },
      })
    );
  }
}
