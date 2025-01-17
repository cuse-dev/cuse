import * as client from './client';
import { SystemConfig, SystemInterface } from './types';
import { Mouse } from './mouse';
import { Keyboard } from './keyboard';
import { Display } from './display';
import { Bash } from './bash';
import { Editor } from './editor';
/**
 * Initialize the system control interface
 * @param config System configuration options
 * @returns System interface for controlling mouse, keyboard and display
 * @throws Error if initialization fails
 */
export function initSystem(config: SystemConfig): SystemInterface {
  if (!config.displayNum || config.displayNum < 0) {
    throw new Error('Invalid display number');
  }

  // Configure client
  client.client.setConfig({
    baseUrl: config.baseUrl,
  });

  return {
    mouse: new Mouse(config),
    keyboard: new Keyboard(config),
    display: new Display(config),
    bash: new Bash(config),
    editor: new Editor(config),
  };
}

export * from './types';
