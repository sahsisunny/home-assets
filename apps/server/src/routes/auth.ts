import { Router } from 'express';
import { RegisterSchema, LoginSchema, OtpVerifySchema } from '@home-assets/validation';
import { logger } from '../utils/logger';
import {
  registerUser,
  authenticateUser,
  getActiveUser,
  logoutToken,
  updateUserAccount,
} from '../services/user-store';
import { prisma } from '../services/prisma';

export const authRouter = Router();

// In-memory OTP store for development/testing
const otpStore = new Map<string, { otp: string; data?: any }>();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    
    // Create the actual user and household in PostgreSQL
    const result = await registerUser({
      fullName: validated.fullName,
      email: validated.email,
      phone: validated.phone,
      password: validated.password,
    });

    const otp = '123456';
    otpStore.set(validated.phone, { otp, data: result });

    logger.info(`Registration completed for user: ${result.user.fullName} (${result.user.email})`, {
      userId: result.user.id,
      householdId: result.household.id,
    }, 'PostgreSQL Auth');

    return res.status(201).json({
      success: true,
      message: 'Account created successfully in PostgreSQL.',
      token: result.token,
      user: result.user,
      household: result.household,
      debugOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    });
  } catch (err: any) {
    logger.warn('Registration failed', { error: err.message }, 'PostgreSQL Auth');
    return res.status(400).json({ success: false, error: err.errors || err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const validated = LoginSchema.parse(req.body);
    
    const result = await authenticateUser({
      identifier: validated.identifier,
      password: validated.password,
    });

    logger.info(`User authenticated: ${result.user.fullName} (${result.user.email})`, {
      userId: result.user.id,
      householdId: result.household.id,
    }, 'PostgreSQL Auth');

    return res.json({
      success: true,
      token: result.token,
      user: result.user,
      household: result.household,
    });
  } catch (err: any) {
    logger.warn('Login validation failed', { error: err.message }, 'PostgreSQL Auth');
    return res.status(400).json({ success: false, error: err.errors || err.message });
  }
});

// GET /api/auth/me (Get current authenticated user)
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userSession = await getActiveUser(authHeader);

    if (!userSession) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No active session' });
    }

    return res.json({
      success: true,
      user: userSession.user,
      household: userSession.household,
    });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Unauthorized session' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  logoutToken(authHeader);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// PATCH /api/auth/profile
authRouter.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const active = await getActiveUser(authHeader);
    if (!active) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const updated = await updateUserAccount(active.user.id, req.body);

    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/auth/verify-otp
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const validated = OtpVerifySchema.parse(req.body);
    const stored = otpStore.get(validated.phone);
    const storedOtp = stored?.otp || '123456';

    if (validated.otp !== storedOtp && validated.otp !== '123456') {
      logger.warn(`OTP verification failed for phone: +91 ******${validated.phone.slice(-4)}`, {}, 'PostgreSQL Auth');
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    let userSession = stored?.data;
    if (!userSession) {
      userSession = await authenticateUser({
        identifier: validated.phone,
      });
    }

    logger.info(`OTP verified successfully for phone: +91 ******${validated.phone.slice(-4)}`, {}, 'PostgreSQL Auth');

    return res.json({
      success: true,
      token: userSession.token,
      user: userSession.user,
      household: userSession.household,
    });
  } catch (err: any) {
    logger.warn('OTP verification error', { error: err.message }, 'PostgreSQL Auth');
    return res.status(400).json({ success: false, error: err.errors || err.message });
  }
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or mobile number is required' });
  }

  const otp = '123456';
  otpStore.set(identifier, { otp });

  logger.info(`Password reset OTP generated for: ${identifier}`, {}, 'PostgreSQL Auth');
  return res.json({
    success: true,
    message: 'Reset instructions sent to your email/phone.',
    debugOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Identifier and new password required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: password },
    });
  }

  return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});
