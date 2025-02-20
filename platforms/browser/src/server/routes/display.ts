import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const DisplayRequest = t.Object({
  display_num: t.Optional(t.Number()),
});

const ScreenshotRequest = t.Object({
  display_num: t.Optional(t.Number()),
  format: t.Optional(t.String()),
  quality: t.Optional(t.Number()),
});

export function displayRoutes(browserController: BrowserController) {
  return new Elysia().group('/display', (app) =>
    app
      .get(
        '/screenshot',
        async ({ query }) => {
          return await browserController.display.takeScreenshot(query);
        },
        {
          query: ScreenshotRequest,
          detail: {
            tags: ['display'],
            summary: 'Take Screenshot',
            description: 'Captures a screenshot of the current display.',
            responses: {
              '200': {
                description: 'Successfully captured screenshot',
                content: {
                  'image/*': {
                    schema: { type: 'string', format: 'binary' },
                  },
                },
              },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/size',
        async ({ query }) => {
          return await browserController.display.getScreenSize(query);
        },
        {
          query: DisplayRequest,
          detail: {
            tags: ['display'],
            summary: 'Get Screen Size',
            description: 'Returns the dimensions of the current display.',
            responses: {
              '200': {
                description: 'Successfully retrieved screen size',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        width: { type: 'number' },
                        height: { type: 'number' },
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
