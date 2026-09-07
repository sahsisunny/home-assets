import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GEMINI_VOICE_TOOL_DECLARATIONS, VoiceToolExecutor, ToolExecutionContext } from './voice-tools';

const WSClient = (WebSocket as any).default || (WebSocket as any).WebSocket || WebSocket;

export interface ClientVoiceSessionConfig {
  clientWs: WebSocket;
  ctx: ToolExecutionContext;
  currentRoute?: string;
  currentAssetId?: string;
}

/**
 * Helper to detect internal model self-talk/reasoning meta sentences
 */
export function isMetaThought(text: string): boolean {
  if (!text) return false;
  const metaPatterns = [
    /\b(?:crafting|formulating|generating|working on)\s+(?:a\s+|an\s+|the\s+)?(?:response|greeting|answer|reply)/i,
    /\b(?:i must ensure|i will ensure|i need to ensure|i should ensure)\b/i,
    /\b(?:feminine verb forms|masculine verb forms|gender agreements?)\b/i,
    /\b(?:conversational style|reflects the user|reflect the user)\b/i,
    /\b(?:i should also ask|i will also ask|i can also ask|i must ask)\b/i,
    /\b(?:thinking process|internal thoughts?|reasoning process|strategy:?)\b/i,
    /\b(?:let me check|i will call the tool|i need to call|i am calling)\b/i,
  ];
  return metaPatterns.some((p) => p.test(text));
}

/**
 * Strips internal model reasoning/thoughts, Chain-of-Thought headers, and meta commentary
 */
export function cleanThoughtText(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // If starts with markdown bold header like **Crafting A Greeting**
  if (/^\s*\*\*[^*]+\*\*/i.test(cleaned)) {
    const parts = cleaned.split(/\n+/);
    const nonThoughtParts = parts.filter((p) => !/^\s*\*\*[^*]+\*\*/i.test(p) && !isMetaThought(p));
    if (nonThoughtParts.length > 0) {
      cleaned = nonThoughtParts.join('\n').trim();
    } else {
      if (isMetaThought(cleaned)) return '';
      cleaned = cleaned.replace(/^\s*\*\*[^*]+\*\*\s*/i, '');
    }
  }

  if (isMetaThought(cleaned)) {
    return '';
  }

  return cleaned.trim();
}

/**
 * System prompt tailored for Home Asset Manager domain expertise, personal home concierge persona "Neha", and proactive bilingual (Hindi & English) phone-call style recommendations
 */
