'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVoiceAssistant, VoiceAssistantState, getToolStatusLabel } from '../hooks/useVoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl, API_ENDPOINTS } from '@home-assets/tokens';
import { VoiceToolResultCard } from './VoiceReportCards';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Send,
  User,
  Wrench,
  ShieldCheck,
  FileText,
  Bell,
  ChevronRight,
  Maximize2,
  Minimize2,
  Subtitles,
  Phone,
  PhoneOff,
  PhoneCall,
  Zap,
  ShieldAlert,
  Clock,
  MessageSquare,
  Volume2,
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute?: string;
  currentAssetId?: string;
  onAssetModified?: () => void;
}

interface SmartRecommendation {
  id: string;
  type: 'warranty_expiring' | 'maintenance_due' | 'missing_document' | 'pending_reminder' | 'cost_insight';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction: string;
  spokenBriefing: string;
  assetName?: string;
  assetId?: string;
}

const QUICK_PROMPTS = [
  { icon: Sparkles, text: 'Give me my home briefing' },
  { icon: ShieldCheck, text: 'कौन सी वारंटी खत्म होने वाली है?' },
  { icon: Wrench, text: 'एसी की सर्विस कब करानी है?' },
  { icon: FileText, text: 'Find assets missing invoices' },
  { icon: Bell, text: 'Remind me to service AC next month' },
];

