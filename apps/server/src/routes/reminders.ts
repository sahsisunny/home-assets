import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma, ReminderType, ReminderStatus } from '../services/prisma';
import { getActiveUser } from '../services/user-store';

export const remindersRouter = Router();

function mapReminderType(type?: string): ReminderType {
  const t = (type || '').toUpperCase();
  if (t === 'WARRANTY' || t === 'WARRANTY_EXPIRY') return ReminderType.WARRANTY_EXPIRY;
  if (t === 'MAINTENANCE' || t === 'MAINTENANCE_DUE') return ReminderType.MAINTENANCE_DUE;
  if (t === 'DOCUMENT_MISSING') return ReminderType.DOCUMENT_MISSING;
  return ReminderType.CUSTOM;
}

function mapReminderStatus(status?: string): ReminderStatus {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return ReminderStatus.COMPLETED;
  if (s === 'SNOOZED') return ReminderStatus.SNOOZED;
  return ReminderStatus.PENDING;
}

function formatReminderResponse(r: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(r.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let daysLabel = '';
  let priority = 'normal';
  let categoryGroup: 'due_today' | 'this_month' | 'warranty' | 'upcoming' | 'completed' = 'upcoming';

  const isCompleted = r.status === ReminderStatus.COMPLETED;
  const isWarranty = r.type === ReminderType.WARRANTY_EXPIRY;

  if (isCompleted) {
    daysLabel = 'Completed';
    categoryGroup = 'completed';
  } else if (diffDays < 0) {
    daysLabel = `Overdue by ${Math.abs(diffDays)} days`;
    priority = 'urgent';
    categoryGroup = 'due_today';
  } else if (diffDays === 0) {
    daysLabel = 'Due today';
    priority = 'urgent';
    categoryGroup = 'due_today';
  } else if (diffDays <= 30) {
    daysLabel = diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`;
    if (diffDays <= 7) priority = 'urgent';
    categoryGroup = isWarranty ? 'warranty' : 'this_month';
  } else {
    daysLabel = `Due in ${diffDays} days`;
    categoryGroup = isWarranty ? 'warranty' : 'upcoming';
  }

  return {
    id: r.id,
    assetId: r.assetId || undefined,
    assetName: r.asset?.name || undefined,
    title: r.title,
    dueDate: r.dueDate.toISOString().split('T')[0],
    type: isWarranty ? 'warranty' : r.type === ReminderType.MAINTENANCE_DUE ? 'maintenance' : 'custom',
    priority,
    status: r.status.toLowerCase(),
    diffDays,
    daysLabel,
    categoryGroup,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/reminders (List reminders)
remindersRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;
    const { status, assetId, type } = req.query;

    const whereClause: any = {};
    if (assetId) {
      whereClause.assetId = String(assetId);
    } else if (householdId) {
      whereClause.householdId = householdId;
    }

    if (status) {
      whereClause.status = mapReminderStatus(String(status));
    }

    if (type && type !== 'all') {
      whereClause.type = mapReminderType(String(type));
    }

    const reminders = await prisma.reminder.findMany({
      where: whereClause,
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const enriched = reminders.map(formatReminderResponse);

    const dueTodayCount = enriched.filter((r) => r.status !== 'completed' && r.categoryGroup === 'due_today').length;
    const thisMonthCount = enriched.filter((r) => r.status !== 'completed' && r.categoryGroup === 'this_month').length;
    const warrantyCount = enriched.filter((r) => r.status !== 'completed' && r.type === 'warranty').length;

    logger.debug(`Listed ${enriched.length} reminders from PostgreSQL`, {
      dueToday: dueTodayCount,
      thisMonth: thisMonthCount,
      warranty: warrantyCount,
    }, 'PostgreSQL Reminders');

    return res.json({
      success: true,
      data: enriched,
      total: enriched.length,
      summary: {
        dueToday: dueTodayCount,
        thisMonth: thisMonthCount,
        warranty: warrantyCount,
      },
    });
  } catch (err: any) {
    logger.error('Failed to list reminders', err, undefined, 'PostgreSQL Reminders');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reminders (Create reminder)
remindersRouter.post('/', async (req, res) => {
  try {
    const {
      title,
      assetId,
      dueDate = new Date().toISOString().split('T')[0],
      type = 'maintenance',
    } = req.body;

    const userSession = await getActiveUser(req.headers.authorization);
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

    if (!title) {
      return res.status(400).json({ success: false, error: 'Reminder title is required' });
    }

    const newReminder = await prisma.reminder.create({
      data: {
        householdId,
        assetId: assetId || null,
        title,
        dueDate: new Date(dueDate),
        type: mapReminderType(type),
        status: ReminderStatus.PENDING,
      },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Reminder created in PostgreSQL: ${newReminder.title} (${newReminder.id})`, {
      id: newReminder.id,
      dueDate: newReminder.dueDate,
    }, 'PostgreSQL Reminders');

    return res.status(201).json({ success: true, data: formatReminderResponse(newReminder) });
  } catch (error: any) {
    logger.error('Failed to create reminder', error, undefined, 'PostgreSQL Reminders');
    return res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/reminders/:id (Get reminder by ID)
remindersRouter.get('/:id', async (req, res) => {
  try {
    const item = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    return res.json({ success: true, data: formatReminderResponse(item) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/reminders/:id (Update reminder)
remindersRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dueDate, snoozeDays, title } = req.body;

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    let nextDueDate = dueDate ? new Date(dueDate) : existing.dueDate;
    if (snoozeDays && typeof snoozeDays === 'number') {
      const current = new Date(existing.dueDate);
      current.setDate(current.getDate() + snoozeDays);
      nextDueDate = current;
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        status: status ? mapReminderStatus(status) : undefined,
        dueDate: nextDueDate,
      },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Reminder updated in PostgreSQL: ${updated.title} (${id})`, {
      id,
      newStatus: updated.status,
      newDueDate: updated.dueDate,
    }, 'PostgreSQL Reminders');

    return res.json({ success: true, data: formatReminderResponse(updated) });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/reminders/:id (Delete reminder)
remindersRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({
      where: { id },
    });

    logger.info(`Reminder deleted from PostgreSQL: ${id}`, { id }, 'PostgreSQL Reminders');
    return res.json({ success: true, message: 'Reminder deleted' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
