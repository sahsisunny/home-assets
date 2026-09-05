import React, { useState } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Bell, X, Loader2 } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderAdded: () => void;
  assets: { id: string; name: string }[];
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onReminderAdded,
  assets,
}) => {
  const [title, setTitle] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [type, setType] = useState<'maintenance' | 'warranty' | 'document' | 'general'>('maintenance');
  const [priority, setPriority] = useState<'urgent' | 'upcoming' | 'normal'>('upcoming');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a reminder title');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Please select a due date');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const assetObj = assets.find((a) => a.id === selectedAssetId);

    const payload = {
      title: title.trim(),
      assetId: selectedAssetId || undefined,
      assetName: assetObj?.name || (selectedAssetId ? 'Household Asset' : 'General Reminder'),
      dueDate,
      type,
      priority,
      notes: notes.trim(),
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.CREATE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create reminder');
      }

      onReminderAdded();
      onClose();
      // Reset form
      setTitle('');
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to schedule reminder');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="#5C4EBA" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Add Reminder</h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Schedule maintenance, warranty expiration, or renewal notifications
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
              placeholder="e.g. Water Purifier Filter Change / TV Warranty Expiry"
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
              <option value="">-- General Reminder (No Specific Asset) --</option>
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
                Category / Type
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
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Schedule technician appointment 2 days in advance"
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
              <span>{isSubmitting ? 'Scheduling...' : 'Set Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
