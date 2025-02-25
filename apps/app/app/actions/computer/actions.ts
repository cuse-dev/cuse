'use server';
import { logger } from '@repo/logger';
import {
  computerIdSchema,
  type computerSchema,
  computerService,
  deleteComputerSchema,
  updateComputerSchema,
} from '@repo/services';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { action } from '../safe-action';
// Empty schema for list action
const listSchema = z.void();

export const listComputers = action.schema(listSchema).action(async () => {
  const computers = await computerService.list();
  return computers;
});

export const createComputer = async (data: z.infer<typeof computerSchema>) => {
  logger.info('Creating computer', data);
  const computer = await computerService.create(data);
  revalidatePath('/computers');
  return computer;
};

export const updateComputer = action
  .schema(updateComputerSchema)
  .action(async ({ clientInput }) => {
    const computer = await computerService.update({
      where: { id: clientInput.id },
      data: clientInput.data,
    });
    revalidatePath('/computers');
    return computer;
  });

export const deleteComputer = action
  .schema(deleteComputerSchema)
  .action(async ({ clientInput }) => {
    await computerService.delete({
      where: { id: clientInput.id },
    });
    revalidatePath('/computers');
  });

export const startComputer = action
  .schema(computerIdSchema)
  .action(async ({ clientInput }) => {
    const computer = await computerService.start(clientInput.id);
    revalidatePath('/computers');
    return computer;
  });

export const stopComputer = action
  .schema(computerIdSchema)
  .action(async ({ clientInput }) => {
    const computer = await computerService.stop(clientInput.id);
    revalidatePath('/computers');
    return computer;
  });

export const listActions = action
  .schema(computerIdSchema)
  .action(async ({ clientInput }) => {
    const actions = await computerService.listActions(clientInput.id);
    return actions;
  });