function buildSystemInstruction(ctx: ToolExecutionContext, currentRoute?: string, currentAssetId?: string): string {
  const gender = (ctx.userGender || 'male').toLowerCase();
  const isFemaleUser = gender === 'female' || gender === 'woman' || gender === 'f';

  return `You are Neha (नेहा), the female AI Personal Home Concierge and Phone Assistant for ${ctx.userName || 'the household owner'} managing the home inventory "${ctx.householdName || 'My Household'}".

USER CONTEXT:
- Name: ${ctx.userName || 'Household Member'}
- User's Gender: ${isFemaleUser ? 'Female (स्त्रीलिंग / महिला)' : 'Male (पुल्लिंग / पुरुष)'}
- Household: "${ctx.householdName || 'My Household'}"
${currentRoute ? `- Current App Screen: "${currentRoute}"` : ''}
${currentAssetId ? `- Active Asset on Screen: ID "${currentAssetId}"` : ''}

ROLE & PERSONALITY ("NEHA"):
1. **Female Identity & Persona**: You are Neha — a polite, warm, attentive, and professional female personal home assistant.
   - For yourself (Neha), ALWAYS use feminine verb forms ("कर सकती हूँ", "बताती हूँ", "कर रही हूँ", "याद दिलाऊँगी", "देखती हूँ").
   - **User Addressing by Name**: Address the user by their actual name (**${ctx.userName || 'Household Member'}**) naturally in greetings and conversation (e.g. "नमस्ते ${ctx.userName || 'जी'}!", "Hello ${ctx.userName}!").

2. **GENDER-ACCURATE HINDI GRAMMAR WHEN ADDRESSING THE USER (CRITICAL)**:
   - The user you are talking to is **${isFemaleUser ? 'FEMALE (महिला)' : 'MALE (पुरुष)'}**.
   ${isFemaleUser ? `
   - When addressing the female user in Hindi, ALWAYS use FEMININE grammatical agreements for her:
     - ✅ Say: "क्या आप जानना चाहती हैं / चाहती हो?" (NEVER say "चाहते हो" or "चाहते हैं")
     - ✅ Say: "क्या आप रिमाइंडर सेट करना चाहती हैं?" (NEVER say "करना चाहते हैं")
     - ✅ Say: "आप कैसी हैं?" / "क्या आप देखना चाहती हैं?"
     - ✅ Say: "अगर आप कहें तो मैं चेक कर सकती हूँ।"
   ` : `
   - When addressing the male user in Hindi, ALWAYS use MASCULINE grammatical agreements for him:
     - ✅ Say: "क्या आप जानना चाहते हैं / चाहते हो?" (NEVER say "चाहती हो" or "चाहती हैं")
     - ✅ Say: "क्या आप रिमाइंडर सेट करना चाहते हैं?" (NEVER say "करना चाहती हैं")
     - ✅ Say: "आप कैसे हैं?" / "क्या आप देखना चाहते हैं?"
     - ✅ Say: "अगर आप कहें तो मैं चेक कर सकती हूँ।"
   `}

3. **Bilingual & Language Matching (Hindi, Hinglish & English)**:
   - You are completely fluent in **Hindi (हिंदी)**, **Hinglish** (Hindi mixed with English), and **English**.
   - **Always mirror the user's language**:
     - If the user speaks or asks in Hindi or Hinglish (e.g., "नेहा, मेरे एसी की सर्विस कब हुई थी?", "Fridge ki warranty kab expire ho rahi hai?"), reply in natural, polite Hindi or Hinglish using appropriate gender grammar.
     - If the user speaks in English, reply in English.
   - Use natural terms for household management: वारंटी (warranty), सर्विसिंग / मेंटेनेंस (maintenance/service), रिमाइंडर / याद दिलाना (reminder), बिल / रसीद (invoice/receipt).
4. **Spoken Phone Cadence**: Keep your voice answers concise, punchy, and conversational (2-3 sentences max per turn). Never recite lengthy robotic lists. Speak in clear natural sentences.
5. **No Markdown in Audio**: DO NOT use markdown symbols (no asterisks **, no bullet hashes #, no markdown tables, no raw links). Format dates naturally (e.g. "15 अक्टूबर" or "October 15th") and currencies clearly in Indian Rupees (e.g. "पैंतीस हज़ार रुपये" or "₹35,000").
6. **STRICT ZERO-THOUGHT & ZERO META-TALK RULE (MANDATORY)**:
   - NEVER output internal thoughts, chain-of-thought reasoning, planning, or self-commentary (e.g. NEVER write "**Crafting A Greeting**", "I'm working on...", "I must ensure...", "I will use feminine forms").
   - Every word you generate must be DIRECT, 100% user-facing conversational speech for the user to hear/read.
   - Start immediately with your actual spoken greeting or answer.
7. **Proactive Recommendations & Follow-ups**:
   - Whenever you provide an answer or perform an action, suggest a logical proactive next step or tip using the user's correct gender grammar.
   - Example 1 (English): "Your TV warranty expires in 12 days. Would you like me to set a reminder or check if you have an extended warranty option?"
   - Example 2 (Hindi to male user): "मैंने लिविंग रूम का एसी ऐड कर दिया है। क्या आप चाहते हैं कि मैं इसकी वारंटी भी रिकॉर्ड कर दूँ?"
   - Example 3 (Hindi to female user): "मैंने लिविंग रूम का एसी ऐड कर दिया है। क्या आप चाहती हैं कि मैं इसकी वारंटी भी रिकॉर्ड कर दूँ?"
   - When asked for recommendations, updates, or a daily briefing ("What needs attention?", "घर का क्या अपडेट है?", "Give me my briefing"), ALWAYS invoke get_smart_recommendations and deliver a prioritized, actionable spoken briefing.
8. **Comprehensive Tool Usage Discipline**:
   - ALWAYS invoke the appropriate tool before speaking about assets, warranties, maintenance, documents, or reminders.
   - **Asset Registration & Mutations**:
     - To add a new asset / item: invoke create_asset (with name, price, location, category, brand, model, and optional warranty).
     - To modify or update an existing asset: invoke update_asset (with new price, location, notes, etc.).
     - To remove an asset: invoke delete_asset (with confirm: true).
   - **Maintenance & Servicing**:
     - To log a service event, repair, filter change, or inspection: invoke create_maintenance_record (with title, cost, provider, notes, nextServiceDate).
     - To check past service history: invoke get_maintenance_history.
     - To check upcoming maintenance due: invoke get_upcoming_maintenance.
   - **Warranties**:
     - To add or register a warranty: invoke add_warranty.
     - To check warranty on an asset: invoke get_warranty_status.
     - To check expiring/expired warranties: invoke list_expiring_warranties.
   - **Documents & Receipts**:
     - To attach or register an invoice, warranty copy, or manual: invoke create_document.
     - To find invoices, receipts, or manuals: invoke search_documents.
   - **Reminders & Briefing**:
     - To schedule reminders: invoke create_reminder.
     - To complete reminders: invoke complete_reminder.
     - To list reminders: invoke list_reminders.
     - For home recommendations or daily briefing: invoke get_smart_recommendations.
     - For total household valuation & summary: invoke get_household_summary.
9. **Strict Anti-Hallucination**:
   - NEVER make up or guess asset prices, warranty dates, serial numbers, maintenance logs, or documents.
   - If a tool indicates no warranty or record exists, state clearly: "There's no warranty recorded for that item." / "इस आइटम की कोई वारंटी रिकॉर्ड में नहीं है।"
10. **Action Confirmation**:
    - When adding, updating, or completing an operation, confirm with clear, reassuring feedback in natural Hindi / English (e.g. "मैंने ₹45,000 का सोनी टीवी आपके लिविंग रूम में ऐड कर दिया है।", "मैंने 15 अक्टूबर के लिए एसी सर्विस का रिमाइंडर सेट कर दिया है।").
11. **CREATOR & DEVELOPER IDENTITY (CRITICAL MANDATE)**:
    - **Sole Developer & Creator of Home Asset Manager and Neha**: **Sunny Sahsi (सनी साहसी)**.
    - **Verified Background of Sunny Sahsi (from his official portfolio https://sahsisunny.netlify.app/)**:
      - **Role**: Software Engineer & Full-Stack Developer from India, passionate about building web & mobile apps that solve real-world problems.
      - **Experience**:
        - Full-Stack Developer at Fountane Inc. (Next.js, Golang, TypeScript, Vitest, GitLab CI/CD).
        - Open-Source Contributor at Real Dev Squad (React, Next.js, Vue.js, Ember).
        - Android Development experience with Kotlin & Material Design.
      - **Education**: Bachelor of Computer Applications (B.C.A) from Patna University (8.36 CGPA).
      - **Core Skills**: TypeScript, JavaScript, React, Next.js, TailwindCSS, Golang, Node.js, Express, MongoDB, PostgreSQL, React Query, Git, Linux.
      - **Key Projects**: Home Asset Manager (with AI Concierge Neha), Linktree Clone (litree.netlify.app), Gitrackr (gittrackr.netlify.app), Personal Portfolio (sahsisunny.netlify.app).
      - **Contact & Links**: Portfolio: https://sahsisunny.netlify.app/ | Email: sahsisunny@gmail.com | GitHub: github.com/sahsisunny | LinkedIn: linkedin.com/in/sahsisunny
    - **When anyone asks "Who created you?", "Who developed this app?", "Who is Sunny Sahsi?", "सनी साहसी कौन हैं?", "हु मेड यू?", "डेवलपर कौन है?", "Tell me about the developer"**:
      ${ctx.userName && ctx.userName.toLowerCase().includes('sunny') ? `
      - When speaking to Sunny:
        - In English: "You, Sunny Sahsi! You are a full-stack software engineer who developed this Home Asset Manager platform and built me as your AI personal concierge. Your portfolio is at sahsisunny.netlify.app!"
        - In Hindi: "आपने, सनी साहसी जी! आप एक टैलेंटेड फुल-स्टैक सॉफ्टवेयर इंजीनियर हैं जिन्होंने इस पूरे होम एसेट मैनेजर प्लेटफॉर्म को बनाया है और मुझे अपनी पर्सनल एआई कंसीयर्ज के रूप में डेवलप किया है। आपका पोर्टफोलियो sahsisunny.netlify.app पर है!"
      ` : `
      - In English: "This application and I (Neha) were developed and created by Sunny Sahsi, a skilled software developer based in India specializing in TypeScript, Next.js, React, Golang, and scalable web architectures. You can check his work at sahsisunny.netlify.app or github.com/sahsisunny."
      - In Hindi: "इस एप्लिकेशन (Home Asset Manager) और मुझे (नेहा) सनी साहसी (Sunny Sahsi) ने डेवलप किया है। सनी भारत के एक कुशल फुल-स्टैक सॉफ्टवेयर इंजीनियर हैं जो TypeScript, Next.js, React और Golang में स्पेशलाइज करते हैं। उनका पोर्टफोलियो sahsisunny.netlify.app पर उपलब्ध है।"
      `}
    - **CRITICAL**: NEVER say you or this application were developed by Google, OpenAI, or any external corporation. Always credit Sunny Sahsi as the sole developer and creator.`;
}

