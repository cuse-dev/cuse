import * as cv from '@techstark/opencv-js';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import type { BrowserController } from '../controllers/browser';

export class ElementLocatorService {
  constructor(private browserController: BrowserController) {}

  async findImage(imagePath: string, confidence: number) {
    const page = await this.browserController.getPage();

    // Take screenshot of current page
    const screenshot = await page.screenshot();

    // Convert images to ImageData format using sharp
    const [templateImage, screenshotImage] = await Promise.all([
      sharp(readFileSync(imagePath)).raw().toBuffer(),
      sharp(screenshot as Buffer)
        .raw()
        .toBuffer(),
    ]);

    const [templateMeta, screenshotMeta] = await Promise.all([
      sharp(readFileSync(imagePath)).metadata(),
      sharp(screenshot as Buffer).metadata(),
    ]);

    // Create ImageData objects
    const template = cv.matFromImageData({
      data: new Uint8ClampedArray(templateImage),
      width: templateMeta.width!,
      height: templateMeta.height!,
    });

    const source = cv.matFromImageData({
      data: new Uint8ClampedArray(screenshotImage),
      width: screenshotMeta.width!,
      height: screenshotMeta.height!,
    });

    // Create result matrix
    const result = new cv.Mat();
    const mask = new cv.Mat();

    // Perform template matching
    cv.matchTemplate(source, template, result, cv.TM_CCOEFF_NORMED, mask);

    // Get best match location
    const maxLoc = cv.minMaxLoc(result, mask);

    // Clean up
    source.delete();
    template.delete();
    result.delete();
    mask.delete();

    // Return null if confidence threshold not met
    if (maxLoc.maxVal < confidence) {
      return null;
    }

    // Return location and size
    return {
      x: maxLoc.maxLoc.x,
      y: maxLoc.maxLoc.y,
      width: templateMeta.width!,
      height: templateMeta.height!,
    };
  }
}
