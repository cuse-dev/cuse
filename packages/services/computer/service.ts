import {
  type DockerRuntimeProvider,
  createDockerProvider,
} from '@cusedev/runtimes';
import { $Enums, Prisma, database } from '@repo/database';
import { logger } from '@repo/logger';
import 'server-only';
import { z } from 'zod';
import { ComputerError } from './errors';
import { type ComputerInput, computerSchema } from './schema';

const DEFAULT_LINUX_IMAGE = 'ghcr.io/cuse-dev/cuse/linux:latest';
const DEFAULT_BROWSER_IMAGE = 'ghcr.io/cuse-dev/cuse/browser:latest';
const DEFAULT_DOCKER_PROVIDER = createDockerProvider(
  [
    {
      id: $Enums.ComputerPlatform.LINUX,
      name: 'Ubuntu',
      version: 'latest',
      image: process.env.LINUX_IMAGE ?? DEFAULT_LINUX_IMAGE,
      description: 'Ubuntu',
      defaultResources: { memoryMb: 1024, cpuCount: 1 },
    },
    {
      id: $Enums.ComputerPlatform.BROWSER,
      name: 'Browser',
      version: 'latest',
      image: 'cuse-local-browser:latest',
      description: 'Browser',
      defaultResources: { memoryMb: 1024, cpuCount: 1 },
    },
  ],
  $Enums.ComputerPlatform.LINUX
);

export function createComputerService(
  prismaComputer = database.computerInstance,
  runtimeProvider?: DockerRuntimeProvider
) {
  // Initialize the runtime provider if not provided
  const provider = runtimeProvider ?? DEFAULT_DOCKER_PROVIDER;

  return {
    ...prismaComputer,
    async list() {
      try {
        return await prismaComputer.findMany();
      } catch (error) {
        logger.error('Error listing computer:', { error });
        throw ComputerError.internal(error);
      }
    },

    async create(data: ComputerInput) {
      try {
        const validatedData = computerSchema.parse(data);
        return await prismaComputer.create({
          data: validatedData,
        });
      } catch (error) {
        logger.error('Error creating computer:', { error });
        if (error instanceof z.ZodError) {
          throw ComputerError.validation(error.errors);
        }
        throw ComputerError.internal(error);
      }
    },

    async start(id: string) {
      try {
        const computer = await prismaComputer.findFirstOrThrow({
          where: { id },
        });

        if (computer.sandboxId) {
          const runtime = await provider.getInstance(computer.sandboxId);
          if (runtime) {
            if (runtime.status === 'running') {
              return;
            }
            await runtime.start();
            const url = await runtime.getUrl();
            return await prismaComputer.update({
              where: { id },
              data: {
                url,
              },
            });
          }
        }

        // Create a new runtime instance
        const runtime = await provider.createInstance({
          platformId: computer.platform,
          config: {
            id: computer.id,
            name: computer.name,
            metadata: {
              computerId: computer.id,
            },
          },
        });

        // Start the runtime
        await runtime.start();

        // Update the computer with the runtime ID and URL
        const url = await runtime.getUrl();
        return await prismaComputer.update({
          where: { id },
          data: {
            sandboxId: runtime.id,
            url,
          },
        });
      } catch (error) {
        logger.error('Error starting computer:', { error });
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw ComputerError.notFound();
        }
        throw ComputerError.internal(error);
      }
    },

    async stop(id: string) {
      try {
        const computer = await prismaComputer.findFirstOrThrow({
          where: { id },
        });

        if (computer.sandboxId) {
          const runtime = await provider.getInstance(computer.sandboxId);
          if (runtime) {
            await runtime.stop();
            await runtime.terminate();
          }
        }

        return await prismaComputer.update({
          where: { id },
          data: {
            sandboxId: null,
          },
        });
      } catch (error) {
        logger.error('Error stopping computer:', { error });
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw ComputerError.notFound();
        }
        throw ComputerError.internal(error);
      }
    },

    async listActions(computerId: string) {
      try {
        await prismaComputer.findFirstOrThrow({ where: { id: computerId } });
        return await database.action.findMany({
          where: { computerId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        logger.error('Error listing computer actions:', { error });
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw ComputerError.notFound();
        }
        throw ComputerError.internal(error);
      }
    },

    async getByName(name: string) {
      try {
        return await prismaComputer.findUniqueOrThrow({
          where: { name },
        });
      } catch (error) {
        logger.error('Error getting computer by name:', { error });
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw ComputerError.notFound();
        }
        throw ComputerError.internal(error);
      }
    },
  };
}

// Create a default instance using the database client
export const computerService = createComputerService();
