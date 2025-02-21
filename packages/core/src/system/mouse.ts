import * as client from './client';
import type {
  DragParams,
  MouseInterface,
  MoveParams,
  Position,
  ScrollParams,
  SystemConfig,
} from './types';

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
    const response = await client.getMousePosition({
      query: { display_num: this.config.displayNum },
    });

    if (!response.data) {
      throw new Error('Failed to get cursor position');
    }

    // The response data is already in {x: number, y: number} format
    return response.data as { x: number; y: number };
  }

  /**
   * Move the mouse cursor to specified coordinates
   * @param params Movement parameters containing target coordinates
   * @throws Error if cursor movement fails
   */
  async move({ x, y }: MoveParams): Promise<void> {
    await client.moveMouse({
      body: { x, y, display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a left mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async leftClick(): Promise<void> {
    await client.leftClick({
      body: { display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a right mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async rightClick(): Promise<void> {
    await client.rightClick({
      body: { display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a middle mouse button click at current cursor position
   * @throws Error if click operation fails
   */
  async middleClick(): Promise<void> {
    await client.middleClick({
      body: { display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a double click with left mouse button at current cursor position
   * @throws Error if click operation fails
   */
  async doubleClick(): Promise<void> {
    await client.doubleClick({
      body: { display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a left mouse button click and drag to a specified position
   * @param params Drag parameters containing target coordinates
   * @throws Error if click drag operation fails
   */
  async leftClickDrag({ x, y }: DragParams): Promise<void> {
    await client.dragMouse({
      body: { x, y, display_num: this.config.displayNum },
    });
  }

  /**
   * Perform a mouse wheel scroll operation
   * @param params Scroll parameters containing number of clicks
   * @throws Error if scroll operation fails
   */
  async scroll({ clicks }: ScrollParams): Promise<void> {
    await client.scrollMouse({
      body: { clicks, display_num: this.config.displayNum },
    });
  }
}
