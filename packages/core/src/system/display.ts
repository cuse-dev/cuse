import * as client from './client';
import type { DisplayInterface, SystemConfig } from './types';

/**
 * Display control implementation
 * Provides functionality for screen operations like taking screenshots
 */
export class Display implements DisplayInterface {
  constructor(private config: SystemConfig) {}

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

    return response.data as unknown as File | Blob;
  }
}
