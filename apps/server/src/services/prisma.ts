import { prisma } from '@home-assets/db';
import { logger } from '../utils/logger';

export * from '@home-assets/db';
export { prisma };

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Connected successfully to PostgreSQL database', undefined, 'PostgreSQL');
    return true;
  } catch (err: unknown) {
    const error = err as Error;
    logger.error('Failed to connect to PostgreSQL database', error, undefined, 'PostgreSQL');
    return false;
  }
}
