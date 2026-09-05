'use client';

import React from 'react';

import { ShieldCheck, Clock, Pencil, Trash2, X, Check } from 'lucide-react';

interface ViewReminderModalProps {
  reminder: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (rem: any) => void;
  onDelete: (remId: string) => void;
  onAction: (id: string, action: 'complete' | 'snooze') => void;
}

export const ViewReminderModal: React.FC<ViewReminderModalProps> = ({
  reminder: r,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAction,
}) => {
  if (!isOpen || !r) return null;

  const isCompleted = r.status === 'completed';
  const isWarranty = r.type === 'warranty';

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
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8F9FD',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isWarranty ? <ShieldCheck size={20} color="#5C4EBA" /> : <Clock size={20} color="#5C4EBA" />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>{r.title}</h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Asset: <strong>{r.assetName || 'General Household'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onEdit(r);
              }}
              style={{
                backgroundColor: '#EEF0FF',
                color: '#5C4EBA',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete reminder "${r.title}"?`)) {
                  onDelete(r.id);
                  onClose();
                }
              }}
              style={{
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={15} />
            </button>
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
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status Alert */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: isCompleted ? '#ECFDF5' : '#FFFBEB',
              border: `1px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: isCompleted ? '#065F46' : '#B45309' }}>
                {isCompleted ? 'Completed' : r.daysLabel || 'Pending Action'}
              </h4>
              <p style={{ fontSize: '12px', color: isCompleted ? '#047857' : '#D97706', marginTop: '2px' }}>
                Due Date: {r.dueDate}
              </p>
            </div>

            {!isCompleted && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onAction(r.id, 'snooze');
                    onClose();
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Clock size={13} /> Snooze 7d
                </button>
                <button
                  onClick={() => {
                    onAction(r.id, 'complete');
                    onClose();
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Check size={14} /> Complete
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FD', borderBottom: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Reminder Information
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Category / Type:</span>
                <span style={{ fontWeight: '700', color: '#5C4EBA', textTransform: 'capitalize' }}>{r.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Priority Level:</span>
                <span style={{ fontWeight: '700', color: r.priority === 'urgent' ? '#DC2626' : '#1E293B', textTransform: 'capitalize' }}>
                  {r.priority || 'Normal'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Current Status:</span>
                <span style={{ fontWeight: '700', color: isCompleted ? '#059669' : '#D97706', textTransform: 'capitalize' }}>
                  {r.status}
                </span>
              </div>
              {r.notes && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Notes:</span>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{r.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#F8F9FD',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
