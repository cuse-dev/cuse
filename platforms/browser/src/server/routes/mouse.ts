import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const MouseMoveRequest = t.Object({
  x: t.Number(),
  y: t.Number(),
  display_num: t.Optional(t.Number()),
});

const DisplayRequest = t.Object({
  display_num: t.Optional(t.Number()),
});

const ScrollRequest = t.Object({
  clicks: t.Number(),
  display_num: t.Optional(t.Number()),
});

export function mouseRoutes(browserController: BrowserController) {
  return new Elysia().group('/mouse', (app) =>
    app
      .post(
        '/move',
        async ({ body }) => {
          return await browserController.mouse.move(body);
        },
        {
          body: MouseMoveRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Move Mouse Cursor',
            description:
              'Moves the mouse cursor to the specified X and Y coordinates on the screen.',
            responses: {
              '204': { description: 'Successfully moved the cursor' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/left-click',
        async ({ body }) => {
          return await browserController.mouse.leftClick(body);
        },
        {
          body: DisplayRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Perform Left Click',
            description:
              'Performs a left mouse button click at the current cursor position.',
            responses: {
              '204': { description: 'Successfully performed left click' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/right-click',
        async ({ body }) => {
          return await browserController.mouse.rightClick(body);
        },
        {
          body: DisplayRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Perform Right Click',
            description:
              'Performs a right mouse button click at the current cursor position.',
            responses: {
              '204': { description: 'Successfully performed right click' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/middle-click',
        async ({ body }) => {
          return await browserController.mouse.middleClick(body);
        },
        {
          body: DisplayRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Perform Middle Click',
            description:
              'Performs a middle mouse button click at the current cursor position.',
            responses: {
              '204': { description: 'Successfully performed middle click' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/double-click',
        async ({ body }) => {
          return await browserController.mouse.doubleClick(body);
        },
        {
          body: DisplayRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Perform Double Click',
            description:
              'Performs a double left click at the current cursor position.',
            responses: {
              '204': { description: 'Successfully performed double click' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/drag',
        async ({ body }) => {
          return await browserController.mouse.drag(body);
        },
        {
          body: MouseMoveRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Drag Mouse',
            description:
              'Performs a drag operation from the current cursor position to the specified coordinates.',
            responses: {
              '204': { description: 'Successfully performed drag operation' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/position',
        async () => {
          return await browserController.mouse.getPosition();
        },
        {
          detail: {
            tags: ['mouse'],
            summary: 'Get Cursor Position',
            description:
              'Gets the current position of the mouse cursor on the screen.',
            responses: {
              '200': {
                description: 'Successfully retrieved cursor position',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
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

      .post(
        '/scroll',
        async ({ body }) => {
          return await browserController.mouse.scroll(body);
        },
        {
          body: ScrollRequest,
          detail: {
            tags: ['mouse'],
            summary: 'Scroll Mouse Wheel',
            description:
              'Scrolls the mouse wheel by the specified number of clicks. Positive numbers scroll up, negative numbers scroll down.',
            responses: {
              '204': { description: 'Successfully performed scroll operation' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )
  );
}
