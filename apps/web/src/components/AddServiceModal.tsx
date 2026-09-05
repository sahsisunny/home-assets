import React, { useState } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Wrench, X, Loader2 } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceAdded: () => void;
  assets: { id: string; name: string }[];
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onServiceAdded,
  assets,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [title, setTitle] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a service title (e.g. AC Filter Cleaning)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const assetObj = assets.find((a) => a.id === selectedAssetId);

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.CREATE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAssetId || (assets[0]?.id ?? 'asset_1'),
          assetName: assetObj?.name || 'Household Asset',
          title: title.trim(),
          serviceDate,
          cost: Number(cost) || 0,
          serviceProvider: serviceProvider.trim() || 'Authorized Technician',
          technicianNotes: technicianNotes.trim(),
          nextDueDate: nextDueDate || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save service record');
      }

      onServiceAdded();
      onClose();
      // Reset form
      setTitle('');
      setCost('');
      setServiceProvider('');
      setTechnicianNotes('');
      setNextDueDate('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while logging service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={18} color="#5C4EBA" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                Log Maintenance & Service
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Record appliance maintenance, repairs, technician costs & next schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}

          {/* Asset Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Select Asset
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Service / Maintenance Title *
            </label>
            <input
              type="text"
              placeholder="e.g. AC Deep Cleaning & Gas Refill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
              }}
              required
            />
          </div>

          {/* Cost & Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Service Cost (₹)
              </label>
              <input
                type="number"
                placeholder="1499"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Provider / Technician */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Service Provider / Technician
            </label>
            <input
              type="text"
              placeholder="e.g. Urban Company / LG Authorized Support"
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Technician Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Technician Notes / Work Done
            </label>
            <textarea
              placeholder="e.g. Replaced water filter candle and cleaned cooling coil."
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Next Due Date (Auto reminder) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Next Service Due Date (Auto-Schedules Reminder)
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#5C4EBA',
                color: '#FFFFFF',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>{isSubmitting ? 'Saving Service...' : 'Save Service Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
