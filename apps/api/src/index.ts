import { createDockerProvider, RuntimeStatus } from '@cusedev/runtimes';
import { Elysia, t } from 'elysia';

const dockerProvider = await createDockerProvider(
  [
    {
      id: 'linux',
      name: 'cuse-linux',
      description: 'Ubuntu 24.04 LTS',
      version: 'latest',
      image: 'ghcr.io/cuse-dev/cuse/linux:latest',
      defaultResources: {
        memoryMb: 4096,
        cpuCount: 4,
      },
    },
  ],
  'linux',
  process.env.NODE_ENV === 'development' ? undefined : '/var/run/docker.sock'
);

const app = new Elysia()
  .all('/computers/:computerId/*', async ({ body, params, path, request }) => {
    console.log('computer request', params.computerId, path, body);

    const runtime = await dockerProvider.getInstance(params.computerId);

    if (!runtime) {
      throw new Error(`Computer ${params.computerId} not found`);
    }

    if (
      runtime.status !== RuntimeStatus.RUNNING &&
      runtime.status !== RuntimeStatus.CREATING
    ) {
      await runtime.start();
    }

    const info = await runtime.container?.inspect();
    if (!info?.NetworkSettings?.Networks?.cuse_default?.IPAddress) {
      throw new Error(
        `Computer ${params.computerId} network configuration not found`
      );
    }

    const requestPath = path.replace(`/${params.computerId}`, '');
    const url = `http://${info.NetworkSettings.Networks.cuse_default.IPAddress}:8000${requestPath}`;

    console.log('url', url);

    return fetch(url, request);
  })
  .post(
    '/computers',
    async ({ body, request }) => {
      const runtime = await dockerProvider.createInstance({
        platformId: body.platformId,
        config: body.config,
      });

      await runtime?.start();

      const url = `${request.url}/${runtime?.id}`;

      return url;
    },
    {
      body: t.Object({
        platformId: t.String(),
        config: t.Optional(t.Object({})),
      }),
    }
  )
  .get('/', () => 'Hello Elysia')
  .listen(3042);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
