import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Pencil, X, Loader2 } from 'lucide-react';

interface EditServiceModalProps {
  service: any | null;
  isOpen: boolean;
  onClose: () => void;
  onServiceUpdated: (updatedSrv: any) => void;
  assets: { id: string; name: string }[];
}

export const EditServiceModal: React.FC<EditServiceModalProps> = ({
  service: srv,
  isOpen,
  onClose,
  onServiceUpdated,
  assets,
}) => {
  const [title, setTitle] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [cost, setCost] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (srv) {
      setTitle(srv.title || '');
      setSelectedAssetId(srv.assetId || '');
      setServiceDate(srv.serviceDate || '');
      setCost(srv.cost !== undefined ? String(srv.cost) : '');
      setServiceProvider(srv.serviceProvider || '');
      setTechnicianNotes(srv.technicianNotes || '');
      setNextDueDate(srv.nextDueDate || '');
      setErrorMessage(null);
    }
  }, [srv]);

  if (!isOpen || !srv) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Service title is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const assetObj = assets.find((a) => a.id === selectedAssetId);

    const updatedData = {
      title: title.trim(),
      assetId: selectedAssetId || srv.assetId,
      assetName: assetObj?.name || srv.assetName,
      serviceDate,
      cost: Number(cost) || 0,
      serviceProvider: serviceProvider.trim(),
      technicianNotes: technicianNotes.trim(),
      nextDueDate: nextDueDate || undefined,
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.UPDATE(srv.id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error('Failed to update service record');
      }

      const json = await res.json();
      onServiceUpdated(json.data || updatedData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update service record');
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
            backgroundColor: '#FFFBEB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={18} color="#B45309" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#B45309' }}>Edit Service Record</h2>
              <p style={{ fontSize: '13px', color: '#D97706', marginTop: '2px' }}>
                Update service details, cost, dates, or technician notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#B45309',
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
              Service Title *
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
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Service Cost (₹)
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Service Date
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Service Provider / Technician
            </label>
            <input
              type="text"
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Technician Notes / Work Done
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Next Due Date (Auto-Schedules Reminder)
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
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
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '14px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
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
