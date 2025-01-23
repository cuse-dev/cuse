import { Computer } from '../Computer';
import * as client from './client';
import { DisplayInterface, SystemConfig } from './types';
import sharp from 'sharp';

/**
 * Display control implementation
 * Provides functionality for screen operations like taking screenshots
 */
export class Display implements DisplayInterface {
  constructor(
    private computer: Computer,
    private config: SystemConfig
  ) {}

  /**
   * Capture a screenshot of the current display state
   * @returns Promise resolving to screenshot data as a File or Blob
   * @throws Error if screenshot capture fails or response is empty
   */
  async getScreenshot(): Promise<File | Blob> {
    const response = await client.takeScreenshot({
      query: { display_num: this.config.displayNum },
    });

    if (!response.data) {
      throw new Error('Failed to capture screenshot');
    }

    // Convert response.data to Buffer if it isn't already
    const buffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data as ArrayBuffer);

    // Use sharp to resize the image
    const resizedBuffer = await sharp(buffer)
      .resize({
        width: this.computer.config.display.width,
        height: this.computer.config.display.height,
        fit: 'inside',
      })
      .toBuffer();

    // Create a Blob from the buffer
    return new Blob([resizedBuffer], { type: 'image/png' });
  }
}
