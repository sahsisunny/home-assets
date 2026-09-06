'use client';

import React, { useState, useEffect } from 'react';
import { formatINR, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import {
  Sparkles,
  Tv,
  Armchair,
  Car,
  Wrench,
  Box,
  Pencil,
  Trash2,
  X,
  BarChart3,
  FileText,
  ShieldCheck,
  Check,
  Zap,
  Receipt,
  Plus,
  Eye,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ViewAssetModalProps {
  assetId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: any) => void;
  onDelete: (assetId: string) => void;
  onAddDocument: (assetId: string) => void;
  onLogService: (assetId: string) => void;
  onViewDocument?: (doc: any) => void;
}

export const ViewAssetModal: React.FC<ViewAssetModalProps> = ({
  assetId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddDocument,
  onLogService,
  onViewDocument,
}) => {
  const [asset, setAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'documents' | 'services'>('overview');

  const fetchAssetDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DETAILS(id)));
      if (res.ok) {
        const json = await res.json();
        setAsset(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch asset details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assetId) {
      fetchAssetDetails(assetId);
    } else {
      setAsset(null);
    }
  }, [isOpen, assetId]);

  if (!isOpen || !assetId) return null;

  const renderCategoryIcon = (cat: string) => {
    const size = 22;
    const color = '#5C4EBA';
    switch (cat?.toLowerCase()) {
      case 'appliances': return <Sparkles size={size} color={color} />;
      case 'electronics': return <Tv size={size} color={color} />;
      case 'furniture': return <Armchair size={size} color={color} />;
      case 'vehicles': return <Car size={size} color={color} />;
      case 'equipment': return <Wrench size={size} color={color} />;
      default: return <Box size={size} color={color} />;
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
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8F9FD',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderCategoryIcon(asset?.categoryId || asset?.category)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>
                  {loading ? 'Loading Asset...' : asset?.name || 'Asset Details'}
                </h2>
                <span
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Active
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                {asset?.brand ? `${asset.brand} ` : ''}
                {asset?.model ? `(${asset.model}) • ` : ''}
                {asset?.location || 'Home'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {asset && (
              <>
                <button
                  onClick={() => {
                    onEdit(asset);
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
                    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
                      onDelete(asset.id);
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
              </>
            )}
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

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 28px', backgroundColor: '#FFFFFF' }}>
          {[
            { id: 'overview', label: 'Overview & Warranty', icon: BarChart3 },
            { id: 'documents', label: `Documents & Invoices (${asset?.documents?.length || 0})`, icon: FileText },
            { id: 'services', label: `Maintenance (${asset?.services?.length || 0})`, icon: Wrench },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  padding: '14px 18px',
                  border: 'none',
                  background: 'none',
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#5C4EBA' : '#64748B',
                  borderBottom: isActive ? '3px solid #5C4EBA' : 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#FFFFFF' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: '#EEF0FF', borderRadius: '12px', color: '#5C4EBA', fontWeight: '700', fontSize: '13px' }}>
                <Loader2 size={18} className="animate-spin" />
                <span>Fetching real-time asset specifications & records...</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ backgroundColor: '#F8F9FD', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ width: '40%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '70%', height: '20px', backgroundColor: '#CBD5E1', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  </div>
                ))}
              </div>
              <div style={{ height: '70px', backgroundColor: '#ECFDF5', borderRadius: '16px', border: '1px solid #A7F3D0', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#A7F3D0', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '30%', height: '14px', backgroundColor: '#6EE7B7', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '50%', height: '10px', backgroundColor: '#A7F3D0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
              <div style={{ height: '120px', backgroundColor: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '25%', height: '14px', backgroundColor: '#E2E8F0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ width: '80%', height: '16px', backgroundColor: '#CBD5E1', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '80%', height: '16px', backgroundColor: '#CBD5E1', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            </div>
          ) : asset ? (
            <>
              {/* Tab 1: Overview & Warranty */}
              {activeSubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Quick KPI grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div style={{ backgroundColor: '#F8F9FD', padding: '14px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Purchase Price</p>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                        {formatINR(asset.purchasePrice || asset.price || 0)}
                      </h3>
                      <p style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>Invoice Recorded</p>
                    </div>

                    <div style={{ backgroundColor: '#F8F9FD', padding: '14px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Purchase Date</p>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                        {asset.purchaseDate || 'Not specified'}
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{asset.seller || 'Direct'}</p>
                    </div>

                    <div style={{ backgroundColor: '#F8F9FD', padding: '14px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Location</p>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#64748B" /> {asset.location || 'Home'}
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Category: {asset.categoryId || asset.category}</p>
                    </div>
                  </div>

                  {/* Warranty Card */}
                  <div
                    style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <ShieldCheck size={30} color="#059669" />
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#065F46' }}>
                          {asset.warranty?.validLabel || 'Warranty Protection Active'}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                          Provider: <strong>{asset.warranty?.provider || asset.brand || 'Brand Manufacturer'}</strong>
                          {asset.warranty?.endDate && ` • Valid until ${asset.warranty.endDate}`}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={12} /> Protected
                    </span>
                  </div>

                  {/* Section 44.3 Emergency / Breakdown Action Helper */}
                  <div
                    style={{
                      backgroundColor: '#FFFBEB',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '16px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="#D97706" />
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#92400E' }}>
                          Quick Support & Breakdown Helper
                        </h4>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#B45309', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '6px' }}>
                        Instant Lookup
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                        <p style={{ fontSize: '11px', color: '#78350F', fontWeight: '600' }}>Warranty</p>
                        <p style={{ fontSize: '12px', fontWeight: '800', color: asset.warranty?.status === 'active' ? '#059669' : '#DC2626', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> {asset.warranty?.status === 'active' ? 'ACTIVE' : 'EXPIRED'}
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                        <p style={{ fontSize: '11px', color: '#78350F', fontWeight: '600' }}>Invoice</p>
                        <p style={{ fontSize: '12px', fontWeight: '800', color: asset.documents?.length > 0 ? '#059669' : '#D97706', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {asset.documents?.length > 0 ? <Receipt size={12} /> : <AlertTriangle size={12} />}
                          <span>{asset.documents?.length > 0 ? 'AVAILABLE' : 'MISSING'}</span>
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                        <p style={{ fontSize: '11px', color: '#78350F', fontWeight: '600' }}>Serial No.</p>
                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', marginTop: '2px', fontFamily: 'monospace' }}>
                          {asset.serialNumber || 'SN--'}
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                        <p style={{ fontSize: '11px', color: '#78350F', fontWeight: '600' }}>Last Service</p>
                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', marginTop: '2px' }}>
                          {asset.services?.[0]?.serviceDate || 'None logged'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {asset.documents?.length > 0 && onViewDocument && (
                        <button
                          type="button"
                          onClick={() => onViewDocument(asset.documents[0])}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Receipt size={13} /> View Invoice
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onLogService(asset.id)}
                        style={{
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Wrench size={13} /> Log Service / Repair
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddDocument(asset.id)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#5C4EBA',
                          border: '1px solid #CBD5E1',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={13} /> Attach Doc
                      </button>
                    </div>
                  </div>

                  {/* Key Details List */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', backgroundColor: '#F8F9FD', borderBottom: '1px solid #E2E8F0', fontWeight: '700', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Asset Specifications
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px 18px', gap: '14px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Brand:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>{asset.brand || '-'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Model Code:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>{asset.model || '-'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Serial Number:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px', fontFamily: 'monospace' }}>{asset.serialNumber || 'Not recorded'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Seller / Retailer:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>{asset.seller || 'Authorized Store'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Ownership:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} /> {asset.ownership || 'Me'}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Estimated Current Value:</span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>{formatINR(asset.currentValue || asset.purchasePrice || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Documents & Invoices */}
              {activeSubTab === 'documents' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>Attached Invoices & Documents</h4>
                    <button
                      onClick={() => onAddDocument(asset.id)}
                      style={{
                        backgroundColor: '#EEF0FF',
                        color: '#5C4EBA',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} /> Upload Document
                    </button>
                  </div>

                  {asset.documents?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#F8F9FD', borderRadius: '12px' }}>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>No documents attached to this asset yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {asset.documents?.map((doc: any) => {
                        const fileUrl = doc.fileUrl && !doc.fileUrl.includes('example.com') && !doc.fileUrl.includes('placehold.co')
                          ? (doc.fileUrl.startsWith('http') ? doc.fileUrl : buildApiUrl(doc.fileUrl))
                          : buildApiUrl(API_ENDPOINTS.DOCUMENTS.FILE(doc.id));

                        return (
                          <div
                            key={doc.id}
                            style={{
                              padding: '14px 16px',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  backgroundColor: doc.type === 'invoice' ? '#ECFDF5' : '#EEF0FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {doc.type === 'invoice' ? <Receipt size={20} color="#059669" /> : <FileText size={20} color="#5C4EBA" />}
                              </div>
                              <div>
                                <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{doc.name}</h5>
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                  {doc.fileName || doc.name} • {doc.sizeFormatted || 'Saved Document'}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  backgroundColor: doc.type === 'invoice' ? '#ECFDF5' : '#EEF0FF',
                                  color: doc.type === 'invoice' ? '#059669' : '#5C4EBA',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {doc.type}
                              </span>
                              {onViewDocument && (
                                <button
                                  onClick={() => onViewDocument(doc)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    backgroundColor: '#FFFFFF',
                                    color: '#334155',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Eye size={13} color="#5C4EBA" /> Preview
                                </button>
                              )}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  backgroundColor: '#EEF0FF',
                                  color: '#5C4EBA',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink size={12} /> Open
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Maintenance & Services */}
              {activeSubTab === 'services' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>Service History</h4>
                    <button
                      onClick={() => onLogService(asset.id)}
                      style={{
                        backgroundColor: '#FFFBEB',
                        color: '#D97706',
                        border: '1px solid #FDE68A',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} /> Log Maintenance
                    </button>
                  </div>

                  {asset.services?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#F8F9FD', borderRadius: '12px' }}>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>No service records logged for this asset.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {asset.services?.map((srv: any) => (
                        <div
                          key={srv.id}
                          style={{
                            padding: '14px 16px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Wrench size={20} color="#D97706" />
                            <div>
                              <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{srv.title}</h5>
                              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                Date: {srv.serviceDate} • Provider: {srv.serviceProvider || 'Authorized'}
                                {srv.technicianNotes ? ` • "${srv.technicianNotes}"` : ''}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '14px', fontWeight: '800', color: '#059669' }}>{formatINR(srv.cost)}</p>
                            {srv.nextDueDate && (
                              <p style={{ fontSize: '11px', color: '#5C4EBA', fontWeight: '600', marginTop: '2px' }}>
                                Next: {srv.nextDueDate}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
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
