import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env and local .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env') });
dotenv.config();

import { authRouter } from './routes/auth';
import { assetsRouter } from './routes/assets';
import { invoicesRouter } from './routes/invoices';
import { documentsRouter } from './routes/documents';
import { remindersRouter } from './routes/reminders';
import { servicesRouter } from './routes/services';
import { householdsRouter } from './routes/households';
import { analyticsRouter } from './routes/analytics';
import { searchRouter } from './routes/search';
import { logger, requestLogger } from './utils/logger';
import { checkDatabaseConnection } from './services/prisma';

const app = express();
const port = process.env.PORT || 4005;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(requestLogger);

app.get('/health', async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  res.json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'Home Asset Manager API',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/household', householdsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    logger.info(`Server listening on http://localhost:${port}`, {
      port,
      environment: process.env.NODE_ENV || 'development',
    }, 'Server');

    await checkDatabaseConnection();
  });
}

export { assetsRouter } from './routes/assets';
export { documentsRouter } from './routes/documents';
export { remindersRouter } from './routes/reminders';
export { servicesRouter } from './routes/services';
export { householdsRouter } from './routes/households';
export { analyticsRouter } from './routes/analytics';
export { searchRouter } from './routes/search';

export default app;
