'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function WebLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Failed to log in. Please check your credentials.');
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setSocialLoading(provider);
    setErrorMessage(null);

    // Provide a dynamic social login
    const socialEmail = provider === 'google' ? 'google.user@example.com' : 'apple.user@example.com';
    const res = await login(socialEmail, 'SocialLogin@2026');
    setSocialLoading(null);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || `Could not sign in with ${provider}.`);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#F8F9FD',
      }}
    >
      {/* Left Column: Brand Hero Banner (Desktop) */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#5C4EBA',
          color: '#FFFFFF',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Home size={22} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Home Asset Manager
          </span>
        </div>

        <div style={{ maxWidth: '440px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '20px',
            }}
          >
            <Shield size={14} /> Always Protected • Smart AI Tracking
          </div>
          <h1
            style={{
              fontSize: '38px',
              fontWeight: '800',
              lineHeight: '1.25',
              marginBottom: '16px',
            }}
          >
            Know what you own. Know what's covered.
          </h1>
          <p
            style={{
              fontSize: '16px',
              opacity: 0.9,
              lineHeight: '1.6',
            }}
          >
            One centralized platform for all your home appliances, electronics, warranty certificates, invoices, and routine maintenance schedules.
          </p>

          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 20px',
                borderRadius: '16px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '800' }}>AI OCR</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Instant Invoices</div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 20px',
                borderRadius: '16px',
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '800' }}>Multi-User</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Family Household</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '13px', opacity: 0.75 }}>
          © 2026 Home Asset Manager. Privacy First & Encrypted.
        </div>
      </div>

      {/* Right Column: Auth Form Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>Log In</h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
              Welcome back! Enter your credentials to access your home assets.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Social Logins */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={!!socialLoading || isLoading}
              type="button"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                height: '46px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                color: '#1E293B',
                cursor: socialLoading || isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: socialLoading === 'google' ? 0.7 : 1,
              }}
            >
              {socialLoading === 'google' ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              ) : (
                <span style={{ color: '#4285F4', fontWeight: '900', fontSize: '16px' }}>G</span>
              )}
              <span>Google</span>
            </button>

            <button
              onClick={() => handleSocialAuth('apple')}
              disabled={!!socialLoading || isLoading}
              type="button"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '46px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                color: '#1E293B',
                cursor: socialLoading || isLoading ? 'not-allowed' : 'pointer',
                opacity: socialLoading === 'apple' ? 0.7 : 1,
              }}
            >
              {socialLoading === 'apple' ? (
                <Loader2 size={16} className="animate-spin text-slate-800" />
              ) : (
                <span style={{ fontSize: '18px' }}></span>
              )}
              <span>Apple</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              color: '#94A3B8',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ padding: '0 12px' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Email or Mobile Number
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '0 14px',
                  backgroundColor: '#F8F9FD',
                  height: '48px',
                }}
              >
                <Mail size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="name@example.com or 98765 43210"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#1E293B',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '13px', color: '#5C4EBA', fontWeight: '600', textDecoration: 'none' }}
                >
                  Forgot Password?
                </Link>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '0 14px',
                  backgroundColor: '#F8F9FD',
                  height: '48px',
                }}
              >
                <Lock size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#1E293B',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!socialLoading}
              style={{
                backgroundColor: '#5C4EBA',
                color: '#FFFFFF',
                border: 'none',
                height: '50px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                marginTop: '10px',
                boxShadow: '0 4px 14px rgba(92, 78, 186, 0.3)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '28px',
              fontSize: '14px',
              color: '#64748B',
            }}
          >
            Don't have an account?{' '}
            <Link
              href="/register"
              style={{ color: '#5C4EBA', fontWeight: '700', textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
