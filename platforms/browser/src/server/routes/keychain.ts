import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const KeychainItem = t.Object({
  username: t.Optional(t.String()),
  password: t.Optional(t.String()),
  token: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  otp: t.Optional(t.String()),
});

const SetItemParams = t.Object({
  service: t.String(),
  item: KeychainItem,
});

const DeleteItemParams = t.Object({
  service: t.String(),
});

const AuthElement = t.Object({
  type: t.String(),
  coordinates: t.Record(t.String(), t.Number()),
});

const AuthenticateParams = t.Object({
  service: t.String(),
  authElements: t.Array(AuthElement),
});

export function keychainRoutes(browserController: BrowserController) {
  return new Elysia().group('/keychain', (app) =>
    app
      .post(
        '/set-item',
        async ({ body }) => {
          return await browserController.keychain.setItem(body);
        },
        {
          body: SetItemParams,
          detail: {
            tags: ['keychain'],
            summary: 'Store Keychain Item',
            description: 'Stores a new keychain item for a service.',
            responses: {
              '204': { description: 'Successfully stored keychain item' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/delete-item',
        async ({ body }) => {
          return await browserController.keychain.deleteItem(body);
        },
        {
          body: DeleteItemParams,
          detail: {
            tags: ['keychain'],
            summary: 'Delete Keychain Item',
            description: 'Deletes a keychain item for a service.',
            responses: {
              '204': { description: 'Successfully deleted keychain item' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/list-services',
        async () => {
          return await browserController.keychain.listServices();
        },
        {
          detail: {
            tags: ['keychain'],
            summary: 'List Services',
            description: 'Lists all services with stored keychain items.',
            responses: {
              '200': {
                description: 'Successfully retrieved service list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { type: 'string' },
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
        '/authenticate',
        async ({ body }) => {
          return await browserController.keychain.authenticate(body);
        },
        {
          body: AuthenticateParams,
          detail: {
            tags: ['keychain'],
            summary: 'Authenticate Service',
            description:
              'Verifies authentication elements against stored keychain item.',
            responses: {
              '200': {
                description: 'Successfully performed authentication',
                content: {
                  'application/json': {
                    schema: {
                      type: 'boolean',
                    },
                  },
                },
              },
              '400': { description: 'Invalid authentication elements' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )
  );
}
