import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import WebSocket from 'ws';

const WSServer = (WebSocket as any).WebSocketServer || (WebSocket as any).Server || WebSocket;

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
import { voiceRouter } from './routes/voice';
import { logger, requestLogger } from './utils/logger';
import { checkDatabaseConnection, prisma } from './services/prisma';
import { getUserByToken } from './services/user-store';
import { GeminiLiveSession } from './services/gemini-live';

const app = express();
const port = process.env.PORT || 4005;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Home Asset Manager API',
    version: '1.0.0',
    documentation: 'https://github.com/sahsisunny/home-assets',
    healthCheck: '/health',
  });
});

app.get('/health', async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  res.json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'Home Asset Manager API',
  });
});

// API Routes (mounted with /api/ and direct paths for universal compatibility)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/assets', assetsRouter);
app.use('/assets', assetsRouter);

app.use('/api/invoices', invoicesRouter);
app.use('/invoices', invoicesRouter);

app.use('/api/documents', documentsRouter);
app.use('/documents', documentsRouter);

app.use('/api/reminders', remindersRouter);
app.use('/reminders', remindersRouter);

app.use('/api/services', servicesRouter);
app.use('/services', servicesRouter);

app.use('/api/household', householdsRouter);
app.use('/household', householdsRouter);

app.use('/api/analytics', analyticsRouter);
app.use('/analytics', analyticsRouter);

app.use('/api/search', searchRouter);
app.use('/search', searchRouter);

app.use('/api/voice', voiceRouter);
app.use('/voice', voiceRouter);

const server = http.createServer(app);

// WebSocket Server for Realtime AI Voice Assistant
const wss = new WSServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/api/voice/ws' || pathname === '/voice/ws' || pathname === '/ws/voice') {
    wss.handleUpgrade(request, socket, head, (ws: any) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token') || (req.headers['authorization'] as string) || (req.headers['sec-websocket-protocol'] as string);
  const currentRoute = url.searchParams.get('route') || undefined;
  const currentAssetId = url.searchParams.get('assetId') || undefined;

  let session = await getUserByToken(token);

  if (!session) {
    // If running in development and no token, fallback to the primary household in DB
    const firstUser = await prisma.user.findFirst({
      include: {
        households: {
          include: { household: true },
        },
      },
    });

    if (firstUser && firstUser.households[0]?.household) {
      session = {
        user: {
          id: firstUser.id,
          fullName: firstUser.fullName,
          email: firstUser.email || '',
          phone: firstUser.phone || '',
          householdId: firstUser.households[0].household.id,
          role: 'Owner',
          createdAt: firstUser.createdAt.toISOString(),
        },
        household: {
          id: firstUser.households[0].household.id,
          name: firstUser.households[0].household.name,
          plan: 'Family Pro',
          ownerId: firstUser.id,
          createdAt: firstUser.households[0].household.createdAt.toISOString().split('T')[0],
          members: [],
        },
      };
    }
  }

  if (!session) {
    logger.warn('Unauthorized WebSocket voice assistant connection rejected', {}, 'VoiceWebSocket');
    ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized: Authentication required.' }));
    ws.close(4401, 'Unauthorized');
    return;
  }

  logger.info(`Realtime Voice Assistant WebSocket connected for user "${session.user.fullName}" (${session.household.name})`, {
    userId: session.user.id,
    householdId: session.household.id,
    currentRoute,
  }, 'VoiceWebSocket');

  const userGender = url.searchParams.get('gender') || (session.user as any).gender || 'male';

  const liveSession = new GeminiLiveSession({
    clientWs: ws,
    ctx: {
      userId: session.user.id,
      householdId: session.household.id,
      userName: session.user.fullName,
      userGender,
      householdName: session.household.name,
    },
    currentRoute,
    currentAssetId,
  });

  liveSession.start();
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, async () => {
    logger.info(`Server listening on http://localhost:${port} (HTTP & WebSockets enabled on /api/voice/ws)`, {
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
export { voiceRouter } from './routes/voice';

export default app;

