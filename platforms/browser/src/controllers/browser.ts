import { type Browser, type Page, chromium } from 'playwright';
import { BashController } from './bash';
import { DisplayController } from './display';
import { FilesystemController } from './filesystem';
import { KeyboardController } from './keyboard';
import { KeychainController } from './keychain';
import { MouseController } from './mouse';
import { NavigationController } from './navigation';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _mouseX: number;
    _mouseY: number;
  }
}

export class BrowserController {
  private browser: Browser | null = null;
  private pages: Map<number, Page> = new Map();
  private currentPageNum = 0;
  private initializationPromise: Promise<void>;
  mouse: MouseController;
  keyboard: KeyboardController;
  display: DisplayController;
  navigation: NavigationController;
  bash: BashController;
  filesystem: FilesystemController;
  keychain: KeychainController;

  constructor() {
    // Initialize the promise right away
    this.initializationPromise = this.initialize().catch((error) => {
      console.error('Browser initialization failed:', error);
      throw error;
    });

    this.mouse = new MouseController(this);
    this.keyboard = new KeyboardController(this);
    this.display = new DisplayController(this);
    this.navigation = new NavigationController(this);
    this.bash = new BashController(this);
    this.filesystem = new FilesystemController(this);
    this.keychain = new KeychainController(this);
  }

  private async initialize(pageNum = 1) {
    if (this.browser) {
      return; // Already initialized
    }

    try {
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      // Ensure browser is properly initialized before continuing
      if (!this.browser) {
        throw new Error('Browser failed to launch');
      }

      const context = await this.browser.newContext();
      const page = await context.newPage();

      // Ensure page is properly initialized
      if (!page) {
        throw new Error('Failed to create new page');
      }

      // Initialize mouse tracking on any page load
      await page.addInitScript(() => {
        window._mouseX = 0;
        window._mouseY = 0;

        document.addEventListener(
          'mousemove',
          (e) => {
            window._mouseX = e.clientX;
            window._mouseY = e.clientY;
          },
          { capture: true }
        );
      });

      // Store the initial page
      this.pages.set(pageNum, page);
      this.currentPageNum = pageNum;

      // Navigate to a blank page initially
      await page.goto('https://www.google.com');

      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      // Clean up any partially initialized resources
      await this.cleanup();
      throw error;
    }
  }

  async getBrowser(): Promise<Browser> {
    try {
      await this.initializationPromise;
      if (!this.browser) {
        throw new Error(
          'Browser initialization failed - browser instance is null'
        );
      }
      return this.browser;
    } catch (error) {
      console.error('Error getting browser:', error);
      throw error;
    }
  }

  async getPage(displayNum?: number): Promise<Page> {
    try {
      await this.initializationPromise;

      // If no display number specified, use current page
      const pageNum = displayNum ?? this.currentPageNum;

      const page = this.pages.get(pageNum);
      if (!page) {
        // If display was not found, create it
        const context = await this.browser!.newContext();
        const newPage = await context.newPage();
        this.pages.set(pageNum, newPage);
        return newPage;
      }
      return page;
    } catch (error) {
      console.error('Error getting page:', error);
      throw error;
    }
  }

  async getMousePosition(): Promise<{ x: number; y: number }> {
    const page = await this.getPage();
    const position = await page.evaluate(() => ({
      x: window._mouseX,
      y: window._mouseY,
    }));
    return position;
  }

  async cleanup() {
    try {
      // Close all pages
      for (const page of this.pages.values()) {
        await page.close();
      }
      this.pages.clear();

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Don't rethrow as we're cleaning up anyway
    }
  }
}

// Export types
export type { Browser, Page } from 'playwright';
