'use client';

import React, { useState } from 'react';
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
  Eye,
  Maximize2,
  AlertCircle,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !doc) return null;

  const isInvoice = doc.type === 'invoice';
  const isWarranty = doc.type === 'warranty';
  const isPdf = doc.mimeType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');
  const isImage = !isPdf && (doc.mimeType?.startsWith('image/') || doc.fileName?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || !doc.mimeType);

  const fileUrl = buildApiUrl(doc.fileUrl || API_ENDPOINTS.DOCUMENTS.FILE(doc.id));
  const downloadUrl = buildApiUrl(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(doc.id));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isFullscreen ? '0px' : '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: isFullscreen ? '0px' : '24px',
          maxWidth: isFullscreen ? '100vw' : '820px',
          width: '100%',
          height: isFullscreen ? '100vh' : 'auto',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 26px',
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
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isInvoice ? '#ECFDF5' : '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isInvoice ? <Receipt size={22} color="#059669" /> : isWarranty ? <ShieldCheck size={22} color="#5C4EBA" /> : <FileText size={22} color="#5C4EBA" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>{doc.name}</h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: isInvoice ? '#ECFDF5' : '#EEF0FF',
                    color: isInvoice ? '#059669' : '#5C4EBA',
                    textTransform: 'uppercase',
                  }}
                >
                  {doc.type}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Asset: <strong>{doc.assetName || 'General Household'}</strong> • {doc.date || 'Recent'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Maximize2 size={15} />
            </button>
            <button
              onClick={() => onEdit(doc)}
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

        {/* Scrollable Content Body */}
        <div style={{ padding: '22px 26px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* PRIMARY DOCUMENT PREVIEW FRAME */}
          <div
            style={{
              backgroundColor: '#0F172A',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
              border: '1px solid #1E293B',
              position: 'relative',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Preview Toolbar */}
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: '#1E293B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>
                <Eye size={15} color="#818CF8" />
                <span>Live Document Preview</span>
                <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '400' }}>({doc.fileName || doc.name})</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#93C5FD',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <ExternalLink size={12} /> Open Full
                </a>
              </div>
            </div>

            {/* Document Render Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isPdf ? '0' : '16px', backgroundColor: '#0B1120', minHeight: '300px' }}>
              {isImage && !imageError ? (
                <div style={{ width: '100%', maxHeight: isFullscreen ? '70vh' : '440px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img
                    src={fileUrl}
                    alt={doc.name}
                    onError={() => setImageError(true)}
                    style={{
                      maxHeight: isFullscreen ? '70vh' : '440px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${fileUrl}#toolbar=1&view=FitH`}
                  title={doc.name}
                  style={{
                    width: '100%',
                    height: isFullscreen ? '70vh' : '420px',
                    border: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <ImageIcon size={48} color="#818CF8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9' }}>{doc.fileName || doc.name}</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', marginBottom: '16px' }}>
                    {doc.mimeType || 'Document'} • {doc.sizeFormatted || 'Stored in PostgreSQL'}
                  </p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#5C4EBA',
                      color: '#FFFFFF',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ExternalLink size={13} /> Open Image / Document File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Download Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
              <span>Format: <strong>{doc.mimeType || 'image/jpeg'}</strong></span>
              <span>•</span>
              <span>Size: <strong>{doc.sizeFormatted || 'Saved in PostgreSQL'}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
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
                <ExternalLink size={14} /> Open in New Tab
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
                <Download size={14} /> Download File
              </a>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FD', borderBottom: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> Document Information
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
                <span style={{ color: '#64748B' }}>File Name:</span>
                <span style={{ fontWeight: '600', color: '#1E293B' }}>{doc.fileName || doc.name}</span>
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
            padding: '14px 26px',
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
