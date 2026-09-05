import React, { useState } from 'react';
import { ASSET_CATEGORIES, ASSET_LOCATIONS, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import {
  X,
  Camera,
  Pencil,
  Receipt,
  Upload,
  Paperclip,
  AlertTriangle,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetAdded: (newAsset: any) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAssetAdded }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [seller, setSeller] = useState('');
  const [location, setLocation] = useState('Living Room');
  const [ownership, setOwnership] = useState('Me');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [notes, setNotes] = useState('');

  const [invoiceFile, setInvoiceFile] = useState<{ fileName: string; fileSizeBytes?: number; mimeType?: string; fileUrl?: string } | null>(null);

  if (!isOpen) return null;

  const processImageWithGemini = async (base64Data: string, mimeType = 'image/jpeg', fileName = 'invoice_scan.jpg') => {
    setIsScanning(true);
    setScanError(null);
    setScanStep(0);
    setInvoiceFile({
      fileName,
      mimeType,
      fileSizeBytes: Math.round((base64Data.length * 3) / 4),
      fileUrl: base64Data.startsWith('data:') ? base64Data : `data:${mimeType};base64,${base64Data}`,
    });

    const stepInterval = setInterval(() => {
      setScanStep((s) => (s < 3 ? s + 1 : s));
    }, 600);

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.INVOICES.PROCESS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      const data = await res.json();
      clearInterval(stepInterval);
      setIsScanning(false);

      if (!res.ok || !data.success) {
        throw new Error('Scan failed');
      }

      if (data?.data?.primaryItem) {
        const item = data.data.primaryItem;
        setName(item.productName || '');
        setCategory(item.category || 'electronics');
        setBrand(item.brand || '');
        setModel(item.model || '');
        setSerialNumber(item.serialNumber || '');
        setPurchasePrice(item.totalPrice ? String(item.totalPrice) : '');
        setSeller(data.data.seller || '');
        setPurchaseDate(data.data.invoiceDate || new Date().toISOString().split('T')[0]);
        setWarrantyMonths(item.warrantyMonths ? String(item.warrantyMonths) : '12');

        const fullDescription = item.description
          ? `${item.description}${item.notes ? ` • ${item.notes}` : ''}`
          : item.notes || '';
        setNotes(fullDescription);
      }
    } catch {
      clearInterval(stepInterval);
      setIsScanning(false);
      setScanError('Unable to scan invoice. Please try uploading a clearer image or enter details manually.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        processImageWithGemini(base64String, file.type || 'image/jpeg', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setInvoiceFile({
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!name.trim()) {
      setSaveError('Please enter an asset name.');
      return;
    }

    setIsSaving(true);

    const months = parseInt(warrantyMonths, 10) || 12;
    const endWarrantyDate = new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newAsset = {
      name: name.trim(),
      categoryId: category,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate,
      price: parseFloat(purchasePrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      currentValue: parseFloat(purchasePrice) || 0,
      seller: seller.trim(),
      location,
      ownership,
      notes: notes.trim(),
      status: 'active',
      warranty: {
        provider: seller || brand ? `${brand || seller} Warranty` : 'Brand Warranty',
        durationMonths: months,
        startDate: purchaseDate,
        endDate: endWarrantyDate,
        status: 'active',
        validLabel: `${months} Months Warranty`,
      },
      invoice: {
        name: `${name.trim()} Purchase Invoice & Bill`,
        fileName: invoiceFile?.fileName || `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_invoice.pdf`,
        fileSizeBytes: invoiceFile?.fileSizeBytes || 1024 * 1024 * 1.4,
        mimeType: invoiceFile?.mimeType || 'application/pdf',
        fileUrl: invoiceFile?.fileUrl || 'https://example.com/docs/invoice.pdf',
        date: purchaseDate,
        notes: `Purchase bill from ${seller || 'Authorized Store'} for ₹${purchasePrice || 0}`,
      },
    };


    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.CREATE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });

      if (!res.ok) {
        throw new Error('Save failed');
      }

      const json = await res.json();
      setIsSaving(false);
      onAssetAdded(json.data || newAsset);
      onClose();
    } catch {
      setIsSaving(false);
      setSaveError('Unable to save asset. Please try again.');
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
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>Add Asset</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Upload invoice receipt or enter asset details manually
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 28px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'scan' ? '800' : '600',
              color: activeTab === 'scan' ? '#5C4EBA' : '#64748B',
              borderBottom: activeTab === 'scan' ? '2.5px solid #5C4EBA' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Camera size={16} /> AI Invoice Scanner
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'manual' ? '800' : '600',
              color: activeTab === 'manual' ? '#5C4EBA' : '#64748B',
              borderBottom: activeTab === 'manual' ? '2.5px solid #5C4EBA' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Pencil size={15} /> Manual Details
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'scan' && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '18px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#F8F9FD',
                  position: 'relative',
                }}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Receipt size={36} color="#5C4EBA" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                  Upload Receipt or Invoice
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
                  AI will automatically extract product, brand, prices, and warranty
                </p>

                <label
                  style={{
                    backgroundColor: '#5C4EBA',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(92, 78, 186, 0.25)',
                    position: 'relative',
                    zIndex: 3,
                  }}
                >
                  <Upload size={14} /> Choose File
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {uploadedFileName && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 14px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Paperclip size={13} color="#5C4EBA" /> Selected: <strong>{uploadedFileName}</strong>
                </div>
              )}

              {isScanning && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px 18px',
                    backgroundColor: '#EEF0FF',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#5C4EBA',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span>
                    {scanStep === 0 && 'Reading document...'}
                    {scanStep === 1 && 'Analyzing with AI...'}
                    {scanStep === 2 && 'Extracting details...'}
                    {scanStep >= 3 && 'Finishing up...'}
                  </span>
                </div>
              )}

              {scanError && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    backgroundColor: '#FEE2E2',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#991B1B',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} /> {scanError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setScanError(null)}
                    style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {saveError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#991B1B',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} /> {saveError}
                </span>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Asset Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony Bravia 65 4K TV"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Brand
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Model Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. KD-65X82L"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN98213890"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Purchase Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="74990"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Seller / Store
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Digital"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Room / Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
                  {ASSET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Owner / Belongs To
                </label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value)}
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
                  {['Me', 'Spouse', 'Parent', 'Child', 'Shared', 'Other'].map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Warranty (Months)
                </label>
                <input
                  type="number"
                  placeholder="12"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Technical Description & Notes (AI Extracted / Custom)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 4K Ultra HD, Dolby Atmos, OLED panel, 2-Year Warranty extension"
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

            {/* Attached Invoice / Receipt upload */}
            <div style={{ backgroundColor: '#F8F9FD', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                    <Receipt size={14} color="#5C4EBA" /> Attach Purchase Invoice / Receipt
                  </label>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>
                    {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Automatically saved to Documents & Linked to this asset in DB'}
                  </p>
                </div>
                <label
                  style={{
                    backgroundColor: '#EEF0FF',
                    color: '#5C4EBA',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-block',
                  }}
                >
                  {uploadedFileName ? 'Change File' : 'Browse File'}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleManualInvoiceUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
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
                <span>{isSaving ? 'Saving Asset...' : 'Save Asset'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
