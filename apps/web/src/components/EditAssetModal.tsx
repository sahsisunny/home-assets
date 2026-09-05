import React, { useState, useEffect } from 'react';
import { ASSET_CATEGORIES, ASSET_LOCATIONS, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { Pencil, X, Loader2 } from 'lucide-react';

interface EditAssetModalProps {
  asset: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated: (updatedAsset: any) => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  asset,
  isOpen,
  onClose,
  onAssetUpdated,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [seller, setSeller] = useState('');
  const [location, setLocation] = useState('Living Room');
  const [ownership, setOwnership] = useState('Me');
  const [warrantyProvider, setWarrantyProvider] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setCategoryId(asset.categoryId || asset.category || 'electronics');
      setBrand(asset.brand || '');
      setModel(asset.model || '');
      setSerialNumber(asset.serialNumber || '');
      setPurchasePrice(asset.purchasePrice ? String(asset.purchasePrice) : asset.price ? String(asset.price) : '');
      setPurchaseDate(asset.purchaseDate || '');
      setSeller(asset.seller || '');
      setLocation(asset.location || 'Living Room');
      setOwnership(asset.ownership || 'Me');
      setWarrantyProvider(asset.warranty?.provider || '');
      setWarrantyEndDate(asset.warranty?.endDate || '');
      setNotes(asset.notes || '');
      setErrorMessage(null);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Asset name is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updatedData = {
      name: name.trim(),
      categoryId,
      category: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchasePrice: parseFloat(purchasePrice) || 0,
      price: parseFloat(purchasePrice) || 0,
      currentValue: parseFloat(purchasePrice) || 0,
      purchaseDate,
      seller: seller.trim(),
      location,
      ownership,
      notes: notes.trim(),
      warranty: warrantyEndDate
        ? {
            provider: warrantyProvider.trim() || `${brand || 'Brand'} Warranty`,
            endDate: warrantyEndDate,
            status: 'active',
            validLabel: 'Warranty Active',
          }
        : asset.warranty,
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.UPDATE(asset.id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error('Failed to update asset');
      }

      const json = await res.json();
      onAssetUpdated(json.data || updatedData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update asset');
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
          maxWidth: '680px',
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
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Edit Asset</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Update asset specifications, prices, location, and warranty
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Asset Name *
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
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Model Code
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Purchase Price (₹)
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Seller / Store
              </label>
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Location / Room
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
              >
                {ASSET_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Owner / Belongs To
              </label>
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}
              >
                {['Me', 'Spouse', 'Parent', 'Child', 'Shared', 'Other'].map((owner) => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Warranty Provider
              </label>
              <input
                type="text"
                placeholder="e.g. Sony Official"
                value={warrantyProvider}
                onChange={(e) => setWarrantyProvider(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Warranty Expiry Date
              </label>
              <input
                type="date"
                value={warrantyEndDate}
                onChange={(e) => setWarrantyEndDate(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Notes / Custom Details
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
