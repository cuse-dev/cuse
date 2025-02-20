import { Elysia, t } from 'elysia';
import type { BrowserController } from '../../controllers/browser';

const CommandParams = t.Object({
  command: t.String(),
  background: t.Optional(t.Boolean()),
});

export function bashRoutes(browserController: BrowserController) {
  return new Elysia().group('/bash', (app) =>
    app
      .post(
        '/command',
        async ({ body }) => {
          return await browserController.bash.executeCommand(body);
        },
        {
          body: CommandParams,
          detail: {
            tags: ['bash'],
            summary: 'Execute Command',
            description:
              'Executes a JavaScript command in the browser context.',
            responses: {
              '200': {
                description: 'Successfully executed command',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        pid: { type: 'number' },
                        output: { type: 'string' },
                        exitCode: { type: 'number' },
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
        '/process/:pid/output',
        async ({ params }) => {
          return await browserController.bash.getProcessOutput(params.pid);
        },
        {
          params: t.Object({
            pid: t.Number(),
          }),
          detail: {
            tags: ['bash'],
            summary: 'Get Process Output',
            description:
              'Retrieves the output of a specified background process.',
            responses: {
              '200': {
                description: 'Successfully retrieved process output',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        output: { type: 'string' },
                        isRunning: { type: 'boolean' },
                        exitCode: { type: 'number' },
                      },
                    },
                  },
                },
              },
              '404': { description: 'Process not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .delete(
        '/process/:pid',
        async ({ params }) => {
          return await browserController.bash.terminateProcess(params.pid);
        },
        {
          params: t.Object({
            pid: t.Number(),
          }),
          detail: {
            tags: ['bash'],
            summary: 'Terminate Process',
            description: 'Terminates a specified background process.',
            responses: {
              '200': { description: 'Successfully terminated process' },
              '404': { description: 'Process not found' },
              '500': { description: 'Internal server error' },
            },
          },
        }
      )

      .get(
        '/processes/managed',
        async () => {
          return await browserController.bash.listManagedProcesses();
        },
        {
          detail: {
            tags: ['bash'],
            summary: 'List Managed Processes',
            description:
              'Returns a list of all background processes managed by the system.',
            responses: {
              '200': {
                description: 'Successfully retrieved process list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          pid: { type: 'number' },
                          isRunning: { type: 'boolean' },
                          command: { type: 'string' },
                        },
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