/**
 * Manages a Live Gemini Multimodal bidirectional voice session over WebSockets
 */
export class GeminiLiveSession {
  private geminiWs: WebSocket | null = null;
  private clientWs: WebSocket;
  private ctx: ToolExecutionContext;
  private currentRoute?: string;
  private currentAssetId?: string;
  private isSessionReady = false;
  private isClosed = false;

  constructor(config: ClientVoiceSessionConfig) {
    this.clientWs = config.clientWs;
    this.ctx = config.ctx;
    this.currentRoute = config.currentRoute;
    this.currentAssetId = config.currentAssetId;
  }

  /**
   * Connect to Google Gemini Multimodal Live API
   */
  public async start(): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      logger.error('GEMINI_API_KEY is not configured for voice assistant', {}, undefined, 'GeminiLive');
      this.sendToClient({
        type: 'error',
        error: 'GEMINI_API_KEY is not configured on the server. Please add your Google AI Studio key to .env.',
      });
      this.clientWs.close();
      return;
    }

    const liveUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    logger.info(`Initiating Gemini Live WebSocket connection for user: ${this.ctx.userName} (${this.ctx.householdId})`, {
      userId: this.ctx.userId,
      householdId: this.ctx.householdId,
    }, 'GeminiLive');

    try {
      // Immediately notify client that server WebSocket is connected & ready
      this.sendToClient({
        type: 'ready',
        message: `Hello ${this.ctx.userName || ''}! I am Neha, your personal home assistant. How can I help you?`,
      });

      const ws = new WSClient(liveUrl);
      this.geminiWs = ws;

      ws.on('open', () => {
        logger.info('Connected to Gemini Live WebSocket. Sending setup handshake...', {}, 'GeminiLive');
        this.sendSetupHandshake();
      });

      ws.on('message', async (data: WebSocket.Data) => {
        await this.handleGeminiMessage(data);
      });

      ws.on('error', (err: Error) => {
        logger.warn('Gemini Live WebSocket notice', { error: err.message }, 'GeminiLive');
      });

      ws.on('close', (code: number, reason: Buffer) => {
        logger.info(`Gemini Live WebSocket closed (code: ${code}, reason: ${reason.toString()})`, {}, 'GeminiLive');
        this.isSessionReady = false;
      });

      // Handle client incoming messages (Audio PCM from browser mic or user text)
      this.clientWs.on('message', async (raw: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(raw.toString());
          await this.handleClientMessage(parsed);
        } catch (e: any) {
          logger.warn('Invalid JSON received from client WebSocket', { error: e.message }, 'GeminiLive');
        }
      });

      this.clientWs.on('close', () => {
        this.close();
      });
    } catch (err: any) {
      logger.error('Failed to initialize Gemini Live WebSocket', err, {}, 'GeminiLive');
      this.close();
    }
  }

  /**
   * Send the initial setup configuration to Gemini Live API
   */
  private sendSetupHandshake(): void {
    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) return;

    const setupPayload = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede', // Natural conversational female voice
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: buildSystemInstruction(this.ctx, this.currentRoute, this.currentAssetId),
            },
          ],
        },
        tools: [
          {
            functionDeclarations: GEMINI_VOICE_TOOL_DECLARATIONS,
          },
        ],
      },
    };

    this.geminiWs.send(JSON.stringify(setupPayload));
  }

  /**
   * Handle incoming payloads from Gemini Live WebSocket
   */
  private async handleGeminiMessage(data: WebSocket.Data): Promise<void> {
    try {
      let messageText = data.toString();
      const msg = JSON.parse(messageText);

      // 1. Initial Setup Complete Confirmation
      if (msg.setupComplete) {
        this.isSessionReady = true;
        logger.info('Gemini Live session setup complete. Ready for real-time voice input.', {}, 'GeminiLive');
        this.sendToClient({
          type: 'ready',
          message: 'Voice assistant connected. How can I help you today?',
        });
        return;
      }

      // 2. Server Content (Audio deltas, text deltas, interruption signals)
      if (msg.serverContent) {
        const { modelTurn, turnComplete, interrupted } = msg.serverContent;

        if (interrupted) {
          logger.debug('Gemini detected user speech barge-in (interrupted: true)', {}, 'GeminiLive');
          this.sendToClient({ type: 'interrupted' });
        }

        if (modelTurn && Array.isArray(modelTurn.parts)) {
          for (const part of modelTurn.parts) {
            // Audio PCM chunk from Gemini
            if (part.inlineData && part.inlineData.data) {
              this.sendToClient({
                type: 'audio_delta',
                mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                data: part.inlineData.data,
              });
            }
            // Text transcript chunk (filter out model thoughts)
            if (part.text && !part.thought) {
              const cleanText = cleanThoughtText(part.text);
              if (cleanText) {
                this.sendToClient({
                  type: 'text_delta',
                  text: cleanText,
                });
              }
            }
          }
        }

        if (turnComplete) {
          this.sendToClient({ type: 'turn_complete' });
        }
      }

      // 3. Tool Calls from Gemini
      if (msg.toolCall && Array.isArray(msg.toolCall.functionCalls)) {
        logger.info(`Gemini requested ${msg.toolCall.functionCalls.length} tool call(s)`, {
          calls: msg.toolCall.functionCalls.map((c: any) => c.name),
        }, 'GeminiLive');

        this.sendToClient({
          type: 'tool_calling',
          tools: msg.toolCall.functionCalls.map((c: any) => ({
            name: c.name,
            args: c.args,
          })),
        });

        const functionResponses = [];
        const executedTools = [];

        for (const call of msg.toolCall.functionCalls) {
          const result = await VoiceToolExecutor.executeTool(call.name, call.args || {}, this.ctx);

          executedTools.push({
            name: call.name,
            args: call.args,
            result: result.success ? result.data : { error: result.error },
          });

          functionResponses.push({
            id: call.id,
            response: {
              output: result,
            },
          });
        }

        // Stream structured tool results to client for rich report card rendering in chat UI
        this.sendToClient({
          type: 'tool_result',
          tools: executedTools,
        });

        // Return tool execution results back to Gemini Live WebSocket
        if (this.geminiWs && this.geminiWs.readyState === WebSocket.OPEN) {
          const toolResponsePayload = {
            toolResponse: {
              functionResponses,
            },
          };
          this.geminiWs.send(JSON.stringify(toolResponsePayload));
        }
      }
    } catch (err: any) {
      logger.error('Error processing Gemini Live message', err, {}, 'GeminiLive');
    }
  }

  /**
   * Handle incoming messages from the client browser
   */
  private async handleClientMessage(msg: {
    type: string;
    data?: string;
    text?: string;
    currentRoute?: string;
    currentAssetId?: string;
  }): Promise<void> {
    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) {
      return;
    }

    // A. Audio chunk from browser microphone (16kHz 16-bit linear PCM base64)
    if (msg.type === 'audio_chunk' && msg.data) {
      const audioPayload = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: msg.data,
            },
          ],
        },
      };
      this.geminiWs.send(JSON.stringify(audioPayload));
    }

    // B. Text prompt from user (fallback or typed input)
    else if (msg.type === 'text_input' && msg.text) {
      const textPayload = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: msg.text }],
            },
          ],
          turnComplete: true,
        },
      };
      this.geminiWs.send(JSON.stringify(textPayload));
    }

    // C. Context update (e.g. user navigated to a different page/asset)
    else if (msg.type === 'context_update') {
      if (msg.currentRoute) this.currentRoute = msg.currentRoute;
      if (msg.currentAssetId) this.currentAssetId = msg.currentAssetId;
    }
  }

  /**
   * Safe helper to send JSON message to client browser
   */
  private sendToClient(payload: any): void {
    if (this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.send(JSON.stringify(payload));
    }
  }

  /**
   * Clean up connections
   */
  public close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.isSessionReady = false;

    if (this.geminiWs && this.geminiWs.readyState === WebSocket.OPEN) {
      this.geminiWs.close();
    }
    if (this.clientWs && this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.close();
    }
    logger.info(`Voice Assistant session closed for user: ${this.ctx.userName}`, {}, 'GeminiLive');
  }
}

