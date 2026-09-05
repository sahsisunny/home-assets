'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

export default function WebResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/login');
      }, 700);
    }
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
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
          Create New Password
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
          Your new password must be different from previous used passwords.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Dynamic Criteria List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Check size={14} color={hasMinLength ? '#10B981' : '#94A3B8'} strokeWidth={3} />
              <span style={{ color: hasMinLength ? '#1E293B' : '#64748B' }}>At least 8 characters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Check size={14} color={hasUppercase ? '#10B981' : '#94A3B8'} strokeWidth={3} />
              <span style={{ color: hasUppercase ? '#1E293B' : '#64748B' }}>One uppercase letter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Check size={14} color={hasNumber ? '#10B981' : '#94A3B8'} strokeWidth={3} />
              <span style={{ color: hasNumber ? '#1E293B' : '#64748B' }}>One number</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Check size={14} color={hasSpecial ? '#10B981' : '#94A3B8'} strokeWidth={3} />
              <span style={{ color: hasSpecial ? '#1E293B' : '#64748B' }}>One special character</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            style={{
              backgroundColor: isValid && !isLoading ? '#5C4EBA' : '#CBD5E1',
              color: '#FFFFFF',
              border: 'none',
              height: '50px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: isValid && !isLoading ? '0 4px 14px rgba(92, 78, 186, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            <span>{isLoading ? 'Resetting Password...' : 'Reset Password'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link href="/login" style={{ color: '#5C4EBA', fontWeight: '700', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
