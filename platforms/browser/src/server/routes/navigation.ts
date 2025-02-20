import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const NavigateRequest = t.Object({
  url: t.String(),
  waitUntil: t.Optional(
    t.Union([
      t.Literal('load'),
      t.Literal('domcontentloaded'),
      t.Literal('networkidle'),
    ])
  ),
});

export function navigationRoutes(browserController: BrowserController) {
  return new Elysia().group('/navigation', (app) =>
    app
      .post(
        '/navigate',
        async ({ body }) => {
          return await browserController.navigation.navigate(body);
        },
        {
          body: NavigateRequest,
          detail: {
            tags: ['navigation'],
            summary: 'Navigate to URL',
            description: 'Navigates the browser to the specified URL.',
            responses: {
              '200': { description: 'Successfully navigated to URL' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/back',
        async () => {
          return await browserController.navigation.back();
        },
        {
          detail: {
            tags: ['navigation'],
            summary: 'Go Back',
            description: 'Navigates back one page in browser history.',
            responses: {
              '200': { description: 'Successfully navigated back' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/forward',
        async () => {
          return await browserController.navigation.forward();
        },
        {
          detail: {
            tags: ['navigation'],
            summary: 'Go Forward',
            description: 'Navigates forward one page in browser history.',
            responses: {
              '200': { description: 'Successfully navigated forward' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/reload',
        async () => {
          return await browserController.navigation.reload();
        },
        {
          detail: {
            tags: ['navigation'],
            summary: 'Reload Page',
            description: 'Reloads the current page.',
            responses: {
              '200': { description: 'Successfully reloaded page' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/url',
        async () => {
          return await browserController.navigation.getCurrentUrl();
        },
        {
          detail: {
            tags: ['navigation'],
            summary: 'Get Current URL',
            description: 'Returns the URL of the current page.',
            responses: {
              '200': {
                description: 'Successfully retrieved current URL',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/title',
        async () => {
          return await browserController.navigation.getTitle();
        },
        {
          detail: {
            tags: ['navigation'],
            summary: 'Get Page Title',
            description: 'Returns the title of the current page.',
            responses: {
              '200': {
                description: 'Successfully retrieved page title',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )
  );
}
