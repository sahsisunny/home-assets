import React, { useState } from 'react';
import { DOCUMENT_TYPES, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import {
  X,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  BookOpen,
  FileText,
  Wrench,
  Paperclip,
  Upload,
  Loader2,
} from 'lucide-react';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: (newDoc: any) => void;
  assets?: Array<{ id: string; name: string }>;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentAdded,
  assets = [],
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [docType, setDocType] = useState('invoice');
  const [docTitle, setDocTitle] = useState('Tax Invoice & Bill');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileAttached, setFileAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setFileAttached(true);
      if (!docTitle || docTitle === 'Tax Invoice & Bill') {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!docTitle.trim()) {
      setErrorMessage('Please provide a document title.');
      return;
    }

    if (!fileName) {
      setErrorMessage('Please attach a document file (PDF, PNG, or JPG).');
      return;
    }

    setIsSubmitting(true);
    const selectedAsset = assets.find((a) => a.id === selectedAssetId);

    const newDoc = {
      id: `doc_${Date.now()}`,
      assetId: selectedAssetId || undefined,
      assetName: selectedAsset?.name || 'General Document',
      type: docType,
      name: docTitle,
      fileName: fileName,
      mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      fileSizeBytes: 1024 * 1024 * 1.2,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.CREATE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to save document on server');
      }

      setIsSubmitting(false);
      onDocumentAdded(newDoc);
      onClose();
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Unable to save document. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
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
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>Add Document</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Upload and link invoices, warranties, and user manuals to your assets
            </p>
          </div>
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

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              margin: '16px 28px 0',
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#DC2626',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} /> {errorMessage}
            </span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Form */}
        <form onSubmit={handleSave} style={{ padding: '20px 28px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Linked Asset */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Select Linked Asset
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              style={{
                width: '100%',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="">-- General Document (No Asset) --</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Document Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {DOCUMENT_TYPES.map((type) => {
                const isSelected = docType === type.id;
                const renderTypeIcon = () => {
                  const size = 18;
                  switch (type.id) {
                    case 'invoice': return <Receipt size={size} />;
                    case 'warranty': return <ShieldCheck size={size} />;
                    case 'manual': return <BookOpen size={size} />;
                    case 'insurance': return <FileText size={size} />;
                    case 'service': return <Wrench size={size} />;
                    default: return <FileText size={size} />;
                  }
                };

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setDocType(type.id);
                      if (!docTitle || docTitle.includes('Invoice') || docTitle.includes('Warranty') || docTitle.includes('Manual')) {
                        setDocTitle(`${type.label}`);
                      }
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #5C4EBA' : '1.5px solid #E2E8F0',
                      backgroundColor: isSelected ? '#EEF0FF' : '#FFFFFF',
                      color: isSelected ? '#5C4EBA' : '#475569',
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {renderTypeIcon()}
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Title */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Document Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Official Purchase Invoice / Extended Warranty"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
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

          {/* File Upload Box */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Attach File (PDF, Image) *
            </label>
            <div
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#F8F9FD',
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <Upload size={26} color="#5C4EBA" />
              </div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                Drag & drop or Click to browse
              </p>
              <p style={{ fontSize: '11px', color: '#64748B' }}>Supports PDF, JPG, PNG up to 10MB</p>
            </div>

            {fileAttached && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} color="#5C4EBA" />
                  <span style={{ fontWeight: '600', color: '#1E293B' }}>{fileName}</span>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>({fileSize})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileAttached(false);
                    setFileName('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Registered with manufacturer for 2-year complimentary warranty extension"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#5C4EBA',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(92, 78, 186, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.75 : 1,
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>{isSubmitting ? 'Saving Document...' : 'Save Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
