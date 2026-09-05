import { prisma, HouseholdRole } from './prisma';
import { logger } from '../utils/logger';
import { UserAccount, Household, StoredSession } from '../types/models';

export type { UserAccount, Household, StoredSession };

// In-memory active session token map
export const activeSessions = new Map<string, { userId: string; createdAt: number }>();
export const otpMap = new Map<string, { otp: string; expiresAt: number }>();

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Register a new actual user in PostgreSQL
 */
export async function registerUser(params: {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
}): Promise<{ user: UserAccount; household: Household; token: string }> {
  const email = params.email.trim().toLowerCase();
  const phone = params.phone ? params.phone.trim() : null;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('An account with this email already exists. Please log in.');
    }
    if (phone && existingUser.phone === phone) {
      throw new Error('An account with this phone number already exists. Please log in.');
    }
  }

  // Create user, household, and membership transactionally
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: params.fullName.trim(),
        email,
        phone,
        passwordHash: params.password || null,
        avatarUrl: params.avatarUrl || null,
      },
    });

    const household = await tx.household.create({
      data: {
        name: `${params.fullName.trim()}'s Home`,
        members: {
          create: {
            userId: user.id,
            role: HouseholdRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return { user, household };
  });

  const formattedHousehold: Household = {
    id: result.household.id,
    name: result.household.name,
    plan: 'Family Pro',
    ownerId: result.user.id,
    createdAt: result.household.createdAt.toISOString().split('T')[0],
    members: result.household.members.map((m) => ({
      id: m.id,
      name: m.user.fullName,
      emailOrPhone: m.user.email || m.user.phone || '',
      role: m.role === 'OWNER' ? 'Owner' : m.role === 'ADMIN' ? 'Admin' : 'Member',
      initials: getInitials(m.user.fullName),
      joinedDate: 'Just now',
      status: 'active',
    })),
  };

  const formattedUser: UserAccount = {
    id: result.user.id,
    fullName: result.user.fullName,
    email: result.user.email || '',
    phone: result.user.phone || '',
    password: params.password,
    householdId: result.household.id,
    avatarUrl: result.user.avatarUrl || undefined,
    role: 'Owner',
    createdAt: result.user.createdAt.toISOString(),
  };

  // Generate session token
  const token = `auth_token_${result.user.id}_${Date.now()}`;
  activeSessions.set(token, {
    userId: result.user.id,
    createdAt: Date.now(),
  });

  logger.info(`User registered in PostgreSQL: ${formattedUser.fullName} (${formattedUser.email})`, {
    userId: formattedUser.id,
    householdId: formattedHousehold.id,
  }, 'PostgreSQL Auth');

  return { user: formattedUser, household: formattedHousehold, token };
}

/**
 * Authenticate existing user from PostgreSQL
 */
export async function authenticateUser(params: {
  identifier: string;
  password?: string;
}): Promise<{ user: UserAccount; household: Household; token: string }> {
  const ident = params.identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: ident },
        { phone: ident },
      ],
    },
    include: {
      households: {
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('No account found with this email or phone number. Please sign up.');
  }

  // Verify password if set
  if (params.password && user.passwordHash && params.password !== user.passwordHash) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  let householdRecord = user.households[0]?.household;

  // If user has no household, create one automatically
  if (!householdRecord) {
    householdRecord = await prisma.household.create({
      data: {
        name: `${user.fullName}'s Home`,
        members: {
          create: {
            userId: user.id,
            role: HouseholdRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  const formattedHousehold: Household = {
    id: householdRecord.id,
    name: householdRecord.name,
    plan: 'Family Pro',
    ownerId: user.id,
    createdAt: householdRecord.createdAt.toISOString().split('T')[0],
    members: householdRecord.members.map((m) => ({
      id: m.id,
      name: m.user.fullName,
      emailOrPhone: m.user.email || m.user.phone || '',
      role: m.role === 'OWNER' ? 'Owner' : m.role === 'ADMIN' ? 'Admin' : 'Member',
      initials: getInitials(m.user.fullName),
      joinedDate: 'Joined',
      status: 'active',
    })),
  };

  const formattedUser: UserAccount = {
    id: user.id,
    fullName: user.fullName,
    email: user.email || '',
    phone: user.phone || '',
    householdId: householdRecord.id,
    avatarUrl: user.avatarUrl || undefined,
    role: 'Owner',
    createdAt: user.createdAt.toISOString(),
  };

  const token = `auth_token_${user.id}_${Date.now()}`;
  activeSessions.set(token, {
    userId: user.id,
    createdAt: Date.now(),
  });

  logger.info(`User authenticated in PostgreSQL: ${formattedUser.fullName} (${formattedUser.email})`, {
    userId: user.id,
  }, 'PostgreSQL Auth');

  return { user: formattedUser, household: formattedHousehold, token };
}

/**
 * Get user and household by session token
 */
export async function getUserByToken(token?: string): Promise<{ user: UserAccount; household: Household } | null> {
  if (!token) return null;

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  
  let userId: string | undefined;
  const session = activeSessions.get(cleanToken);
  if (session) {
    userId = session.userId;
  } else if (cleanToken.startsWith('auth_token_')) {
    const withoutPrefix = cleanToken.slice('auth_token_'.length);
    const lastUnderscore = withoutPrefix.lastIndexOf('_');
    userId = lastUnderscore !== -1 ? withoutPrefix.slice(0, lastUnderscore) : withoutPrefix;
  }

  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        households: {
          include: {
            household: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    let householdRecord = user.households[0]?.household;
    if (!householdRecord) {
      householdRecord = await prisma.household.create({
        data: {
          name: `${user.fullName}'s Home`,
          members: {
            create: {
              userId: user.id,
              role: HouseholdRole.OWNER,
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    const formattedHousehold: Household = {
      id: householdRecord.id,
      name: householdRecord.name,
      plan: 'Family Pro',
      ownerId: user.id,
      createdAt: householdRecord.createdAt.toISOString().split('T')[0],
      members: householdRecord.members.map((m) => ({
        id: m.id,
        name: m.user.fullName,
        emailOrPhone: m.user.email || m.user.phone || '',
        role: m.role === 'OWNER' ? 'Owner' : m.role === 'ADMIN' ? 'Admin' : 'Member',
        initials: getInitials(m.user.fullName),
        joinedDate: 'Joined',
        status: 'active',
      })),
    };

    const formattedUser: UserAccount = {
      id: user.id,
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      householdId: householdRecord.id,
      avatarUrl: user.avatarUrl || undefined,
      role: 'Owner',
      createdAt: user.createdAt.toISOString(),
    };

    return { user: formattedUser, household: formattedHousehold };
  } catch (err) {
    logger.error('Error fetching user by token from PostgreSQL', err, undefined, 'PostgreSQL Auth');
    return null;
  }
}

/**
 * Get active user by token
 */
export async function getActiveUser(token?: string): Promise<{ user: UserAccount; household: Household } | null> {
  return getUserByToken(token);
}

/**
 * Invalidate session token
 */
export function logoutToken(token?: string): boolean {
  if (!token) return false;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  return activeSessions.delete(cleanToken);
}

/**
 * Update user account details
 */
export async function updateUserAccount(userId: string, data: Partial<UserAccount>): Promise<UserAccount> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName ? data.fullName.trim() : undefined,
      email: data.email ? data.email.trim().toLowerCase() : undefined,
      phone: data.phone !== undefined ? data.phone.trim() : undefined,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
    },
    include: {
      households: true,
    },
  });

  const householdId = updatedUser.households[0]?.householdId || '';

  return {
    id: updatedUser.id,
    fullName: updatedUser.fullName,
    email: updatedUser.email || '',
    phone: updatedUser.phone || '',
    householdId,
    avatarUrl: updatedUser.avatarUrl || undefined,
    role: 'Owner',
    createdAt: updatedUser.createdAt.toISOString(),
  };
}
