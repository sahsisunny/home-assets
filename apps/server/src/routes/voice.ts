import { Router } from 'express';
import { logger } from '../utils/logger';
import { getActiveUser } from '../services/user-store';
import { GEMINI_VOICE_TOOL_DECLARATIONS, VoiceToolExecutor } from '../services/voice-tools';
import { GeminiTextAgent } from '../services/gemini-live';

export const voiceRouter = Router();

// GET /api/voice/status (Check readiness & API key)
voiceRouter.get('/status', async (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  return res.json({
    success: true,
    service: 'Home Asset Manager Voice Assistant',
    status: hasKey ? 'online' : 'unconfigured_api_key',
    hasApiKey: hasKey,
    toolsCount: GEMINI_VOICE_TOOL_DECLARATIONS.length,
    websocketEndpoint: '/api/voice/ws',
  });
});

// GET /api/voice/tools (List approved assistant tools)
voiceRouter.get('/tools', async (req, res) => {
  return res.json({
    success: true,
    tools: GEMINI_VOICE_TOOL_DECLARATIONS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  });
});

// GET /api/voice/recommendations (Fetch proactive home recommendations)
voiceRouter.get('/recommendations', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    if (!userSession) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Active user session required' });
    }

    const focusArea = typeof req.query.focusArea === 'string' ? req.query.focusArea : 'all';
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 6;

    const result = await VoiceToolExecutor.getSmartRecommendations(
      { focusArea, limit },
      {
        userId: userSession.user.id,
        householdId: userSession.household.id,
        userName: userSession.user.fullName,
        householdName: userSession.household.name,
      }
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    logger.error('Failed to get voice recommendations', err, {}, 'VoiceAssistant');
    return res.status(500).json({ success: false, error: err.message || 'Recommendations failed' });
  }
});

// POST /api/voice/chat (Intelligent agent fallback / text query)
voiceRouter.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    if (!userSession) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Active user session required' });
    }

    const { message, history = [], currentRoute, currentAssetId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    logger.info(`Voice Assistant chat query from ${userSession.user.fullName}: "${message}"`, {
      userId: userSession.user.id,
      householdId: userSession.household.id,
      currentRoute,
    }, 'VoiceAssistant');

    const result = await GeminiTextAgent.chat(
      message.trim(),
      {
        userId: userSession.user.id,
        householdId: userSession.household.id,
        userName: userSession.user.fullName,
        userGender: (userSession.user as any).gender || req.body.gender || 'male',
        householdName: userSession.household.name,
      },
      history,
      currentRoute,
      currentAssetId
    );

    const durationMs = Date.now() - startTime;
    logger.info(`Voice Assistant chat answered in ${durationMs}ms with ${result.toolsCalled.length} tool(s) invoked`, {
      tools: result.toolsCalled.map((t) => t.name),
      durationMs,
    }, 'VoiceAssistant');

    return res.json({
      success: true,
      text: result.text,
      toolsCalled: result.toolsCalled,
      suggestions: result.suggestions,
      durationMs,
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    logger.error('Voice Assistant chat failed', err, { durationMs }, 'VoiceAssistant');
    return res.status(500).json({ success: false, error: err.message || 'Voice assistant error' });
  }
});
