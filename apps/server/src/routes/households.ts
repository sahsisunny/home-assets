import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma, HouseholdRole } from '../services/prisma';
import { getActiveUser } from '../services/user-store';

export const householdsRouter = Router();

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatHouseholdResponse(h: any) {
  return {
    id: h.id,
    name: h.name,
    plan: 'Family Pro',
    ownerId: h.members?.find((m: any) => m.role === HouseholdRole.OWNER)?.userId || '',
    createdAt: h.createdAt.toISOString().split('T')[0],
    members: h.members ? h.members.map((m: any) => ({
      id: m.id,
      name: m.user?.fullName || 'Member',
      emailOrPhone: m.user?.email || m.user?.phone || '',
      role: m.role === HouseholdRole.OWNER ? 'Owner' : m.role === HouseholdRole.ADMIN ? 'Admin' : 'Member',
      initials: getInitials(m.user?.fullName || 'M'),
      joinedDate: m.createdAt.toISOString().split('T')[0],
      status: 'active',
    })) : [],
  };
}

// GET /api/household
householdsRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    if (!householdId) {
      return res.status(401).json({ success: false, error: 'No active household or session found' });
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!household) {
      return res.status(404).json({ success: false, error: 'Household not found in PostgreSQL' });
    }

    logger.debug('Retrieved household from PostgreSQL', {
      householdId: household.id,
      name: household.name,
    }, 'PostgreSQL Households');

    return res.json({
      success: true,
      data: formatHouseholdResponse(household),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/household (Rename household)
householdsRouter.patch('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    if (!householdId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No active household' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Household name is required' });
    }

    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { name: name.trim() },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.info(`Household renamed in PostgreSQL to "${updated.name}"`, {
      householdId: updated.id,
    }, 'PostgreSQL Households');

    return res.json({ success: true, data: formatHouseholdResponse(updated) });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/household/members (Invite member)
householdsRouter.post('/members', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    if (!householdId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No active household' });
    }

    const { name, emailOrPhone, role = 'Member' } = req.body;

    if (!name || !emailOrPhone) {
      return res.status(400).json({ success: false, error: 'Name and email/phone are required' });
    }

    const email = emailOrPhone.includes('@') ? emailOrPhone.trim().toLowerCase() : null;
    const phone = !emailOrPhone.includes('@') ? emailOrPhone.trim() : null;

    // Find or create user for this member
    let memberUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!memberUser) {
      memberUser = await prisma.user.create({
        data: {
          fullName: name.trim(),
          email: email || `${Date.now()}@homeassets.local`,
          phone,
        },
      });
    }

    const roleEnum = role.toUpperCase() === 'OWNER' ? HouseholdRole.OWNER : role.toUpperCase() === 'ADMIN' ? HouseholdRole.ADMIN : HouseholdRole.MEMBER;

    const member = await prisma.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId,
          userId: memberUser.id,
        },
      },
      update: {
        role: roleEnum,
      },
      create: {
        householdId,
        userId: memberUser.id,
        role: roleEnum,
      },
      include: {
        user: true,
      },
    });

    logger.info(`Household member added in PostgreSQL: ${memberUser.fullName} (${member.role})`, {
      memberId: member.id,
    }, 'PostgreSQL Households');

    return res.status(201).json({
      success: true,
      data: {
        id: member.id,
        name: member.user.fullName,
        emailOrPhone: member.user.email || member.user.phone || '',
        role: member.role === HouseholdRole.OWNER ? 'Owner' : member.role === HouseholdRole.ADMIN ? 'Admin' : 'Member',
        initials: getInitials(member.user.fullName),
        joinedDate: 'Just now',
        status: 'active',
      },
    });
  } catch (error: any) {
    logger.error('Error inviting household member in PostgreSQL', error, undefined, 'PostgreSQL Households');
    return res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/household/members/:id (Remove member)
householdsRouter.delete('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.householdMember.findUnique({
      where: { id },
    });

    if (member?.role === HouseholdRole.OWNER) {
      return res.status(400).json({ success: false, error: 'Cannot remove household owner' });
    }

    await prisma.householdMember.delete({
      where: { id },
    });

    logger.info(`Household member removed from PostgreSQL: ${id}`, { id }, 'PostgreSQL Households');
    return res.json({ success: true, message: 'Member removed successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/household/export (Export all household data from PostgreSQL)
householdsRouter.get('/export', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;

    const whereHousehold = householdId ? { householdId } : {};

    const [household, assets, reminders] = await Promise.all([
      householdId ? prisma.household.findUnique({ where: { id: householdId }, include: { members: { include: { user: true } } } }) : null,
      prisma.asset.findMany({ where: whereHousehold, include: { warranty: true, documents: true, records: true } }),
      prisma.reminder.findMany({ where: whereHousehold }),
    ]);

    const format = req.query.format || 'json';

    if (format === 'csv') {
      const headers = ['Asset ID', 'Name', 'Category', 'Brand', 'Model', 'Purchase Price', 'Location', 'Purchase Date'];
      const rows = assets.map((a) => [
        `"${a.id}"`,
        `"${a.name || ''}"`,
        `"${a.categoryId || ''}"`,
        `"${a.brand || ''}"`,
        `"${a.model || ''}"`,
        a.purchasePrice || 0,
        `"${a.location || ''}"`,
        `"${a.purchaseDate ? a.purchaseDate.toISOString().split('T')[0] : ''}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="home_assets_export.csv"');
      return res.send(csvContent);
    }

    return res.json({
      success: true,
      data: {
        household: household ? formatHouseholdResponse(household) : null,
        exportedAt: new Date().toISOString(),
        totalAssets: assets.length,
        totalReminders: reminders.length,
        assets,
        reminders,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
