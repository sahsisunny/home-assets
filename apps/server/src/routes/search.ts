import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../services/prisma';
import { getActiveUser } from '../services/user-store';
import { formatAssetResponse } from './assets';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    if (!query) {
      return res.json({
        success: true,
        data: {
          assets: [],
          documents: [],
          services: [],
          reminders: [],
          total: 0,
        },
      });
    }

    const whereHousehold = householdId ? { householdId } : {};

    const [matchingAssets, matchingDocuments, matchingServices, matchingReminders] = await Promise.all([
      prisma.asset.findMany({
        where: {
          ...whereHousehold,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { model: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { categoryId: { contains: query, mode: 'insensitive' } },
            { serialNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { warranty: true, documents: true },
      }),
      prisma.document.findMany({
        where: {
          ...(householdId ? { asset: { householdId } } : {}),
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { asset: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: {
          ...(householdId ? { asset: { householdId } } : {}),
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { serviceProvider: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { asset: true },
      }),
      prisma.reminder.findMany({
        where: {
          ...whereHousehold,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { asset: true },
      }),
    ]);

    const total =
      matchingAssets.length +
      matchingDocuments.length +
      matchingServices.length +
      matchingReminders.length;

    logger.info(`Universal search query "${query}" matched ${total} items in PostgreSQL`, {
      query,
      assetsCount: matchingAssets.length,
      documentsCount: matchingDocuments.length,
      servicesCount: matchingServices.length,
      remindersCount: matchingReminders.length,
      total,
    }, 'PostgreSQL Search');

    return res.json({
      success: true,
      data: {
        assets: matchingAssets.map(formatAssetResponse),
        documents: matchingDocuments.map((d) => ({
          id: d.id,
          assetId: d.assetId,
          assetName: d.asset.name,
          name: d.name,
          type: d.type.toLowerCase(),
          fileUrl: d.fileUrl,
        })),
        services: matchingServices.map((s) => ({
          id: s.id,
          assetId: s.assetId,
          assetName: s.asset.name,
          title: s.title,
          cost: Number(s.cost) || 0,
        })),
        reminders: matchingReminders.map((r) => ({
          id: r.id,
          assetId: r.assetId,
          assetName: r.asset?.name,
          title: r.title,
          dueDate: r.dueDate.toISOString().split('T')[0],
          status: r.status.toLowerCase(),
        })),
        total,
      },
    });
  } catch (err: any) {
    logger.error('Universal search failed', err, undefined, 'PostgreSQL Search');
    return res.status(500).json({ success: false, error: err.message });
  }
});
