'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl, getApiBaseUrl, API_ENDPOINTS } from '@home-assets/tokens';

export type VoiceAssistantState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolsCalled?: Array<{ name: string; args: any; result?: any }>;
  suggestions?: string[];
}

export interface LiveCaption {
  speaker: 'user' | 'assistant';
  text: string;
}

export interface UseVoiceAssistantOptions {
  currentRoute?: string;
  currentAssetId?: string;
  userGender?: string;
  onAssetModified?: () => void;
}

export function getToolStatusLabel(toolName: string, args?: any): string {
  switch (toolName) {
    case 'search_assets':
      return args?.query ? `Finding assets matching "${args.query}"...` : 'Searching your assets...';
    case 'get_asset_details':
      return args?.assetName ? `Loading details for ${args.assetName}...` : 'Fetching asset details...';
    case 'get_warranty_status':
      return args?.assetName ? `Checking warranty for ${args.assetName}...` : 'Checking warranty status...';
    case 'list_expiring_warranties':
      return 'Checking expiring warranties...';
    case 'get_maintenance_history':
      return args?.assetName ? `Checking service records for ${args.assetName}...` : 'Checking maintenance records...';
    case 'get_upcoming_maintenance':
      return 'Checking scheduled maintenance tasks...';
    case 'get_smart_recommendations':
      return 'Analyzing household health & recommendations...';
    case 'create_reminder':
      return args?.title ? `Scheduling reminder: "${args.title}"...` : 'Creating reminder...';
    case 'complete_reminder':
      return 'Marking reminder completed...';
    case 'search_documents':
      return args?.assetName ? `Finding invoices for ${args.assetName}...` : 'Searching documents & invoices...';
    case 'get_household_summary':
      return 'Calculating household portfolio valuation...';
    case 'create_asset':
      return args?.name ? `Adding "${args.name}" to inventory...` : 'Registering new asset...';
    case 'update_asset':
      return args?.assetName ? `Updating ${args.assetName}...` : 'Updating asset details...';
    case 'delete_asset':
      return args?.assetName ? `Removing ${args.assetName}...` : 'Deleting asset...';
    case 'create_maintenance_record':
      return args?.title ? `Logging service: "${args.title}"...` : 'Logging maintenance record...';
    case 'create_document':
      return args?.name ? `Attaching document: "${args.name}"...` : 'Recording document...';
    case 'add_warranty':
      return args?.assetName ? `Registering warranty for ${args.assetName}...` : 'Registering warranty...';
    default:
      return `Executing ${toolName.replace(/_/g, ' ')}...`;
  }
}

