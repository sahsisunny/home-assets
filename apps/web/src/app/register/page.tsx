'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function WebRegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long with uppercase, number & symbol.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await register({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      agreeToTerms: agreeTerms,
    });

    setIsLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Failed to create account.');
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setSocialLoading(provider);
    setErrorMessage(null);

    const socialEmail = provider === 'google' ? 'google.user@example.com' : 'apple.user@example.com';
    const res = await login(socialEmail, 'SocialLogin@2026');
    setSocialLoading(null);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || `Could not sign up with ${provider}.`);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Column Hero */}
      <div className="auth-hero-col">
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
            }}
          >
            <Home size={22} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800' }}>Home Asset Manager</span>
        </div>

        <div style={{ maxWidth: '440px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.3', marginBottom: '16px' }}>
            Start tracking all your household assets in seconds.
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.9, lineHeight: '1.6' }}>
            Create an account to scan receipts, automatically extract warranty dates, and share asset records with family members.
          </p>
        </div>

        <div style={{ fontSize: '13px', opacity: 0.75 }}>
          © 2026 Home Asset Manager • India First
        </div>
      </div>

      {/* Right Column Form */}
      <div className="auth-form-col" style={{ overflowY: 'auto' }}>
        <div className="auth-card-box" style={{ maxWidth: '480px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>Create Account</h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
              Let's get started with your home asset portfolio
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
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Social Sign up */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => handleSocialAuth('google')}
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
                cursor: socialLoading || isLoading ? 'not-allowed' : 'pointer',
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
              margin: '18px 0',
              color: '#94A3B8',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ padding: '0 12px' }}>or register with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                style={{
                  width: '100%',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#F8F9FD',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                style={{
                  width: '100%',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#F8F9FD',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Mobile Number
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '12px 14px', backgroundColor: '#F1F5F9', borderRadius: '12px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={{
                    flex: 1,
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#F8F9FD',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={{
                    width: '100%',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#F8F9FD',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Confirm
                </label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={{
                    width: '100%',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#F8F9FD',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the Terms of Service & Privacy Policy</span>
            </label>

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
                marginTop: '12px',
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
              <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#5C4EBA', fontWeight: '700', textDecoration: 'none' }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
