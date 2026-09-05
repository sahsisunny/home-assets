import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma, MaintenanceType, ReminderType, ReminderStatus } from '../services/prisma';
import { getActiveUser } from '../services/user-store';

export const servicesRouter = Router();

function mapMaintenanceType(type?: string): MaintenanceType {
  const t = (type || '').toUpperCase();
  if (t === 'CLEANING') return MaintenanceType.CLEANING;
  if (t === 'FILTER_REPLACEMENT') return MaintenanceType.FILTER_REPLACEMENT;
  if (t === 'INSPECTION') return MaintenanceType.INSPECTION;
  if (t === 'REPAIR') return MaintenanceType.REPAIR;
  if (t === 'PART_REPLACEMENT') return MaintenanceType.PART_REPLACEMENT;
  if (t === 'SCHEDULED_SERVICE') return MaintenanceType.SCHEDULED_SERVICE;
  return MaintenanceType.SCHEDULED_SERVICE;
}

function formatServiceResponse(s: any) {
  return {
    id: s.id,
    assetId: s.assetId,
    assetName: s.asset?.name || '',
    title: s.title,
    type: s.type.toLowerCase(),
    cost: s.cost !== null ? Number(s.cost) : 0,
    serviceDate: s.serviceDate ? s.serviceDate.toISOString().split('T')[0] : '',
    serviceProvider: s.serviceProvider || '',
    technicianNotes: s.description || '',
    nextDueDate: s.nextServiceDate ? s.nextServiceDate.toISOString().split('T')[0] : '',
    documentId: s.documentId || undefined,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET /api/services (List service records)
servicesRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;
    const { assetId } = req.query;

    const whereClause: any = {};
    if (assetId) {
      whereClause.assetId = String(assetId);
    } else if (householdId) {
      whereClause.asset = { householdId };
    }

    const records = await prisma.maintenanceRecord.findMany({
      where: whereClause,
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
      orderBy: { serviceDate: 'desc' },
    });

    const totalSpend = records.reduce((sum, s) => sum + (s.cost !== null ? Number(s.cost) : 0), 0);
    logger.debug(`Listed ${records.length} service records from PostgreSQL`, { assetId, count: records.length, totalSpend }, 'PostgreSQL Services');

    return res.json({
      success: true,
      data: records.map(formatServiceResponse),
      total: records.length,
      totalSpend,
    });
  } catch (err: any) {
    logger.error('Failed to list service records', err, undefined, 'PostgreSQL Services');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services (Create new service record)
servicesRouter.post('/', async (req, res) => {
  try {
    const {
      assetId,
      title,
      type = 'scheduled_service',
      cost = 0,
      serviceDate = new Date().toISOString().split('T')[0],
      serviceProvider = '',
      technicianNotes = '',
      nextDueDate = '',
      documentId,
    } = req.body;

    const userSession = await getActiveUser(req.headers.authorization);

    if (!title) {
      return res.status(400).json({ success: false, error: 'Service title is required' });
    }

    if (!assetId) {
      return res.status(400).json({ success: false, error: 'Asset ID is required' });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          assetId,
          type: mapMaintenanceType(type),
          title,
          description: technicianNotes || null,
          cost: Number(cost) || 0,
          serviceProvider: serviceProvider || null,
          serviceDate: new Date(serviceDate),
          nextServiceDate: nextDueDate ? new Date(nextDueDate) : null,
          documentId: documentId || null,
          createdById: userSession?.user.id || null,
        },
        include: {
          asset: {
            select: { id: true, name: true },
          },
        },
      });

      // If nextDueDate is provided, auto-create a reminder in PostgreSQL
      if (nextDueDate) {
        await tx.reminder.create({
          data: {
            householdId: asset.householdId,
            assetId: asset.id,
            title: `${asset.name} Service Due`,
            dueDate: new Date(nextDueDate),
            type: ReminderType.MAINTENANCE_DUE,
            status: ReminderStatus.PENDING,
          },
        });
      }

      return record;
    });

    logger.info(`Service record created in PostgreSQL: "${result.title}" (₹${result.cost || 0}) for ${asset.name}`, {
      id: result.id,
      assetName: asset.name,
    }, 'PostgreSQL Services');

    return res.status(201).json({ success: true, data: formatServiceResponse(result) });
  } catch (error: any) {
    logger.error('Failed to create service record in PostgreSQL', error, undefined, 'PostgreSQL Services');
    return res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/services/:id (Get service record by ID)
servicesRouter.get('/:id', async (req, res) => {
  try {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id: req.params.id },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Service record not found' });
    }

    return res.json({ success: true, data: formatServiceResponse(record) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/services/:id (Update service record)
servicesRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        type: body.type !== undefined ? mapMaintenanceType(body.type) : undefined,
        cost: body.cost !== undefined ? Number(body.cost) : undefined,
        serviceProvider: body.serviceProvider !== undefined ? body.serviceProvider : undefined,
        description: body.technicianNotes !== undefined ? body.technicianNotes : undefined,
        serviceDate: body.serviceDate ? new Date(body.serviceDate) : undefined,
        nextServiceDate: body.nextDueDate ? new Date(body.nextDueDate) : undefined,
      },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    return res.json({ success: true, data: formatServiceResponse(updated) });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/services/:id (Delete service record)
servicesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.maintenanceRecord.delete({
      where: { id },
    });

    logger.info(`Service record deleted from PostgreSQL: ${id}`, { id }, 'PostgreSQL Services');
    return res.json({ success: true, message: 'Service record deleted' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
