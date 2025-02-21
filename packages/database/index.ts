import { PrismaClient } from '@prisma/client';
import 'server-only';

export const database = new PrismaClient();

export * from '@prisma/client';
