'use client';

import React from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import {
  Receipt,
  ShieldCheck,
  FileText,
  Pencil,
  Trash2,
  X,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface ViewDocumentModalProps {
  document: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (doc: any) => void;
  onDelete: (docId: string) => void;
}

export const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !doc) return null;

  const isInvoice = doc.type === 'invoice';
  const isWarranty = doc.type === 'warranty';
  const isImage = doc.mimeType?.startsWith('image/') || doc.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  const fileUrl = doc.fileUrl && !doc.fileUrl.includes('example.com') && !doc.fileUrl.includes('placehold.co')
    ? (doc.fileUrl.startsWith('http') ? doc.fileUrl : buildApiUrl(doc.fileUrl))
    : buildApiUrl(API_ENDPOINTS.DOCUMENTS.FILE(doc.id));

  const downloadUrl = buildApiUrl(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(doc.id));

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
            backgroundColor: '#F8F9FD',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: isInvoice ? '#ECFDF5' : '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isInvoice ? <Receipt size={24} color="#059669" /> : isWarranty ? <ShieldCheck size={24} color="#5C4EBA" /> : <FileText size={24} color="#5C4EBA" />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>{doc.name}</h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Linked to: <strong>{doc.assetName || 'General Household'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onEdit(doc);
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
                if (confirm(`Are you sure you want to delete document "${doc.name}"?`)) {
                  onDelete(doc.id);
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
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#64748B',
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
          {/* File Card Preview */}
          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#F8F9FD',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              {isImage ? <ImageIcon size={38} color="#5C4EBA" /> : <FileText size={38} color="#5C4EBA" />}
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{doc.fileName || doc.name || 'document.pdf'}</h4>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              {doc.sizeFormatted || 'Document File'} • {doc.mimeType || 'application/pdf'} • Uploaded {doc.date || 'Recently'}
            </p>

            {/* Live Image Preview if Image Document */}
            {isImage && (
              <div style={{ marginTop: '14px', maxHeight: '180px', overflow: 'hidden', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
                <img
                  src={fileUrl}
                  alt={doc.name}
                  style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#5C4EBA',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ExternalLink size={14} /> Open / View File
              </a>
              <a
                href={downloadUrl}
                download={doc.fileName || doc.name}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#EEF0FF',
                  color: '#5C4EBA',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FD', borderBottom: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> Document Metadata
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Document Type:</span>
                <span style={{ fontWeight: '700', color: '#5C4EBA', textTransform: 'uppercase' }}>{doc.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Linked Asset:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{doc.assetName || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>File Format:</span>
                <span style={{ fontWeight: '600', color: '#1E293B' }}>{doc.mimeType || 'application/pdf'}</span>
              </div>
              {doc.notes && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Notes:</span>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{doc.notes}</p>
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
