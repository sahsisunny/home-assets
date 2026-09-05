'use client';

import React from 'react';
import { formatINR } from '@home-assets/tokens';
import { Wrench, Pencil, Trash2, X } from 'lucide-react';

interface ViewServiceModalProps {
  service: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (service: any) => void;
  onDelete: (serviceId: string) => void;
}

export const ViewServiceModal: React.FC<ViewServiceModalProps> = ({
  service: srv,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !srv) return null;

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
          maxWidth: '600px',
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
            backgroundColor: '#FFFBEB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={24} color="#D97706" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#B45309' }}>{srv.title}</h2>
              <p style={{ fontSize: '12px', color: '#D97706', marginTop: '2px' }}>
                Asset: <strong>{srv.assetName || 'Household Asset'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onEdit(srv);
              }}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#D97706',
                border: '1px solid #FDE68A',
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
                if (confirm(`Are you sure you want to delete service record "${srv.title}"?`)) {
                  onDelete(srv.id);
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
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '16px', borderRadius: '14px' }}>
              <p style={{ fontSize: '11px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>Service Cost</p>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {formatINR(srv.cost || 0)}
              </h3>
            </div>

            <div style={{ backgroundColor: '#F8F9FD', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '14px' }}>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Service Date</p>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {srv.serviceDate || 'Recent'}
              </h3>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FD', borderBottom: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Service & Technician Information
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Provider / Agency:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{srv.serviceProvider || 'Authorized Service'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Next Scheduled Due:</span>
                <span style={{ fontWeight: '700', color: srv.nextDueDate ? '#5C4EBA' : '#94A3B8' }}>
                  {srv.nextDueDate || 'None scheduled'}
                </span>
              </div>
              {srv.technicianNotes && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Work Done / Technician Notes:</span>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{srv.technicianNotes}</p>
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