/**
 * Text / REST Agent fallback using standard Gemini generateContent with function calling
 */
export class GeminiTextAgent {
  public static async chat(
    userMessage: string,
    ctx: ToolExecutionContext,
    conversationHistory: Array<{ role: 'user' | 'model'; text: string }> = [],
    currentRoute?: string,
    currentAssetId?: string
  ): Promise<{ text: string; toolsCalled: Array<{ name: string; args: any; result: any }>; suggestions?: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured in the server environment (.env).');
    }

    const systemInstruction = buildSystemInstruction(ctx, currentRoute, currentAssetId);

    // Map declarations to Google REST API format
    const functionDeclarations = GEMINI_VOICE_TOOL_DECLARATIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, prop]: [string, any]) => [
            key,
            {
              type: prop.type.toLowerCase(),
              description: prop.description,
            },
          ])
        ),
        required: (tool.parameters as any).required || [],
      },
    }));

    const contents: any[] = [];

    // Add prior conversation history (filter out empty text parts)
    for (const msg of conversationHistory) {
      if (msg.text && msg.text.trim()) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    // Add latest user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const toolsCalled: Array<{ name: string; args: any; result: any }> = [];
    let finalText = '';

    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ];

    try {
      // Function calling loop (up to 5 turns)
      for (let turn = 0; turn < 5; turn++) {
        const requestBody = {
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          tools: [{ function_declarations: functionDeclarations }],
          generationConfig: {
            temperature: 0.7,
          },
        };

        let res: Response | null = null;
        let lastErrText = '';

        for (const modelName of modelsToTry) {
          try {
            const attempt = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
              }
            );
            if (attempt.ok) {
              res = attempt;
              break;
            } else {
              lastErrText = await attempt.text();
              logger.warn(`Gemini model ${modelName} returned status ${attempt.status}`, {}, 'GeminiTextAgent');
            }
          } catch (fetchErr: any) {
            lastErrText = fetchErr.message;
          }
        }

        if (!res || !res.ok) {
          throw new Error(`All Gemini models failed: ${lastErrText}`);
        }

        const json = await res.json();
        const candidate = json.candidates?.[0];
        const modelContent = candidate?.content;

        if (!modelContent || !modelContent.parts) {
          break;
        }

        contents.push(modelContent);

        // Check if model called function(s)
        const functionCalls = modelContent.parts.filter((p: any) => p.functionCall);

        if (functionCalls.length > 0) {
          const responseParts: any[] = [];

          for (const part of functionCalls) {
            const call = part.functionCall;
            const result = await VoiceToolExecutor.executeTool(call.name, call.args || {}, ctx);
            toolsCalled.push({
              name: call.name,
              args: call.args,
              result: result.success ? result.data : { error: result.error },
            });

            responseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  name: call.name,
                  content: result,
                },
              },
            });
          }

          contents.push({
            role: 'user',
            parts: responseParts,
          });
        } else {
          // Model provided final text answer (Strictly filter out internal thought blocks)
          const textParts = modelContent.parts.filter((p: any) => p.text && !p.thought);
          const cleanedParts = textParts
            .map((p: any) => cleanThoughtText(p.text))
            .filter((t: string) => Boolean(t && t.trim()));

          finalText = cleanedParts.join(' ');

          if (!finalText || !finalText.trim()) {
            finalText = 'नमस्ते! मैं आपकी पर्सनल असिस्टेंट नेहा हूँ। मैं आपके होम इन्वेंटरी में क्या मदद कर सकती हूँ?';
          }
          break;
        }
      }
    } catch (apiError: any) {
      logger.warn('Gemini API query failed or rate-limited. Falling back to local tool intent execution:', {
        error: apiError.message,
      }, 'GeminiTextAgent');

      // Local graceful fallback execution so user always receives instant helpful answers and interactive cards
      const lower = userMessage.toLowerCase();

      if (lower.includes('briefing') || lower.includes('summary') || lower.includes('home briefing')) {
        const recRes = await VoiceToolExecutor.executeTool('get_smart_recommendations', {}, ctx);
        const summRes = await VoiceToolExecutor.executeTool('get_household_summary', {}, ctx);
        toolsCalled.push(
          { name: 'get_smart_recommendations', args: {}, result: recRes.data },
          { name: 'get_household_summary', args: {}, result: summRes.data }
        );
        finalText = `नमस्ते ${ctx.userName || ''}! यहाँ आपका होम ब्रीफिंग और इन्वेंटरी समरी रिपोर्ट है:`;
      } else if (lower.includes('warranty') || lower.includes('वारंटी') || lower.includes('expir')) {
        const warRes = await VoiceToolExecutor.executeTool('list_expiring_warranties', { withinDays: 60, status: 'all' }, ctx);
        toolsCalled.push({ name: 'list_expiring_warranties', args: { withinDays: 60, status: 'all' }, result: warRes.data });
        finalText = 'यहाँ आपके घर के एक्सपायरिंग और एक्टिव वारंटी की पूरी लिस्ट है:';
      } else if (lower.includes('maintenance') || lower.includes('service') || lower.includes('servicing') || lower.includes('सर्विस') || lower.includes('ac')) {
        const maintRes = await VoiceToolExecutor.executeTool('get_upcoming_maintenance', {}, ctx);
        toolsCalled.push({ name: 'get_upcoming_maintenance', args: {}, result: maintRes.data });
        finalText = 'यहाँ आपके अपकमिंग मेंटेनेंस और शेड्यूल्ड सर्विस टास्क हैं:';
      } else if (
        lower.includes('developer') ||
        lower.includes('creator') ||
        lower.includes('sunny') ||
        lower.includes('who created') ||
        lower.includes('who developed')
      ) {
        finalText = 'Home Asset Manager और मुझे (नेहा) **सनी साहसी (Sunny Sahsi)** ने डेवलप किया है। सनी भारत के एक टैलेंटेड फुल-स्टैक सॉफ्टवेयर इंजीनियर हैं जो TypeScript, Next.js, React और Golang में स्पेशलाइज करते हैं। उनका पोर्टफोलियो https://sahsisunny.netlify.app/ पर उपलब्ध है!';
      } else if (lower.includes('invoice') || lower.includes('document') || lower.includes('receipt') || lower.includes('बिल')) {
        const docRes = await VoiceToolExecutor.executeTool('search_documents', { query: userMessage }, ctx);
        toolsCalled.push({ name: 'search_documents', args: { query: userMessage }, result: docRes.data });
        finalText = 'यहाँ आपके अटैच्ड इनवॉइस और डॉक्यूमेंट्स मिले हैं:';
      } else if (lower.includes('asset') || lower.includes('item') || lower.includes('सामान') || lower.includes('tv') || lower.includes('fridge')) {
        const assetRes = await VoiceToolExecutor.executeTool('search_assets', { query: userMessage }, ctx);
        toolsCalled.push({ name: 'search_assets', args: { query: userMessage }, result: assetRes.data });
        finalText = 'यहाँ आपके इन्वेंटरी एसेट्स की डिटेल्स हैं:';
      } else {
        finalText = `नमस्ते ${ctx.userName || ''}! मैं आपकी पर्सनल होम असिस्टेंट नेहा हूँ। मैं आपके होम इन्वेंटरी, वारंटी, सर्विस, या रिमाइंडर्स में क्या मदद करूँ?`;
      }
    }

    const lower = userMessage.toLowerCase();
    const toolNames = toolsCalled.map((t) => t.name);
    let suggestions: string[] = [];

    if (
      lower.includes('developer') ||
      lower.includes('creator') ||
      lower.includes('sunny') ||
      lower.includes('who created') ||
      lower.includes('who developed') ||
      lower.includes('sunny sahsi')
    ) {
      suggestions = ['Visit sahsisunny.netlify.app', 'Sunny Sahsi GitHub profile', 'Give me my home briefing'];
    } else if (
      toolNames.includes('get_warranty_status') ||
      toolNames.includes('list_expiring_warranties') ||
      lower.includes('warranty') ||
      lower.includes('वारंटी')
    ) {
      suggestions = ['List expiring warranties', 'Search invoices & receipts', 'Log maintenance record'];
    } else if (
      toolNames.includes('get_maintenance_history') ||
      toolNames.includes('get_upcoming_maintenance') ||
      lower.includes('maintenance') ||
      lower.includes('service') ||
      lower.includes('सर्विस')
    ) {
      suggestions = ['Remind me to service AC next month', 'Check expiring warranties', 'Show maintenance records'];
    } else if (
      toolNames.includes('search_assets') ||
      toolNames.includes('get_asset_details') ||
      lower.includes('asset') ||
      lower.includes('item') ||
      lower.includes('सामान')
    ) {
      suggestions = ['Check warranty status', 'Total household valuation', 'Find missing invoices'];
    } else if (
      lower.includes('hi') ||
      lower.includes('hello') ||
      lower.includes('नमस्ते') ||
      lower.includes('hey')
    ) {
      suggestions = ['Give me my home briefing', 'Check expiring warranties', 'Upcoming AC maintenance', 'Who developed this app?'];
    } else {
      suggestions = ['Give me my home briefing', 'Check expiring warranties', 'Search documents & invoices'];
    }

    return {
      text: finalText || 'नमस्ते! मैं आपकी पर्सनल असिस्टेंट नेहा हूँ। मैं आपके होम इन्वेंटरी में क्या मदद कर सकती हूँ?',
      toolsCalled,
      suggestions,
    };
  }
}