export function isMetaThoughtText(text: string): boolean {
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

export function cleanAssistantText(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  if (/^\s*\*\*[^*]+\*\*/i.test(cleaned)) {
    const parts = cleaned.split(/\n+/);
    const nonThoughtParts = parts.filter((p) => !/^\s*\*\*[^*]+\*\*/i.test(p) && !isMetaThoughtText(p));
    if (nonThoughtParts.length > 0) {
      cleaned = nonThoughtParts.join('\n').trim();
    } else {
      if (isMetaThoughtText(cleaned)) return '';
      cleaned = cleaned.replace(/^\s*\*\*[^*]+\*\*\s*/i, '');
    }
  }

  if (isMetaThoughtText(cleaned)) {
    return '';
  }

  return cleaned.trim();
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { token } = useAuth();
  const [status, setStatus] = useState<VoiceAssistantState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTools, setActiveTools] = useState<Array<{ name: string; args: any }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isMutedRef = useRef(false);
  const isAssistantSpeakingRef = useRef(false);
  const lastAssistantSpeechTimeRef = useRef<number>(0);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [liveCaption, setLiveCaption] = useState<LiveCaption | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioInputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const currentAssistantMsgIdRef = useRef<string | null>(null);
  const assistantAccumulatedTextRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const captionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Helper to append/update assistant text stream
  const appendAssistantText = useCallback((textChunk: string) => {
    assistantAccumulatedTextRef.current += textChunk;
    const fullText = cleanAssistantText(assistantAccumulatedTextRef.current);
    if (!fullText) return;

    // Update live caption banner
    setLiveCaption({
      speaker: 'assistant',
      text: fullText,
    });

    if (captionTimeoutRef.current) {
      clearTimeout(captionTimeoutRef.current);
      captionTimeoutRef.current = null;
    }

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant' && last.id === currentAssistantMsgIdRef.current) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: fullText },
        ];
      } else {
        const newId = `msg_${Date.now()}`;
        currentAssistantMsgIdRef.current = newId;
        return [
          ...prev,
          {
            id: newId,
            role: 'assistant',
            text: fullText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
    });
  }, []);

  // Stop all currently playing audio chunks immediately (Barge-in / Interruption)
  const stopAudioPlayback = useCallback(() => {
    for (const source of audioQueueRef.current) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already have ended
      }
    }
    audioQueueRef.current = [];
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    isAssistantSpeakingRef.current = false;
    lastAssistantSpeechTimeRef.current = 0;
    setOutputVolume(0);
    assistantAccumulatedTextRef.current = '';
  }, []);

  // Play incoming 24kHz 16-bit PCM audio chunk from Gemini
  const queueAudioChunk = useCallback((base64Data: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    try {
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const numSamples = int16.length;
      if (numSamples === 0) return;

      const sampleRate = 24000;
      const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      let sumSquares = 0;
      for (let i = 0; i < numSamples; i++) {
        const norm = int16[i] / 32768.0;
        channelData[i] = norm;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / numSamples);
      setOutputVolume(Math.min(1, rms * 4));

      // Mark assistant actively speaking to block mic audio acoustic feedback
      isAssistantSpeakingRef.current = true;
      lastAssistantSpeechTimeRef.current = Date.now();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      audioQueueRef.current.push(source);
      source.onended = () => {
        const idx = audioQueueRef.current.indexOf(source);
        if (idx !== -1) audioQueueRef.current.splice(idx, 1);
        if (audioQueueRef.current.length === 0) {
          setOutputVolume(0);
          setStatus('listening');
          lastAssistantSpeechTimeRef.current = Date.now();
          setTimeout(() => {
            if (audioQueueRef.current.length === 0) {
              isAssistantSpeakingRef.current = false;
            }
          }, 800);
        }
      };

      setStatus('speaking');
    } catch (err) {
      console.error('Failed to decode/play audio delta:', err);
    }
  }, []);

  // Clean up all audio and speech recognition hardware resources
  const cleanupAudio = useCallback(() => {
    stopAudioPlayback();

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (captionTimeoutRef.current) {
      clearTimeout(captionTimeoutRef.current);
      captionTimeoutRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    if (audioInputSourceRef.current) {
      audioInputSourceRef.current.disconnect();
      audioInputSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setInputVolume(0);
    setOutputVolume(0);
    setLiveCaption(null);
  }, [stopAudioPlayback]);

  // Disconnect session
  const disconnect = useCallback(() => {
    cleanupAudio();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setActiveTools([]);
    currentAssistantMsgIdRef.current = null;
    assistantAccumulatedTextRef.current = '';
  }, [cleanupAudio]);

  // Connect to Realtime Gemini Voice Gateway over WebSocket
  const connect = useCallback(async () => {
    disconnect();
    setError(null);
    setStatus('connecting');

    try {
      // 1. Initialize Web Audio API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // 2. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. Setup Browser Speech Recognition for instantaneous live user captions
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-IN';

          recognition.onresult = (event: any) => {
            // Guard: Do not transcribe if microphone is muted, or assistant is actively speaking / just finished speaking
            const timeSinceAssistantSpoke = Date.now() - lastAssistantSpeechTimeRef.current;
            if (isMutedRef.current || isAssistantSpeakingRef.current || timeSinceAssistantSpoke < 800) {
              return;
            }

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const currentText = (finalTranscript || interimTranscript).trim();
            if (!currentText) return;

            // Acoustic echo filter: discard if recognized text is an echo of what Neha just spoke
            const cleanedUser = currentText.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
            const cleanedAssistant = (assistantAccumulatedTextRef.current || '').toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
            if (cleanedAssistant && cleanedUser && (cleanedAssistant.includes(cleanedUser) || cleanedUser.includes(cleanedAssistant))) {
              return;
            }

            setLiveCaption({
              speaker: 'user',
              text: currentText,
            });

            if (finalTranscript.trim()) {
              // Add final user transcript to messages
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user' && last.text === finalTranscript.trim()) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    id: `user_speech_${Date.now()}`,
                    role: 'user',
                    text: finalTranscript.trim(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              });
            }
          };

          recognition.onerror = (e: any) => {
            // Speech recognition errors (like no-speech) are harmless
            if (e.error !== 'no-speech') {
              console.warn('SpeechRecognition notice:', e.error);
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition could not be initialized:', e);
        }
      }

      // 4. Setup Dynamic WebSocket URL (supports Localhost, Vercel, Render, etc.)
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (optionsRef.current.currentRoute) params.append('route', optionsRef.current.currentRoute);
      if (optionsRef.current.currentAssetId) params.append('assetId', optionsRef.current.currentAssetId);
      if (optionsRef.current.userGender) params.append('gender', optionsRef.current.userGender);

      let wsEndpoint = '';
      const customWsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (customWsUrl) {
        const cleanWs = customWsUrl.replace(/\/+$/, '');
        wsEndpoint = cleanWs.endsWith('/api/voice/ws') ? cleanWs : `${cleanWs}/api/voice/ws`;
      } else {
        const apiBase = getApiBaseUrl(); // e.g. "https://home-assets-api.onrender.com/api" or "http://localhost:4005/api"
        try {
          const parsed = new URL(apiBase);
          const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
          wsEndpoint = `${wsProtocol}//${parsed.host}/api/voice/ws`;
        } catch {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.hostname || 'localhost';
          wsEndpoint = `${protocol}//${host}:4005/api/voice/ws`;
        }
      }

      const wsUrl = `${wsEndpoint}?${params.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');
        setError(null);

        // Setup microphone capture processor
        const source = audioCtx.createMediaStreamSource(stream);
        audioInputSourceRef.current = source;

        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        audioProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) {
            setInputVolume(0);
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);
          const len = inputData.length;
          const pcm16 = new Int16Array(len);

          let sumSquares = 0;
          for (let i = 0; i < len; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSquares += s * s;
          }

          const rms = Math.sqrt(sumSquares / len);
          setInputVolume(Math.min(1, rms * 5));

          // Guard against speaker feedback: If assistant is actively speaking, only send if user is intentionally interrupting (rms >= 0.15)
          if (isAssistantSpeakingRef.current && rms < 0.15) {
            return;
          }

          const bytes = new Uint8Array(pcm16.buffer);
          let binary = '';
          const bytesLen = bytes.byteLength;
          for (let i = 0; i < bytesLen; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          ws.send(
            JSON.stringify({
              type: 'audio_chunk',
              data: base64,
            })
          );
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setStatus('listening');
            if (msg.message && messages.length === 0) {
              setMessages([
                {
                  id: `welcome_${Date.now()}`,
                  role: 'assistant',
                  text: msg.message,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
          } else if (msg.type === 'audio_delta' && msg.data) {
            queueAudioChunk(msg.data);
          } else if (msg.type === 'text_delta' && msg.text) {
            appendAssistantText(msg.text);
          } else if (msg.type === 'tool_calling') {
            setStatus('thinking');
            setActiveTools(msg.tools || []);
            const toolLabels = (msg.tools || []).map((t: any) => getToolStatusLabel(t.name, t.args)).join(', ');
            setLiveCaption({
              speaker: 'assistant',
              text: toolLabels || 'Checking home inventory...',
            });
          } else if (msg.type === 'tool_result' && Array.isArray(msg.tools)) {
            setActiveTools([]);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant' && last.id === currentAssistantMsgIdRef.current) {
                const existingTools = last.toolsCalled || [];
                return [
                  ...prev.slice(0, -1),
                  { ...last, toolsCalled: [...existingTools, ...msg.tools] },
                ];
              } else {
                const newId = `msg_${Date.now()}`;
                currentAssistantMsgIdRef.current = newId;
                return [
                  ...prev,
                  {
                    id: newId,
                    role: 'assistant',
                    text: '',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    toolsCalled: msg.tools,
                  },
                ];
              }
            });

            if (optionsRef.current.onAssetModified) {
              optionsRef.current.onAssetModified();
            }
          } else if (msg.type === 'interrupted') {
            stopAudioPlayback();
            setStatus('interrupted');
            setLiveCaption(null);
            setTimeout(() => setStatus('listening'), 300);
          } else if (msg.type === 'turn_complete') {
            setActiveTools([]);
            currentAssistantMsgIdRef.current = null;
            assistantAccumulatedTextRef.current = '';

            // Fade live caption after delay
            if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
            captionTimeoutRef.current = setTimeout(() => {
              setLiveCaption(null);
            }, 3000);

            if (optionsRef.current.onAssetModified) {
              optionsRef.current.onAssetModified();
            }
          } else if (msg.type === 'error') {
            setError(msg.error || 'Voice assistant error');
            setStatus('error');
          }
        } catch (e: any) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Voice Assistant WebSocket connection failed:', err);
        setError('Voice connection failed. Please check network connection and try again.');
        setStatus('error');
      };

      ws.onclose = () => {
        cleanupAudio();
        setStatus((prev) => (prev === 'error' ? 'error' : 'disconnected'));
      };
    } catch (err: any) {
      console.error('Failed to start Voice Assistant:', err);
      cleanupAudio();
      setError(err.message || 'Microphone access denied or audio initialization failed.');
      setStatus('error');
    }
  }, [disconnect, token, isMuted, queueAudioChunk, appendAssistantText, stopAudioPlayback, cleanupAudio, messages.length]);

  // Send typed text prompt (always calls intelligent AI chat API)
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const userText = text.trim();

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatus('thinking');
      setIsTyping(true);
      setLiveCaption({ speaker: 'user', text: userText });

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(buildApiUrl(API_ENDPOINTS.VOICE.CHAT), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: userText,
            history: messages.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              text: m.text,
            })),
            currentRoute: optionsRef.current.currentRoute,
            currentAssetId: optionsRef.current.currentAssetId,
            gender: optionsRef.current.userGender,
          }),
        });

        const json = await res.json();
        if (json.success) {
          const cleanText =
            cleanAssistantText(json.text) ||
            'नमस्ते! मैं आपकी पर्सनल असिस्टेंट नेहा हूँ। मैं आपके होम इन्वेंटरी में क्या मदद कर सकती हूँ?';
          const assistantMsg: ChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: cleanText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toolsCalled: json.toolsCalled,
            suggestions: json.suggestions || [],
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStatus('listening');
          setLiveCaption({ speaker: 'assistant', text: cleanText });

          if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
          captionTimeoutRef.current = setTimeout(() => {
            setLiveCaption(null);
          }, 3500);

          if (optionsRef.current.onAssetModified) {
            optionsRef.current.onAssetModified();
          }
        } else {
          setError(json.error || 'Failed to get answer');
          setStatus('listening');
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant_err_${Date.now()}`,
              role: 'assistant',
              text: json.error || 'माफ़ कीजिये, मुझे जवाब देने में परेशानी हुई। कृपया दोबारा पूछें।',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: ['Give me my home briefing', 'Check expiring warranties'],
            },
          ]);
        }
      } catch (err: any) {
        setError(err.message || 'Network error sending message');
        setStatus('listening');
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_neterr_${Date.now()}`,
            role: 'assistant',
            text: 'सर्वर से कनेक्ट करने में समस्या आई है। कृपया एक बार दोबारा प्रयास करें।',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Give me my home briefing', 'Check expiring warranties'],
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [token, messages]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMute = !prev;
      isMutedRef.current = nextMute;

      // 1. Physically disable or enable microphone audio tracks on hardware level
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextMute;
        });
      }

      // 2. Control browser live speech recognition
      if (speechRecognitionRef.current) {
        try {
          if (nextMute) {
            speechRecognitionRef.current.stop();
          } else {
            speechRecognitionRef.current.start();
          }
        } catch (e) {
          // Ignore recognition state toggle errors
        }
      }

      if (nextMute) {
        setInputVolume(0);
      }

      return nextMute;
    });
  }, []);

  const toggleCaptions = useCallback(() => {
    setShowCaptions((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLiveCaption(null);
  }, []);

  // Sync active route and asset context changes live over WebSocket
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'context_update',
          currentRoute: options.currentRoute,
          currentAssetId: options.currentAssetId,
        })
      );
    }
  }, [options.currentRoute, options.currentAssetId]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    messages,
    activeTools,
    error,
    isMuted,
    isTyping,
    inputVolume,
    outputVolume,
    liveCaption,
    showCaptions,
    connect,
    disconnect,
    sendTextMessage,
    toggleMute,
    toggleCaptions,
    clearMessages,
  };
}
