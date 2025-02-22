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
        '/stream',
        async ({ query }) => {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Live Display Stream</title>
                <style>
                  body { margin: 0; padding: 0; overflow: hidden; }
                  img { width: 100%; height: 100vh; object-fit: contain; }
                </style>
              </head>
              <body>
                <img src="/api/display/screenshot${query.display_num ? `?display_num=${query.display_num}` : ''}" id="stream">
                <script>
                  setInterval(() => {
                    const img = document.getElementById('stream');
                    img.src = '/api/display/screenshot${query.display_num ? `?display_num=${query.display_num}` : ''}?' + new Date().getTime();
                  }, 2000);
                </script>
              </body>
            </html>
          `;

          return new Response(html, {
            headers: {
              'Content-Type': 'text/html',
            },
          });
        },
        {
          query: DisplayRequest,
          detail: {
            tags: ['display'],
            summary: 'Stream Display',
            description:
              'Returns an HTML page that shows a live stream of the display, refreshing every 2 seconds.',
            responses: {
              '200': {
                description: 'HTML page with auto-refreshing display stream',
                content: {
                  'text/html': {
                    schema: { type: 'string' },
                  },
                },
              },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

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
