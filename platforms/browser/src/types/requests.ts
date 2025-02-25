// Base request type for display-specific operations
export interface DisplayRequest {
  display_num?: number;
}

// Mouse movement request
export interface MouseMoveRequest extends DisplayRequest {
  x: number;
  y: number;
}

// Keyboard key press request
export interface KeyPressRequest extends DisplayRequest {
  key: string;
}

// Text typing request
export interface TypeTextRequest extends DisplayRequest {
  text: string;
  typing_delay?: number;
  typing_group_size?: number;
}

// Hotkey combination request
export interface HotkeyRequest extends DisplayRequest {
  keys: string[];
}

// Image location request
export interface ImageLocateRequest extends DisplayRequest {
  image_path: string;
  confidence?: number;
}

// Pixel color request
export interface PixelColorRequest extends DisplayRequest {
  x: number;
  y: number;
}

// Navigation request (browser-specific)
export interface NavigateRequest {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

// Scroll request
export interface ScrollRequest extends DisplayRequest {
  clicks: number;
}
