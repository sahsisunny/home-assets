'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function WebForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        router.push('/reset-password');
      }, 1500);
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F9FD',
        padding: '24px',
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
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '36px',
            backgroundColor: '#EEF0FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={32} color="#5C4EBA" />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
          Forgot Password?
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '28px' }}>
          Enter your email or mobile number and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              color: '#059669',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={18} color="#059669" /> Reset link sent! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                placeholder="Email or Mobile Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: '#5C4EBA',
                color: '#FFFFFF',
                border: 'none',
                height: '50px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
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
              <span>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#5C4EBA', fontWeight: '700', textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
