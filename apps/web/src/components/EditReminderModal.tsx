import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Pencil, X, Loader2 } from 'lucide-react';

interface EditReminderModalProps {
  reminder: any | null;
  isOpen: boolean;
  onClose: () => void;
  onReminderUpdated: (updatedRem: any) => void;
  assets: { id: string; name: string }[];
}

export const EditReminderModal: React.FC<EditReminderModalProps> = ({
  reminder: r,
  isOpen,
  onClose,
  onReminderUpdated,
  assets,
}) => {
  const [title, setTitle] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'maintenance' | 'warranty' | 'document' | 'general'>('maintenance');
  const [priority, setPriority] = useState<'urgent' | 'upcoming' | 'normal'>('normal');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (r) {
      setTitle(r.title || '');
      setSelectedAssetId(r.assetId || '');
      setDueDate(r.dueDate || '');
      setType(r.type || 'maintenance');
      setPriority(r.priority || 'normal');
      setNotes(r.notes || '');
      setErrorMessage(null);
    }
  }, [r]);

  if (!isOpen || !r) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Reminder title is required');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Due date is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const assetObj = assets.find((a) => a.id === selectedAssetId);

    const updatedData = {
      title: title.trim(),
      assetId: selectedAssetId || undefined,
      assetName: assetObj?.name || (selectedAssetId ? 'Household Asset' : 'General Reminder'),
      dueDate,
      type,
      priority,
      notes: notes.trim(),
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.UPDATE(r.id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error('Failed to update reminder');
      }

      const json = await res.json();
      onReminderUpdated(json.data || updatedData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update reminder');
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
          maxWidth: '560px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={18} color="#5C4EBA" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Edit Reminder</h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Modify reminder title, due date, category, or urgency
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Reminder Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              <option value="">-- General Reminder (No Asset) --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Reminder Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
              >
                <option value="maintenance">Maintenance</option>
                <option value="warranty">Warranty Expiry</option>
                <option value="document">Document Renewal</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Priority Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'urgent', label: 'Urgent' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: priority === p.id ? '2px solid #5C4EBA' : '1px solid #CBD5E1',
                    backgroundColor: priority === p.id ? '#EEF0FF' : '#FFFFFF',
                    color: priority === p.id ? '#5C4EBA' : '#475569',
                    fontWeight: priority === p.id ? '700' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
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
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
