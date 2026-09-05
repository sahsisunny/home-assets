import React, { useState, useEffect } from 'react';
import { DOCUMENT_TYPES, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Pencil, X, Loader2 } from 'lucide-react';

interface EditDocumentModalProps {
  document: any | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: (updatedDoc: any) => void;
  assets: { id: string; name: string }[];
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onDocumentUpdated,
  assets,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('invoice');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setName(doc.name || '');
      setType(doc.type || 'invoice');
      setSelectedAssetId(doc.assetId || '');
      setFileName(doc.fileName || '');
      setNotes(doc.notes || '');
      setErrorMessage(null);
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Document title is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const assetObj = assets.find((a) => a.id === selectedAssetId);

    const updatedData = {
      name: name.trim(),
      type,
      assetId: selectedAssetId || undefined,
      assetName: assetObj?.name || (selectedAssetId ? 'Household Asset' : 'General Document'),
      fileName: fileName.trim() || doc.fileName,
      notes: notes.trim(),
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.UPDATE(doc.id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error('Failed to update document');
      }

      const json = await res.json();
      onDocumentUpdated(json.data || updatedData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update document');
    } finally {
      setIsSaving(false);
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
            backgroundColor: '#F8F9FD',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pencil size={18} color="#5C4EBA" />
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Edit Document</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Update document title, linked asset, or file notes
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Document Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Linked Asset
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
            >
              <option value="">-- General Document (No Asset) --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Document Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
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
              disabled={isSaving}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#5C4EBA',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '14px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(92, 78, 186, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSaving ? 0.75 : 1,
              }}
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
