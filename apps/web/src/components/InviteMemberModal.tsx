import React, { useState } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Users, X, AlertTriangle, Loader2 } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberInvited,
}) => {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !emailOrPhone.trim()) {
      setError('Please provide a name and email/phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.INVITE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          emailOrPhone: emailOrPhone.trim(),
          role,
        }),
      });

      if (res.ok) {
        setName('');
        setEmailOrPhone('');
        setRole('Member');
        onMemberInvited();
        onClose();
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to invite household member.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8F9FD',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} color="#5C4EBA" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                Invite Family Member
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                Share access to home assets, documents & warranties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#991B1B',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} color="#DC2626" /> {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Family Member Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Email or Mobile Number *
            </label>
            <input
              type="text"
              placeholder="e.g. member@example.com or 9876543210"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              style={{
                width: '100%',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Household Role *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'Admin', title: 'Admin', desc: 'Can add, edit & delete assets, invoices and services' },
                { id: 'Member', title: 'Member (Recommended)', desc: 'Can view assets, log service requests and add items' },
                { id: 'Viewer', title: 'Viewer', desc: 'Read-only access to view warranties, invoices and details' },
              ].map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: role === r.id ? '1.5px solid #5C4EBA' : '1px solid #E2E8F0',
                    backgroundColor: role === r.id ? '#EEF0FF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="householdRole"
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => setRole(r.id as any)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: role === r.id ? '#5C4EBA' : '#1E293B' }}>{r.title}</p>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#5C4EBA',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                color: '#FFFFFF',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <span>{isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
