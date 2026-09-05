import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma, ReminderType, ReminderStatus } from '../services/prisma';
import { getActiveUser } from '../services/user-store';

export const analyticsRouter = Router();

analyticsRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    const whereHousehold = householdId ? { householdId } : {};

    const [assets, records, reminders] = await Promise.all([
      prisma.asset.findMany({ where: whereHousehold, include: { warranty: true, category: true } }),
      prisma.maintenanceRecord.findMany({
        where: householdId ? { asset: { householdId } } : {},
        include: { asset: true },
        orderBy: { serviceDate: 'desc' },
        take: 5,
      }),
      prisma.reminder.findMany({
        where: {
          ...whereHousehold,
          status: { not: ReminderStatus.COMPLETED },
          type: ReminderType.WARRANTY_EXPIRY,
        },
      }),
    ]);

    const totalAssets = assets.length;
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
    const totalValuation = assets.reduce(
      (sum, a) => sum + (Number(a.currentValue) || Number(a.purchasePrice) || 0),
      0
    );
    const totalMaintenanceSpend = records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

    // Category distribution
    const categoryMap: Record<string, { count: number; value: number }> = {};
    assets.forEach((a) => {
      const cat = a.category?.name || a.categoryId || 'Appliances';
      const val = Number(a.purchasePrice) || 0;
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, value: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].value += val;
    });

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percentage: totalPurchaseValue > 0 ? Math.round((data.value / totalPurchaseValue) * 100) : 0,
    }));

    const activeWarranties = reminders.length;
    const coveredPercentage = totalAssets > 0 ? Math.round((activeWarranties / totalAssets) * 100) : 100;

    const recentServices = records.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      assetName: r.asset?.name || '',
      title: r.title,
      cost: Number(r.cost) || 0,
      serviceDate: r.serviceDate.toISOString().split('T')[0],
      serviceProvider: r.serviceProvider || '',
    }));

    logger.debug('Analytics calculated from PostgreSQL', {
      totalValuation,
      totalMaintenanceSpend,
      categoriesCount: categories.length,
    }, 'PostgreSQL Analytics');

    return res.json({
      success: true,
      data: {
        totalValuation,
        totalPurchaseValue,
        totalMaintenanceSpend,
        totalAssets,
        activeWarranties,
        coveredPercentage,
        categories,
        recentServices,
      },
    });
  } catch (err: any) {
    logger.error('Failed to get analytics', err, undefined, 'PostgreSQL Analytics');
    return res.status(500).json({ success: false, error: err.message });
  }
});
