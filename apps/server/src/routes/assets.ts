import { Router } from 'express';
import { CreateAssetSchema, AssetFilterSchema } from '@home-assets/validation';
import { logger } from '../utils/logger';
import { getActiveUser } from '../services/user-store';
import { prisma, ReminderType, ReminderStatus, DocumentType } from '../services/prisma';

export const assetsRouter = Router();

// Helper to format Prisma Asset with Warranty and Documents into client-friendly DTO
export function formatAssetResponse(asset: any) {
  let warrantyObj: any = undefined;
  if (asset.warranty) {
    const end = new Date(asset.warranty.endDate);
    const now = new Date();
    const isExpired = end < now;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = isExpired ? 'expired' : daysLeft <= 30 ? 'expiring_soon' : 'active';

    warrantyObj = {
      id: asset.warranty.id,
      provider: asset.warranty.provider,
      warrantyNumber: asset.warranty.warrantyNumber || undefined,
      startDate: asset.warranty.startDate.toISOString().split('T')[0],
      endDate: asset.warranty.endDate.toISOString().split('T')[0],
      durationMonths: asset.warranty.durationMonths || 12,
      status,
      daysLeft: Math.max(0, daysLeft),
    };
  }

  return {
    id: asset.id,
    name: asset.name,
    categoryId: asset.categoryId,
    brand: asset.brand || undefined,
    model: asset.model || undefined,
    serialNumber: asset.serialNumber || undefined,
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : undefined,
    purchasePrice: asset.purchasePrice !== null ? Number(asset.purchasePrice) : undefined,
    currentValue: asset.currentValue !== null ? Number(asset.currentValue) : undefined,
    seller: asset.seller || undefined,
    location: asset.location || undefined,
    owner: asset.owner || undefined,
    notes: asset.notes || undefined,
    imageUrl: asset.imageUrl || undefined,
    warranty: warrantyObj,
    documents: asset.documents ? asset.documents.map((d: any) => ({
      id: d.id,
      assetId: d.assetId,
      name: d.name,
      type: d.type.toLowerCase(),
      fileUrl: d.fileUrl && !d.fileUrl.includes('example.com') && !d.fileUrl.includes('placehold.co') ? d.fileUrl : `/api/documents/${d.id}/file`,
      fileSizeBytes: d.fileSizeBytes,
      mimeType: d.mimeType,
      uploadedAt: d.createdAt.toISOString().split('T')[0],
    })) : [],
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

// POST /api/assets/reset
assetsRouter.post('/reset', async (req, res) => {
  const authHeader = req.headers.authorization;
  const userSession = await getActiveUser(authHeader);
  
  if (userSession?.household.id) {
    await prisma.asset.deleteMany({
      where: { householdId: userSession.household.id },
    });
  } else {
    await prisma.asset.deleteMany({});
  }

  return res.json({ success: true, message: 'Assets reset in PostgreSQL' });
});

// GET /api/assets/dashboard/summary
assetsRouter.get('/dashboard/summary', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    const whereHousehold = householdId ? { householdId } : {};

    const assets = await prisma.asset.findMany({
      where: whereHousehold,
      include: {
        warranty: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAssets = assets.length;
    const totalPurchaseValue = assets.reduce((acc, a) => acc + (Number(a.purchasePrice) || 0), 0);

    const pendingReminders = await prisma.reminder.findMany({
      where: {
        ...(householdId ? { householdId } : {}),
        status: ReminderStatus.PENDING,
      },
    });

    const warrantiesExpiring = pendingReminders.filter(
      (r) => r.type === ReminderType.WARRANTY_EXPIRY
    ).length;

    const maintenanceDue = pendingReminders.filter(
      (r) => r.type === ReminderType.MAINTENANCE_DUE
    ).length;

    const documentsMissing = assets.filter((a) => a.documents.length === 0).length;

    const firstName = userSession?.user.fullName ? userSession.user.fullName.trim().split(/\s+/)[0] : 'Homeowner';

    logger.debug('Dashboard summary queried from PostgreSQL', {
      user: firstName,
      totalAssets,
      totalPurchaseValue,
      warrantiesExpiring,
    }, 'PostgreSQL Assets');

    return res.json({
      success: true,
      data: {
        user: userSession
          ? {
              id: userSession.user.id,
              name: firstName,
              fullName: userSession.user.fullName,
              email: userSession.user.email,
              householdName: userSession.household.name,
            }
          : {
              id: undefined,
              name: 'Homeowner',
              fullName: 'Homeowner',
              email: '',
              householdName: 'My Household',
            },
        totalAssets,
        totalPurchaseValue,
        growthPercent: totalAssets > 0 ? '+0.0%' : '0%',
        atAGlance: {
          warrantiesExpiring,
          maintenanceDue,
          documentsMissing,
        },
        recentAssets: assets.slice(0, 5).map(formatAssetResponse),
      },
    });
  } catch (err: any) {
    logger.error('Failed to get dashboard summary', err, undefined, 'PostgreSQL Assets');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/assets (List Assets with filtering & search)
assetsRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    const filter = AssetFilterSchema.parse(req.query);

    const whereClause: any = {
      ...(householdId ? { householdId } : {}),
    };

    if (filter.category) {
      whereClause.categoryId = filter.category;
    }

    if (filter.search) {
      const q = filter.search;
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { seller: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filter.sortBy === 'price_desc') {
      orderBy = { purchasePrice: 'desc' };
    } else if (filter.sortBy === 'price_asc') {
      orderBy = { purchasePrice: 'asc' };
    } else if (filter.sortBy === 'purchase_date') {
      orderBy = { purchaseDate: 'desc' };
    } else if (filter.sortBy === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        warranty: true,
        documents: true,
      },
      orderBy,
    });

    return res.json({
      success: true,
      data: assets.map(formatAssetResponse),
      total: assets.length,
    });
  } catch (err: any) {
    logger.warn('Asset listing error', { error: err.message }, 'PostgreSQL Assets');
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/assets/:id
assetsRouter.get('/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        warranty: true,
        documents: true,
        records: true,
        schedules: true,
      },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    return res.json({
      success: true,
      data: formatAssetResponse(asset),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assets (Create new asset)
assetsRouter.post('/', async (req, res) => {
  try {
    const validated = CreateAssetSchema.parse(req.body);
    const userSession = await getActiveUser(req.headers.authorization);

    // Get or create household for asset
    let householdId = userSession?.household.id;
    if (!householdId) {
      const defaultHh = await prisma.household.findFirst();
      householdId = defaultHh?.id;
      if (!householdId) {
        const createdHh = await prisma.household.create({
          data: { name: 'My Household' },
        });
        householdId = createdHh.id;
      }
    }

    // Ensure category exists
    const categoryExists = await prisma.assetCategory.findUnique({
      where: { id: validated.categoryId },
    });
    if (!categoryExists) {
      await prisma.assetCategory.create({
        data: {
          id: validated.categoryId,
          name: validated.categoryId.charAt(0).toUpperCase() + validated.categoryId.slice(1),
        },
      });
    }

    const warrantyData = typeof validated.warranty === 'object' && validated.warranty !== null ? validated.warranty : undefined;
    const invoiceData = typeof validated.invoice === 'object' && validated.invoice !== null ? validated.invoice : undefined;

    // Create Asset with Warranty and Invoice inside transaction
    const newAsset = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          householdId,
          name: validated.name,
          categoryId: validated.categoryId,
          brand: validated.brand || null,
          model: validated.model || null,
          serialNumber: validated.serialNumber || null,
          purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
          purchasePrice: validated.purchasePrice ? Number(validated.purchasePrice) : null,
          currentValue: validated.currentValue ? Number(validated.currentValue) : null,
          seller: validated.seller || null,
          location: validated.location || null,
          owner: validated.owner || userSession?.user.fullName || 'Me',
          notes: validated.notes || null,
          imageUrl: validated.imageUrl || null,
        },
      });

      if (warrantyData) {
        const startDate = warrantyData.startDate
          ? new Date(warrantyData.startDate)
          : validated.purchaseDate
          ? new Date(validated.purchaseDate)
          : new Date();

        let endDate = warrantyData.endDate ? new Date(warrantyData.endDate) : null;
        if (!endDate) {
          const durationMonths = warrantyData.durationMonths || 12;
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + durationMonths);
        }

        await tx.warranty.create({
          data: {
            assetId: asset.id,
            provider: warrantyData.provider || validated.brand || 'Manufacturer',
            warrantyNumber: warrantyData.warrantyNumber || null,
            startDate,
            endDate,
          },
        });

        // Create warranty reminder
        await tx.reminder.create({
          data: {
            householdId,
            assetId: asset.id,
            title: `Warranty expiring for ${asset.name}`,
            dueDate: endDate,
            type: ReminderType.WARRANTY_EXPIRY,
            status: ReminderStatus.PENDING,
          },
        });
      }

      if (invoiceData) {
        let calculatedSize = invoiceData.fileSizeBytes || 0;
        if (!calculatedSize && invoiceData.fileData) {
          const pureBase64 = invoiceData.fileData.includes(',') ? invoiceData.fileData.split(',')[1] : invoiceData.fileData;
          calculatedSize = Math.round((pureBase64.length * 3) / 4);
        }
        if (!calculatedSize) calculatedSize = 102400;

        const createdDoc = await tx.document.create({
          data: {
            assetId: asset.id,
            type: DocumentType.INVOICE,
            name: invoiceData.name || `${asset.name} Purchase Invoice`,
            fileUrl: invoiceData.fileUrl || `/api/documents/temp/file`,
            fileData: invoiceData.fileData || null,
            mimeType: invoiceData.mimeType || 'application/pdf',
            fileSizeBytes: calculatedSize,
            uploadedById: userSession?.user.id || null,
          },
        });

        if (!invoiceData.fileUrl) {
          await tx.document.update({
            where: { id: createdDoc.id },
            data: { fileUrl: `/api/documents/${createdDoc.id}/file` },
          });
        }
      }

      return asset;
    });

    const fullAsset = await prisma.asset.findUnique({
      where: { id: newAsset.id },
      include: { warranty: true, documents: true },
    });

    logger.info(`Asset created in PostgreSQL: "${fullAsset?.name}" (₹${fullAsset?.purchasePrice || 0})`, {
      assetId: newAsset.id,
      householdId,
    }, 'PostgreSQL Assets');

    return res.status(201).json({
      success: true,
      data: formatAssetResponse(fullAsset),
      message: 'Asset created successfully in PostgreSQL.',
    });
  } catch (err: any) {
    logger.warn('Asset creation error', { error: err.message }, 'PostgreSQL Assets');
    return res.status(400).json({ success: false, error: err.errors || err.message });
  }
});

// PUT /api/assets/:id
assetsRouter.put('/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const body = req.body;

    const existing = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { warranty: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
          brand: body.brand !== undefined ? body.brand : undefined,
          model: body.model !== undefined ? body.model : undefined,
          serialNumber: body.serialNumber !== undefined ? body.serialNumber : undefined,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
          purchasePrice: body.purchasePrice !== undefined ? Number(body.purchasePrice) : undefined,
          currentValue: body.currentValue !== undefined ? Number(body.currentValue) : undefined,
          seller: body.seller !== undefined ? body.seller : undefined,
          location: body.location !== undefined ? body.location : undefined,
          owner: body.owner !== undefined ? body.owner : undefined,
          notes: body.notes !== undefined ? body.notes : undefined,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        },
      });

      if (body.warranty && typeof body.warranty === 'object') {
        const startDate = body.warranty.startDate
          ? new Date(body.warranty.startDate)
          : existing.purchaseDate || new Date();
        const endDate = body.warranty.endDate
          ? new Date(body.warranty.endDate)
          : new Date(startDate.getTime() + (body.warranty.durationMonths || 12) * 30 * 24 * 60 * 60 * 1000);

        await tx.warranty.upsert({
          where: { assetId },
          update: {
            provider: body.warranty.provider || undefined,
            warrantyNumber: body.warranty.warrantyNumber || undefined,
            startDate,
            endDate,
          },
          create: {
            assetId,
            provider: body.warranty.provider || body.brand || 'Manufacturer',
            warrantyNumber: body.warranty.warrantyNumber || null,
            startDate,
            endDate,
          },
        });
      }
    });

    const updated = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { warranty: true, documents: true },
    });

    return res.json({
      success: true,
      data: formatAssetResponse(updated),
      message: 'Asset updated successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/assets/:id
assetsRouter.delete('/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    await prisma.asset.delete({
      where: { id: assetId },
    });

    logger.info(`Asset deleted from PostgreSQL: ${assetId}`, { assetId }, 'PostgreSQL Assets');
    return res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