export function VoiceAssistantModal({
  isOpen,
  onClose,
  currentRoute,
  currentAssetId,
  onAssetModified,
}: VoiceAssistantModalProps) {
  const { token, user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('chat');
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useVoiceAssistant({
    currentRoute,
    currentAssetId,
    userGender: (user as any)?.gender || 'male',
    onAssetModified,
  });

  const isSpeaking = status === 'speaking';
  const isCallActive = ['listening', 'speaking', 'thinking', 'interrupted', 'connecting'].includes(status);
  const vol = isSpeaking ? outputVolume : inputVolume;
  const bars = [0.25, 0.5, 0.85, 0.65, 0.35, 0.75, 1.0, 0.8, 0.45, 0.9, 0.6, 0.3];

  const handleTabChange = (tab: 'voice' | 'chat') => {
    setActiveTab(tab);
  };

  // Disconnect when modal is closed
  useEffect(() => {
    if (!isOpen) {
      disconnect();
      setActiveTab('chat');
    }
  }, [isOpen, disconnect]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallActive]);

  // Load recommendations
  useEffect(() => {
    if (isOpen && token) {
      setLoadingRecs(true);
      fetch(buildApiUrl(API_ENDPOINTS.VOICE.RECOMMENDATIONS), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.recommendations)) {
            setRecommendations(data.recommendations);
          }
        })
        .catch((err) => {
          console.warn('Failed to load voice recommendations', err);
        })
        .finally(() => {
          setLoadingRecs(false);
        });
    }
  }, [isOpen, token]);

  // Auto scroll messages in chat mode
  useEffect(() => {
    if (messagesEndRef.current && activeTab === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTools, activeTab, status, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendTextMessage(inputText.trim());
    setInputText('');
  };

  const handlePromptClick = (text: string) => {
    sendTextMessage(text);
  };

  const handleStartCall = () => {
    if (status === 'disconnected' || status === 'error') {
      connect();
    }
    setActiveTab('voice');
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="voice-assistant-modal-container"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isExpanded ? '680px' : '440px',
        maxWidth: 'calc(100vw - 20px)',
        height: isExpanded ? '780px' : '620px',
        maxHeight: 'calc(100vh - 30px)',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .voice-assistant-modal-container {
            width: calc(100vw - 16px) !important;
            height: calc(100vh - 20px) !important;
            max-height: 94vh !important;
            right: 8px !important;
            bottom: 10px !important;
            left: 8px !important;
            border-radius: 20px !important;
            margin: 0 auto !important;
          }
          #global-voice-assistant-trigger {
            bottom: 16px !important;
            right: 16px !important;
            height: 46px !important;
            padding: 0 14px 0 6px !important;
          }
        }
        @keyframes nehaVoiceAura {
          0% { transform: scale(0.94); opacity: 0.85; }
          50% { transform: scale(1.18); opacity: 0.35; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        @keyframes nehaVoiceAura2 {
          0% { transform: scale(0.90); opacity: 0.75; }
          50% { transform: scale(1.12); opacity: 0.3; }
          100% { transform: scale(1.28); opacity: 0; }
        }
        @keyframes nehaTalkingBob {
          0% { transform: scale(1.02) translateY(0px); }
          50% { transform: scale(1.055) translateY(-4px); }
          100% { transform: scale(1.03) translateY(-1px); }
        }
        @keyframes nehaListeningPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.025); }
          100% { transform: scale(1); }
        }
        @keyframes nehaThinkingFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* TOP HEADER: Clean, Crisp White & Minimalist with Segmented Mode Switcher */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '10px 14px',
          background: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          minHeight: '54px',
          flexShrink: 0,
        }}
      >
        {/* Left: Neha Avatar & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              backgroundColor: '#F8FAFC',
              flexShrink: 0,
            }}
          >
            <img
              src="/neha-avatar.jpg"
              alt="Neha"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap' }}>
              <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>Neha</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '1.5px 6px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                AI Assistant
              </span>
              {isCallActive && (
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    padding: '1.5px 6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    border: '1px solid #A7F3D0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Clock size={9} />
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {isCallActive ? 'Live Voice (English & हिंदी)' : 'Personal Concierge'}
            </div>
          </div>
        </div>

        {/* Right: Mode Switcher & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Segmented Mode Switcher: Voice vs Chat */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => handleTabChange('voice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'voice' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'voice' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'voice' ? 700 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: activeTab === 'voice' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
              title="Voice Call Mode"
            >
              <PhoneCall size={11} />
              <span>Voice</span>
            </button>

            <button
              onClick={() => handleTabChange('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'chat' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'chat' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'chat' ? 700 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: activeTab === 'chat' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
              title="Text Chat & Reports"
            >
              <MessageSquare size={11} />
              <span>Chat</span>
            </button>
          </div>

          {/* Captions Toggle Button */}
          {activeTab === 'voice' && (
            <button
              onClick={toggleCaptions}
              style={{
                background: showCaptions ? '#EEF2FF' : '#F8FAFC',
                border: `1px solid ${showCaptions ? '#C7D2FE' : '#E2E8F0'}`,
                borderRadius: '8px',
                padding: '0 6px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                color: showCaptions ? '#4F46E5' : '#64748B',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={showCaptions ? 'Hide Subtitles' : 'Show Subtitles'}
            >
              <Subtitles size={11} />
              <span>CC</span>
            </button>
          )}

          {/* Expand / Minimize Window */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DEDICATED SIMPLE & CLEAN VOICE CALL SCREEN                        */}
      {/* (Focused on Neha's talking avatar, live subtitle, waveform & call dock)   */}
      {/* ========================================================================= */}
      {activeTab === 'voice' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 20px',
            backgroundColor: '#FFFFFF',
            background: 'radial-gradient(circle at 50% 30%, #F5F3FF 0%, #FFFFFF 70%)',
          }}
        >
          {/* Top Status Pill */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: isMuted
                  ? '#FEF2F2'
                  : isSpeaking
                  ? '#F5F3FF'
                  : status === 'thinking'
                  ? '#FEF3C7'
                  : status === 'connecting'
                  ? '#EFF6FF'
                  : status === 'disconnected'
                  ? '#F8FAFC'
                  : '#ECFDF5',
                border: `1px solid ${
                  isMuted
                    ? '#FCA5A5'
                    : isSpeaking
                    ? '#DDD6FE'
                    : status === 'thinking'
                    ? '#FDE68A'
                    : status === 'connecting'
                    ? '#BFDBFE'
                    : status === 'disconnected'
                    ? '#E2E8F0'
                    : '#A7F3D0'
                }`,
                fontSize: '12px',
                fontWeight: 700,
                color: isMuted
                  ? '#B91C1C'
                  : isSpeaking
                  ? '#6D28D9'
                  : status === 'thinking'
                  ? '#92400E'
                  : status === 'connecting'
                  ? '#1D4ED8'
                  : status === 'disconnected'
                  ? '#64748B'
                  : '#065F46',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isMuted
                    ? '#DC2626'
                    : isSpeaking
                    ? '#8B5CF6'
                    : status === 'thinking'
                    ? '#F59E0B'
                    : status === 'connecting'
                    ? '#3B82F6'
                    : status === 'disconnected'
                    ? '#94A3B8'
                    : '#10B981',
                  animation: isSpeaking || inputVolume > 0.08 ? 'pulse 0.8s infinite' : 'none',
                }}
              />
              {isMuted
                ? 'Microphone Muted'
                : status === 'connecting'
                ? 'Connecting to Neha...'
                : status === 'disconnected'
                ? 'Ready for Voice Call'
                : isSpeaking
                ? 'Neha is speaking...'
                : status === 'thinking'
                ? activeTools.length > 0
                  ? getToolStatusLabel(activeTools[0].name, activeTools[0].args)
                  : 'Checking home inventory...'
                : inputVolume > 0.08
                ? 'Listening to you...'
                : 'Listening... (Speak naturally)'}
            </div>
          </div>

          {/* Center Stage: Large Animated Talking Avatar of Neha */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '6px 0',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Multi-Layer Animated 3D Sound Hologram Waves when Speaking */}
              {isSpeaking && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-14px',
                      borderRadius: '50%',
                      border: '2px solid rgba(139, 92, 246, 0.45)',
                      animation: 'nehaVoiceAura 1.8s ease-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-26px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(167, 139, 250, 0.35)',
                      animation: 'nehaVoiceAura2 1.8s ease-out infinite 0.6s',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-38px',
                      borderRadius: '50%',
                      border: '1px solid rgba(196, 181, 253, 0.2)',
                      animation: 'nehaVoiceAura 1.8s ease-out infinite 1.2s',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}

              {/* Avatar Frame with Dynamic Talking / Listening State Animation */}
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: isSpeaking
                    ? '4px solid #8B5CF6'
                    : status === 'thinking'
                    ? '3px solid #F59E0B'
                    : inputVolume > 0.08
                    ? '3px solid #10B981'
                    : isCallActive
                    ? '3px solid #6366F1'
                    : '3px solid #E2E8F0',
                  boxShadow: isSpeaking
                    ? '0 0 0 8px rgba(139, 92, 246, 0.22), 0 16px 40px rgba(139, 92, 246, 0.4)'
                    : status === 'thinking'
                    ? '0 0 0 6px rgba(245, 158, 11, 0.2), 0 10px 25px rgba(245, 158, 11, 0.2)'
                    : inputVolume > 0.08
                    ? '0 0 0 6px rgba(16, 185, 129, 0.25), 0 10px 25px rgba(16, 185, 129, 0.2)'
                    : '0 10px 25px rgba(0, 0, 0, 0.08)',
                  animation: isSpeaking
                    ? 'nehaTalkingBob 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate'
                    : status === 'thinking'
                    ? 'nehaThinkingFloat 1.8s ease-in-out infinite'
                    : inputVolume > 0.08
                    ? 'nehaListeningPulse 1.2s ease-in-out infinite'
                    : 'none',
                  transition: 'border 0.25s, box-shadow 0.25s',
                }}
              >
                <img
                  src="/neha-avatar.jpg"
                  alt="Neha 3D AI Concierge"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
                Neha
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                Personal Voice Concierge (English & हिंदी)
              </div>
            </div>

            {/* Audio Waveform Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '26px', marginTop: '12px' }}>
              {bars.map((scale, i) => {
                const dynamicHeight = isCallActive
                  ? Math.max(4, (vol > 0.05 ? vol : 0.1) * scale * 26)
                  : 4;
                return (
                  <span
                    key={i}
                    style={{
                      width: '4px',
                      height: `${dynamicHeight}px`,
                      borderRadius: '2px',
                      backgroundColor: isSpeaking
                        ? '#8B5CF6'
                        : inputVolume > 0.08
                        ? '#10B981'
                        : isCallActive
                        ? '#CBD5E1'
                        : '#E2E8F0',
                      transition: 'height 0.1s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Centered Spoken Live Subtitles / Captions */}
          {showCaptions && (
            <div
              style={{
                width: '100%',
                minHeight: '68px',
                padding: '12px 18px',
                borderRadius: '16px',
                backgroundColor: liveCaption?.speaker === 'user' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${liveCaption?.speaker === 'user' ? '#BBF7D0' : '#E2E8F0'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {liveCaption ? (
                <>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: liveCaption.speaker === 'user' ? '#15803D' : '#6D28D9',
                      marginBottom: '3px',
                    }}
                  >
                    {liveCaption.speaker === 'user' ? '🎙️ You said:' : '🔊 Neha:'}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: liveCaption.speaker === 'user' ? '#14532D' : '#334155',
                      lineHeight: '1.4',
                    }}
                  >
                    &ldquo;{liveCaption.text}&rdquo;
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500, fontStyle: 'italic' }}>
                  Ask Neha anything about warranties, assets, or maintenance...
                </span>
              )}
            </div>
          )}

          {/* Simple Dedicated Call Action Dock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              paddingTop: '8px',
            }}
          >
            {/* Mute Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={toggleMute}
                disabled={!isCallActive}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: isMuted ? '#DC2626' : '#F8FAFC',
                  color: isMuted ? '#FFFFFF' : '#475569',
                  border: `1.5px solid ${isMuted ? '#B91C1C' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isCallActive ? 'pointer' : 'default',
                  opacity: isCallActive ? 1 : 0.5,
                  boxShadow: isMuted ? '0 0 14px rgba(220, 38, 38, 0.45)' : '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                }}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </div>

            {/* End / Start Call Button */}
            {isCallActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={disconnect}
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  title="End Voice Call"
                >
                  <PhoneOff size={24} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444' }}>
                  End Call
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={handleStartCall}
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  title="Start Voice Call"
                >
                  <Phone size={24} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>
                  Start Call
                </span>
              </div>
            )}

            {/* Switch to Chat Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => setActiveTab('chat')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1.5px solid #C7D2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.1)',
                  transition: 'all 0.2s',
                }}
                title="View Text Chat & Reports"
              >
                <MessageSquare size={20} />
              </button>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                Chat UI
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: FULL TEXT CHAT UI (Report Cards, Recommendations, & Text Queries) */
        /* ========================================================================= */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
          {/* Smart Recommendations Shelf */}
          {recommendations.length > 0 && (
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#4B5563',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                <Zap size={12} color="#F59E0B" />
                <span>Tips:</span>
              </div>

              <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                {recommendations.slice(0, 4).map((rec) => {
                  const isUrgent = rec.severity === 'high';
                  return (
                    <button
                      key={rec.id}
                      onClick={() => handlePromptClick(rec.suggestedAction || rec.title)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        border: `1px solid ${isUrgent ? '#FCA5A5' : '#E2E8F0'}`,
                        backgroundColor: isUrgent ? '#FEF2F2' : '#FFFFFF',
                        color: isUrgent ? '#B91C1C' : '#374151',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        flexShrink: 0,
                      }}
                      title={rec.description}
                    >
                      {rec.type === 'warranty_expiring' ? (
                        <ShieldAlert size={11} color={isUrgent ? '#DC2626' : '#D97706'} />
                      ) : rec.type === 'maintenance_due' ? (
                        <Wrench size={11} color="#4F46E5" />
                      ) : (
                        <Bell size={11} color="#D97706" />
                      )}
                      <span>{rec.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation History Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#FFFFFF',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 12px', color: '#64748B' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 10px auto',
                    border: '3px solid #EEF2FF',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)',
                  }}
                >
                  <img src="/neha-avatar.jpg" alt="Neha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>
                  नमस्ते! How can I help your home today?
                </div>
                <div style={{ fontSize: '12.5px', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto', color: '#64748B' }}>
                  Ask in English or हिंदी. I can search assets, record warranties, log maintenance, or schedule reminders.
                </div>

                {/* Quick Concierge Prompts */}
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {QUICK_PROMPTS.map((prompt, idx) => {
                    const IconComponent = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePromptClick(prompt.text)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          color: '#334155',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <IconComponent size={14} color="#4F46E5" />
                        <span style={{ flex: 1 }}>{prompt.text}</span>
                        <ChevronRight size={13} color="#94A3B8" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const hasText = Boolean(msg.text && msg.text.trim());
              const hasTools = Boolean(msg.toolsCalled && msg.toolsCalled.length > 0);
              const hasSuggestions = Boolean(!isUser && msg.suggestions && msg.suggestions.length > 0);

              // Skip empty ghost message containers
              if (!hasText && !hasTools && !hasSuggestions) {
                return null;
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* User/Assistant Avatar */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isUser ? '#4F46E5' : '#EEF2FF',
                      color: isUser ? '#FFFFFF' : '#4F46E5',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                      marginTop: '2px',
                    }}
                  >
                    {isUser ? (
                      <User size={15} />
                    ) : (
                      <img src="/neha-avatar.jpg" alt="Neha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: 'calc(100% - 38px)' }}>
                    {hasText && (
                      <div
                        style={{
                          padding: '9px 13px',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: isUser ? '#4F46E5' : '#F8FAFC',
                          border: isUser ? 'none' : '1px solid #E2E8F0',
                          color: isUser ? '#FFFFFF' : '#1E293B',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          boxShadow: isUser ? '0 2px 8px rgba(79, 70, 229, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Structured Interactive Tool Result Report Cards */}
                    {hasTools && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.toolsCalled!.map((t, idx) => (
                          <VoiceToolResultCard key={idx} tool={t} onPromptClick={handlePromptClick} />
                        ))}
                      </div>
                    )}

                    {/* Follow-up Smart Contextual Suggestion Chips */}
                    {hasSuggestions && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                        {msg.suggestions!.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handlePromptClick(sug)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '10px',
                              backgroundColor: '#EEF2FF',
                              border: '1px solid #C7D2FE',
                              color: '#4F46E5',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(79, 70, 229, 0.05)',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#E0E7FF';
                              e.currentTarget.style.borderColor = '#A5B4FC';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#EEF2FF';
                              e.currentTarget.style.borderColor = '#C7D2FE';
                            }}
                          >
                            <Sparkles size={10} color="#6366F1" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '9.5px',
                        color: '#94A3B8',
                        textAlign: isUser ? 'right' : 'left',
                        padding: '0 2px',
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Animated Typing Indicator when Neha is thinking or executing tools */}
            {(isTyping || status === 'thinking') && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignSelf: 'flex-start',
                  maxWidth: '88%',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1.5px solid #DDD6FE',
                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.15)',
                    marginTop: '2px',
                  }}
                >
                  <img src="/neha-avatar.jpg" alt="Neha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.08)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6D28D9' }}>
                    {activeTools.length > 0
                      ? getToolStatusLabel(activeTools[0].name, activeTools[0].args)
                      : 'Neha is thinking...'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#8B5CF6',
                        animation: 'pulse 0.8s ease-in-out infinite',
                        animationDelay: '0s',
                      }}
                    />
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#8B5CF6',
                        animation: 'pulse 0.8s ease-in-out infinite',
                        animationDelay: '0.2s',
                      }}
                    />
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#8B5CF6',
                        animation: 'pulse 0.8s ease-in-out infinite',
                        animationDelay: '0.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Shelf above input bar */}
          {messages.length > 0 && (
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#FAFAFA',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                gap: '5px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                flexShrink: 0,
              }}
            >
              {[
                'Give me my home briefing',
                'Check expiring warranties',
                'Upcoming AC maintenance',
                'Find missing invoices',
                'Who developed this app?',
              ].map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(sug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 9px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EEF2FF';
                    e.currentTarget.style.color = '#4F46E5';
                    e.currentTarget.style.borderColor = '#C7D2FE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  <Sparkles size={10} color="#6366F1" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #F1F5F9',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '3px 6px 3px 12px',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Neha in English or हिंदी (e.g. check warranties)..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  color: '#1E293B',
                  outline: 'none',
                  padding: '7px 0',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: inputText.trim() ? '#4F46E5' : '#E2E8F0',
                  border: 'none',
                  color: inputText.trim() ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                title="Send Message"
              >
                <Send size={15} />
              </button>
              <button
                type="button"
                onClick={handleStartCall}
                style={{
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '10px',
                  backgroundColor: '#10B981',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0,
                }}
                title="Start Live Voice Call"
              >
                <Phone size={12} />
                <span>Call</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Floating trigger button rendered globally on dashboard
 */
export function FloatingVoiceButton({ onClick, isConnected }: { onClick: () => void; isConnected?: boolean }) {
  return (
    <button
      onClick={onClick}
      id="global-voice-assistant-trigger"
      aria-label="Open Realtime AI Voice Assistant"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        height: '50px',
        padding: '0 18px 0 8px',
        borderRadius: '25px',
        background: '#FFFFFF',
        color: '#0F172A',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        zIndex: 9998,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 14px 30px -3px rgba(0, 0, 0, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.12)';
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid #4F46E5',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
        }}
      >
        <img
          src="/neha-avatar.jpg"
          alt="Neha AI Concierge"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 800, fontSize: '13px', lineHeight: '1.2', color: '#0F172A' }}>Neha</div>
        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>AI Concierge</div>
      </div>
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          boxShadow: '0 0 8px #10B981',
          flexShrink: 0,
        }}
      />
    </button>
  );
}
