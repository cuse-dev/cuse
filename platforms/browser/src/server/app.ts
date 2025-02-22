import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { BrowserController } from '../controllers/browser';
import {
  bashRoutes,
  displayRoutes,
  filesystemRoutes,
  keyboardRoutes,
  keychainRoutes,
  mouseRoutes,
  navigationRoutes,
} from './routes';

const browserController = new BrowserController();

const app = new Elysia()
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Browser Platform API',
          version: '1.0.0',
          description: 'REST API for controlling a browser using Playwright',
        },
        tags: [
          { name: 'mouse', description: 'Mouse operations' },
          { name: 'keyboard', description: 'Keyboard operations' },
          { name: 'display', description: 'Display operations' },
          {
            name: 'navigation',
            description: 'Browser navigation operations',
          },
          { name: 'bash', description: 'Browser JavaScript execution' },
          { name: 'filesystem', description: 'Local filesystem operations' },
          { name: 'keychain', description: 'Secure credential storage' },
        ],
      },
    })
  )
  .group('/api', (app) =>
    app
      .use(mouseRoutes(browserController))
      .use(keyboardRoutes(browserController))
      .use(displayRoutes(browserController))
      .use(navigationRoutes(browserController))
      .use(bashRoutes(browserController))
      .use(filesystemRoutes(browserController))
      .use(keychainRoutes(browserController))
  )
  .onError(({ code, error }) => {
    console.error(`Error ${code}:`, error);
    return {
      code,
      error: error,
    };
  })
  .listen(8000);

console.log(`Browser platform running at ${app.server?.url}`);
