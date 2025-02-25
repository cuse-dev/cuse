import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const ListDirectoryParams = t.Object({
  path: t.String(),
  include_hidden: t.Optional(t.Boolean()),
  pattern: t.Optional(t.String()),
});

const TreeParams = t.Object({
  path: t.String(),
  max_depth: t.Optional(t.Number()),
  include_hidden: t.Optional(t.Boolean()),
  pattern: t.Optional(t.String()),
});

const SearchParams = t.Object({
  root_path: t.String(),
  pattern: t.String(),
  max_results: t.Optional(t.Number()),
  include_hidden: t.Optional(t.Boolean()),
});

export function filesystemRoutes(browserController: BrowserController) {
  return new Elysia().group('/filesystem', (app) =>
    app
      .post(
        '/list',
        async ({ body }) => {
          return await browserController.filesystem.listDirectory(body);
        },
        {
          body: ListDirectoryParams,
          detail: {
            tags: ['filesystem'],
            summary: 'List Directory Contents',
            description:
              'Lists the contents of a directory with optional filtering.',
            responses: {
              '200': {
                description: 'Successfully listed directory contents',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          path: { type: 'string' },
                          type: { type: 'string' },
                          size: { type: 'number' },
                          modified_time: { type: 'string' },
                          is_hidden: { type: 'boolean' },
                          extension: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
              '404': { description: 'Directory not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/tree',
        async ({ body }) => {
          return await browserController.filesystem.getDirectoryTree(body);
        },
        {
          body: TreeParams,
          detail: {
            tags: ['filesystem'],
            summary: 'Get Directory Tree',
            description:
              'Generates a tree representation of a directory structure.',
            responses: {
              '200': {
                description: 'Successfully generated directory tree',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        children: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              type: { type: 'string' },
                              children: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' },
                                    type: { type: 'string' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '404': { description: 'Directory not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .post(
        '/search',
        async ({ body }) => {
          return await browserController.filesystem.searchFiles(body);
        },
        {
          body: SearchParams,
          detail: {
            tags: ['filesystem'],
            summary: 'Search Files',
            description:
              'Searches for files matching a pattern in a directory tree.',
            responses: {
              '200': {
                description: 'Successfully searched for files',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          path: { type: 'string' },
                          type: { type: 'string' },
                          size: { type: 'number' },
                          modified_time: { type: 'string' },
                          is_hidden: { type: 'boolean' },
                          extension: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
              '404': { description: 'Root directory not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/info/:path',
        async ({ params }) => {
          return await browserController.filesystem.getPathInfo(params.path);
        },
        {
          params: t.Object({
            path: t.String(),
          }),
          detail: {
            tags: ['filesystem'],
            summary: 'Get Path Info',
            description: 'Gets detailed information about a file or directory.',
            responses: {
              '200': {
                description: 'Successfully retrieved path information',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        path: { type: 'string' },
                        type: { type: 'string' },
                        size: { type: 'number' },
                        modified_time: { type: 'string' },
                        is_hidden: { type: 'boolean' },
                        extension: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
              '404': { description: 'Path not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )
  );
}
