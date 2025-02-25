import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const KeyPressRequest = t.Object({
  key: t.String(),
  display_num: t.Optional(t.Number()),
});

const TypeTextRequest = t.Object({
  text: t.String(),
  typing_delay: t.Optional(t.Number()),
  typing_group_size: t.Optional(t.Number()),
  display_num: t.Optional(t.Number()),
});

const HotkeyRequest = t.Object({
  keys: t.Array(t.String()),
  display_num: t.Optional(t.Number()),
});

export function keyboardRoutes(browserController: BrowserController) {
  return new Elysia().group('/keyboard', (app) =>
    app
      .post(
        '/key',
        async ({ body }) => {
          return await browserController.keyboard.pressKey(body);
        },
        {
          body: KeyPressRequest,
          detail: {
            tags: ['keyboard'],
            summary: 'Press Key',
            description: 'Presses a single keyboard key.',
            responses: {
              '200': { description: 'Successfully pressed the key' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/type',
        async ({ body }) => {
          return await browserController.keyboard.typeText(body);
        },
        {
          body: TypeTextRequest,
          detail: {
            tags: ['keyboard'],
            summary: 'Type Text',
            description:
              'Types a sequence of text with configurable speed and grouping.',
            responses: {
              '200': { description: 'Successfully typed the text' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/hotkey',
        async ({ body }) => {
          return await browserController.keyboard.pressHotkey(body);
        },
        {
          body: HotkeyRequest,
          detail: {
            tags: ['keyboard'],
            summary: 'Press Hotkey Combination',
            description:
              'Presses multiple keys simultaneously to perform a hotkey combination.',
            responses: {
              '200': {
                description: 'Successfully pressed the hotkey combination',
              },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/hold',
        async ({ body }) => {
          return await browserController.keyboard.holdKey(body);
        },
        {
          body: KeyPressRequest,
          detail: {
            tags: ['keyboard'],
            summary: 'Hold Key',
            description: 'Holds down a keyboard key without releasing it.',
            responses: {
              '200': { description: 'Successfully started holding the key' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/release',
        async ({ body }) => {
          return await browserController.keyboard.releaseKey(body);
        },
        {
          body: KeyPressRequest,
          detail: {
            tags: ['keyboard'],
            summary: 'Release Key',
            description: 'Releases a previously held keyboard key.',
            responses: {
              '200': { description: 'Successfully released the key' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )
  );
}
