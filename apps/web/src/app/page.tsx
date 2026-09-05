'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatINR, API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';
import { useAuth } from '../context/AuthContext';

import { AddAssetModal } from '../components/AddAssetModal';
import { ViewAssetModal } from '../components/ViewAssetModal';
import { EditAssetModal } from '../components/EditAssetModal';

import { AddDocumentModal } from '../components/AddDocumentModal';
import { ViewDocumentModal } from '../components/ViewDocumentModal';
import { EditDocumentModal } from '../components/EditDocumentModal';

import { AddServiceModal } from '../components/AddServiceModal';
import { ViewServiceModal } from '../components/ViewServiceModal';
import { EditServiceModal } from '../components/EditServiceModal';

import { AddReminderModal } from '../components/AddReminderModal';
import { ViewReminderModal } from '../components/ViewReminderModal';
import { EditReminderModal } from '../components/EditReminderModal';
import { InviteMemberModal } from '../components/InviteMemberModal';

import {
  Home,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Box,
  Package,
  FileText,
  Receipt,
  Clock,
  Bell,
  Wrench,
  BarChart3,
  Users,
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Check,
  Layers,
  Tv,
  Armchair,
  Car,
  Download,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Tag,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function WebDashboardPage() {
  // Modal Visibility States
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [viewAssetId, setViewAssetId] = useState<string | null>(null);
  const [editAsset, setEditAsset] = useState<any | null>(null);

  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<any | null>(null);
  const [editDocument, setEditDocument] = useState<any | null>(null);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [viewService, setViewService] = useState<any | null>(null);
  const [editService, setEditService] = useState<any | null>(null);

  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [viewReminder, setViewReminder] = useState<any | null>(null);
  const [editReminder, setEditReminder] = useState<any | null>(null);

  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionReminderId, setActionReminderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingMemberId, setIsUpdatingMemberId] = useState<string | null>(null);

  const router = useRouter();
  const { user, household: authHousehold, token, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [assets, setAssets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [household, setHousehold] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'documents' | 'reminders' | 'services' | 'analytics' | 'household'>('assets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const init = Object.keys(headers).length > 0 ? { headers } : undefined;

      const [assetsRes, docsRes, servicesRes, remindersRes, analyticsRes, householdRes] = await Promise.all([
        fetch(buildApiUrl(API_ENDPOINTS.ASSETS.LIST), init),
        fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.LIST), init),
        fetch(buildApiUrl(API_ENDPOINTS.SERVICES.LIST), init),
        fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.LIST), init),
        fetch(buildApiUrl(API_ENDPOINTS.ANALYTICS.SUMMARY), init),
        fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.DETAILS), init),
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.data || []);
      }
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      }
      if (servicesRes.ok) {
        const servData = await servicesRes.json();
        setServices(servData.data || []);
      }
      if (remindersRes.ok) {
        const remData = await remindersRes.json();
        setReminders(remData.data || []);
      }
      if (analyticsRes.ok) {
        const anaData = await analyticsRes.json();
        setAnalytics(anaData.data || null);
      }
      if (householdRes.ok) {
        const hhData = await householdRes.json();
        setHousehold(hhData.data || null);
      }
    } catch (err) {
      console.error('Failed to load data from server:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleResetAssets = async () => {
    if (confirm('Clear all assets and start with a completely empty portfolio?')) {
      try {
        const res = await fetch(buildApiUrl('/assets/reset'), { method: 'POST' });
        if (res.ok) {
          await loadData();
          showToast('Assets cleared. Ready for your actual items!');
        }
      } catch (err) {
        console.error('Failed to reset assets:', err);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.SEARCH.QUERY(query)));
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Delete Handlers
  const handleDeleteAsset = async (id: string, name?: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DELETE(id)), { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        showToast(`Asset "${name || id}" deleted successfully!`);
      }
    } catch (err) {
      console.error('Failed to delete asset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDocument = async (id: string, name?: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.DELETE(id)), { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        showToast(`Document "${name || id}" deleted successfully!`);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteService = async (id: string, title?: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.DELETE(id)), { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        showToast(`Service record "${title || id}" deleted successfully!`);
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReminder = async (id: string, title?: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.DELETE(id)), { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        showToast(`Reminder "${title || id}" deleted successfully!`);
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReminderAction = async (id: string, action: 'complete' | 'snooze') => {
    setActionReminderId(id);
    try {
      const body = action === 'complete' ? { status: 'completed' } : { snoozeDays: 7 };
      const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.UPDATE(id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await loadData();
        showToast(action === 'complete' ? 'Reminder marked completed!' : 'Snoozed for 7 days!');
      }
    } catch (err) {
      console.error('Failed to update reminder:', err);
    } finally {
      setActionReminderId(null);
    }
  };

  const handleHouseholdMemberRole = async (memberId: string, role: string) => {
    setIsUpdatingMemberId(memberId);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.UPDATE_MEMBER(memberId)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        await loadData();
        showToast('Member role updated!');
      }
    } catch (err) {
      console.error('Failed to update member role:', err);
    } finally {
      setIsUpdatingMemberId(null);
    }
  };

  const handleRemoveHouseholdMember = async (memberId: string, memberName?: string) => {
    setIsUpdatingMemberId(memberId);
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.REMOVE_MEMBER(memberId)), {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadData();
        showToast(`Member "${memberName || memberId}" removed.`);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setIsUpdatingMemberId(null);
    }
  };

  const totalValue = assets.reduce(
    (sum, a) => sum + (Number(a.purchasePrice) || Number(a.price) || 0),
    0
  );

  const totalMaintenance = services.reduce(
    (sum, s) => sum + (Number(s.cost) || 0),
    0
  );

  const pendingReminders = reminders.filter((r) => r.status !== 'completed');

  const urgentReminders = reminders.filter(
    (r) => r.status !== 'completed' && (r.priority === 'urgent' || r.categoryGroup === 'due_today' || (r.diffDays !== undefined && r.diffDays <= 7))
  );
  const upcomingReminders = reminders.filter(
    (r) => r.status !== 'completed' && !urgentReminders.some((u) => u.id === r.id)
  );

  const filteredAssets = assets
    .filter((a) => {
      if (selectedCategory === 'all') return true;
      const cat = (a.categoryId || a.category || '').toLowerCase();
      return cat === selectedCategory.toLowerCase();
    })
    .sort((a, b) => {
      if (selectedSort === 'price_desc') {
        return (Number(b.purchasePrice) || Number(b.price) || 0) - (Number(a.purchasePrice) || Number(a.price) || 0);
      }
      if (selectedSort === 'price_asc') {
        return (Number(a.purchasePrice) || Number(a.price) || 0) - (Number(b.purchasePrice) || Number(b.price) || 0);
      }
      if (selectedSort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (selectedSort === 'date') {
        return new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime();
      }
      return 0;
    });

  const handleExport = (format: 'json' | 'csv') => {
    setIsExporting(format);
    window.open(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.EXPORT(format)), '_blank');
    showToast(`Downloading household ${format.toUpperCase()} export...`);
    setTimeout(() => setIsExporting(null), 2000);
  };

  const assetOptions = assets.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FD' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header
        style={{
          height: '70px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#5C4EBA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Home size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
              Home Asset Manager
            </h1>
            <p style={{ fontSize: '12px', color: '#64748B' }}>Household Assets, Warranties & Services</p>
          </div>
        </div>

        {/* Global Search Bar with Live Flyout */}
        <div style={{ flex: 1, maxWidth: '440px', margin: '0 24px', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" color="#5C4EBA" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
            ) : (
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
            )}
            <input
              type="text"
              placeholder="Universal search (assets, receipts, technicians)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8F9FD',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Search Dropdown Results */}
          {searchResults && searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '14px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                  Search Results ({searchResults.total} matches)
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>

              {searchResults.total === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No matches found.</p>
              ) : (
                <>
                  {/* Matching Assets */}
                  {searchResults.assets?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#5C4EBA', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Package size={13} /> Assets ({searchResults.assets.length})
                      </h4>
                      {searchResults.assets.map((a: any) => (
                        <div
                          key={a.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#F8F9FD',
                            marginBottom: '4px',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{a.name}</p>
                            <p style={{ fontSize: '11px', color: '#64748B' }}>{a.brand} • {formatINR(a.purchasePrice || 0)} • {a.location}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setViewAssetId(a.id);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditAsset(a);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#EEF0FF', color: '#5C4EBA', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Documents */}
                  {searchResults.documents?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#5C4EBA', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileText size={13} /> Documents ({searchResults.documents.length})
                      </h4>
                      {searchResults.documents.map((d: any) => (
                        <div
                          key={d.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#F8F9FD',
                            marginBottom: '4px',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{d.name}</p>
                            <p style={{ fontSize: '11px', color: '#64748B' }}>{d.type} • {d.assetName}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setViewDocument(d);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditDocument(d);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#EEF0FF', color: '#5C4EBA', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Services */}
                  {searchResults.services?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wrench size={13} /> Services ({searchResults.services.length})
                      </h4>
                      {searchResults.services.map((s: any) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#FFFBEB',
                            marginBottom: '4px',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#B45309' }}>{s.title}</p>
                            <p style={{ fontSize: '11px', color: '#92400E' }}>{s.assetName} • {formatINR(s.cost)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setViewService(s);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FDE68A', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditService(s);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#FDE68A', color: '#B45309', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Reminders */}
                  {searchResults.reminders?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} /> Reminders ({searchResults.reminders.length})
                      </h4>
                      {searchResults.reminders.map((r: any) => (
                        <div
                          key={r.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#FEF2F2',
                            marginBottom: '4px',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>{r.title}</p>
                            <p style={{ fontSize: '11px', color: '#B91C1C' }}>Due: {r.dueDate} • {r.assetName}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setViewReminder(r);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditReminder(r);
                                setSearchQuery('');
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#FECACA', color: '#991B1B', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            title="Refresh All Data"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '9px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setIsAddReminderOpen(true)}
            style={{
              backgroundColor: '#F8FAFC',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '9px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> Set Reminder
          </button>
          <button
            onClick={() => setIsAddServiceOpen(true)}
            style={{
              backgroundColor: '#FFFBEB',
              color: '#D97706',
              border: '1px solid #FDE68A',
              padding: '9px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> Log Service
          </button>
          <button
            onClick={() => setIsAddDocumentOpen(true)}
            style={{
              backgroundColor: '#EEF0FF',
              color: '#5C4EBA',
              border: 'none',
              padding: '9px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> Add Document
          </button>
          <button
            onClick={() => setIsAddAssetOpen(true)}
            style={{
              backgroundColor: '#5C4EBA',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(92, 78, 186, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={15} /> Add Asset (with Invoice)
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8F9FD',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '5px 10px 5px 6px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#5C4EBA',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '13px',
                }}
              >
                {user?.fullName
                  ? user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'HO'}
              </div>
              <div style={{ textAlign: 'left', display: 'none', minWidth: '80px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', lineHeight: '1.2' }}>
                  {user?.fullName || 'Homeowner'}
                </p>
                <p style={{ fontSize: '10px', color: '#64748B' }}>{user?.role || 'Owner'}</p>
              </div>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '260px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>
                    {user?.fullName || 'Homeowner'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {user?.email || (user?.phone ? `+91 ${user.phone}` : 'Active Account')}
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#EEF0FF', color: '#5C4EBA', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginTop: '6px' }}>
                    <Crown size={11} /> {authHousehold?.name || household?.name || "My Household"}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('household');
                    setIsUserMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Users size={14} color="#5C4EBA" /> Household & Family
                </button>


                <button
                  onClick={() => {
                    handleResetAssets();
                    setIsUserMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Trash2 size={14} color="#DC2626" /> Reset All Records
                </button>

                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    handleLogout();
                    setIsUserMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', width: '100%', margin: '28px auto', padding: '0 24px' }}>
        {isLoading ? (
          <div>
            {/* Skeleton KPI Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '24px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ width: '45%', height: '14px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '70%', height: '32px', backgroundColor: '#E2E8F0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '55%', height: '12px', backgroundColor: '#F1F5F9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>

            {/* Skeleton Attention Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #FDE68A',
                borderRadius: '20px',
                padding: '20px 24px',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '220px', height: '18px', backgroundColor: '#FDE68A', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ width: '100px', height: '28px', backgroundColor: '#FFFBEB', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {[1, 2].map((k) => (
                  <div key={k} style={{ height: '64px', backgroundColor: '#FFFBEB', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            </div>

            {/* Skeleton Table Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '30%' }}>
                  <div style={{ width: '80%', height: '20px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '100%', height: '14px', backgroundColor: '#F1F5F9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
                <div style={{ width: '120px', height: '36px', backgroundColor: '#EEF0FF', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: '#F8F9FD',
                      gap: '16px',
                    }}
                  >
                    <div style={{ width: '28%', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '15%', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '15%', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '15%', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '12%', height: '28px', backgroundColor: '#E2E8F0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* PRD Section 44.1: WHAT NEEDS ATTENTION */}
            {(urgentReminders.length > 0 || upcomingReminders.length > 0) && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FDE68A',
                  borderRadius: '20px',
                  padding: '20px 24px',
                  marginBottom: '28px',
                  boxShadow: '0 4px 20px rgba(217, 119, 6, 0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={22} color="#D97706" />
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        What Needs Attention?
                      </h3>
                      <p style={{ fontSize: '12px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {urgentReminders.length > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontWeight: '700' }}>
                            <AlertCircle size={12} /> {urgentReminders.length} Urgent Action{urgentReminders.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {urgentReminders.length > 0 && upcomingReminders.length > 0 && '•'}
                        {upcomingReminders.length > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: '700' }}>
                            <Clock size={12} /> {upcomingReminders.length} Upcoming Deadline{upcomingReminders.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    style={{
                      backgroundColor: '#FFFBEB',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    View All Reminders
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {urgentReminders.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {r.type === 'warranty' ? <Shield size={14} color="#DC2626" /> : <Wrench size={14} color="#DC2626" />}
                          <p style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B' }}>{r.title}</p>
                        </div>
                        <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px', fontWeight: '600' }}>
                          Due: {r.dueDate} ({r.daysLabel || 'Urgent'})
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleReminderAction(r.id, 'complete')}
                          disabled={actionReminderId === r.id}
                          style={{
                            backgroundColor: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {actionReminderId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Done
                        </button>
                        <button
                          onClick={() => handleReminderAction(r.id, 'snooze')}
                          disabled={actionReminderId === r.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            border: '1px solid #CBD5E1',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {actionReminderId === r.id ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />} 7d
                        </button>
                      </div>
                    </div>
                  ))}
                  {upcomingReminders.slice(0, urgentReminders.length > 0 ? 1 : 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {r.type === 'warranty' ? <Shield size={14} color="#D97706" /> : <Wrench size={14} color="#D97706" />}
                          <p style={{ fontSize: '13px', fontWeight: '800', color: '#B45309' }}>{r.title}</p>
                        </div>
                        <p style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>
                          Due: {r.dueDate} ({r.daysLabel || 'Upcoming'})
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleReminderAction(r.id, 'complete')}
                          disabled={actionReminderId === r.id}
                          style={{
                            backgroundColor: '#D97706',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {actionReminderId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Done
                        </button>
                        <button
                          onClick={() => handleReminderAction(r.id, 'snooze')}
                          disabled={actionReminderId === r.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            border: '1px solid #CBD5E1',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {actionReminderId === r.id ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />} 7d
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Total Assets</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#1E293B' }}>{assets.length}</h2>
                <p style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>Live Portfolio</p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Portfolio Valuation</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#1E293B' }}>{formatINR(totalValue)}</h2>
                <p style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>Purchase Total</p>
              </div>

              <div style={{ backgroundColor: '#FFFBEB', borderRadius: '18px', padding: '20px', border: '1px solid #FDE68A' }}>
                <p style={{ fontSize: '12px', color: '#D97706', fontWeight: '600' }}>Pending Reminders</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#D97706' }}>{pendingReminders.length}</h2>
                <p style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>Maintenance & Warranties</p>
              </div>

              <div style={{ backgroundColor: '#ECFDF5', borderRadius: '18px', padding: '20px', border: '1px solid #A7F3D0' }}>
                <p style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>Maintenance Spend</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#059669' }}>{formatINR(totalMaintenance)}</h2>
                <p style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>{services.length} Service records</p>
              </div>
            </div>

            {/* Tab Toggle Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'assets', label: 'Assets', count: assets.length, icon: Package },
                { id: 'documents', label: 'Documents & Invoices', count: documents.length, icon: FileText },
                { id: 'reminders', label: 'Reminders', count: pendingReminders.length, icon: Clock },
                { id: 'services', label: 'Maintenance', count: services.length, icon: Wrench },
                { id: 'analytics', label: 'Analytics', count: null, icon: BarChart3 },
                { id: 'household', label: 'Household', count: household?.members?.length || 2, icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: isActive ? 'none' : '1px solid #E2E8F0',
                      backgroundColor: isActive ? '#5C4EBA' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 12px rgba(92, 78, 186, 0.2)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon size={16} />
                    <span>
                      {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 1. ASSETS TAB VIEW */}
            {activeTab === 'assets' && (
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>Household Assets</h3>
                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                      Manage warranty certificates, maintenance history, and invoices
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddAssetOpen(true)}
                    style={{ backgroundColor: '#EEF0FF', color: '#5C4EBA', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Add Asset
                  </button>
                </div>

                {/* PRD Section 11: Category Filter Pills & Sorting */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                  {/* Category Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All', icon: Layers },
                      { id: 'appliances', label: 'Appliances', icon: Sparkles },
                      { id: 'electronics', label: 'Electronics', icon: Tv },
                      { id: 'furniture', label: 'Furniture', icon: Armchair },
                      { id: 'vehicles', label: 'Vehicles', icon: Car },
                      { id: 'equipment', label: 'Equipment', icon: Wrench },
                      { id: 'other', label: 'Other', icon: Box },
                    ].map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: isSelected ? '800' : '600',
                            border: isSelected ? '1px solid #5C4EBA' : '1px solid #E2E8F0',
                            backgroundColor: isSelected ? '#EEF0FF' : '#FFFFFF',
                            color: isSelected ? '#5C4EBA' : '#64748B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CatIcon size={13} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sort selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Sort by:</span>
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#334155',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="recent">Recently Added</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="date">Purchase Date</option>
                    </select>
                  </div>
                </div>

                {filteredAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#F8F9FD', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                      <Package size={44} color="#94A3B8" />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      {selectedCategory !== 'all' ? `No ${selectedCategory} Assets Found` : 'No Assets Catalogued Yet'}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                      {selectedCategory !== 'all' ? 'Try selecting another category filter or add a new asset.' : 'Upload an invoice with Gemini AI or add your asset details manually.'}
                    </p>
                    <button
                      onClick={() => setIsAddAssetOpen(true)}
                      style={{ backgroundColor: '#5C4EBA', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Asset
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Asset Name</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Category</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Brand / Model</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Location</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Purchase Value</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Invoices / Docs</th>
                          <th style={{ padding: '12px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.map((a) => (
                          <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                              <span
                                onClick={() => setViewAssetId(a.id)}
                                style={{ cursor: 'pointer', color: '#1E293B', textDecoration: 'none' }}
                              >
                                {a.name}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px' }}>{a.categoryId || a.category || 'General'}</td>
                            <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px' }}>{a.brand || ''} {a.model ? `(${a.model})` : ''}</td>
                            <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px' }}>{a.location || 'Home'}</td>
                            <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{formatINR(a.purchasePrice || a.price || 0)}</td>
                            <td style={{ padding: '16px 12px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', backgroundColor: '#EEF0FF', color: '#5C4EBA' }}>
                                <Receipt size={13} /> {a.documentsCount || 1}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => setViewAssetId(a.id)}
                                  title="View Asset Details"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    backgroundColor: '#FFFFFF',
                                    color: '#334155',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button
                                  onClick={() => setEditAsset(a)}
                                  title="Edit Asset"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#EEF0FF',
                                    color: '#5C4EBA',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete asset "${a.name}"?`)) {
                                      handleDeleteAsset(a.id, a.name);
                                    }
                                  }}
                                  disabled={deletingId === a.id}
                                  title="Delete Asset"
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: deletingId === a.id ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {deletingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

        {/* 2. DOCUMENTS & INVOICES TAB VIEW */}
        {activeTab === 'documents' && (
          <section style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>Documents & Invoices</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Purchase receipts, warranty cards, manuals, and insurance policies</p>
              </div>
              <button
                onClick={() => setIsAddDocumentOpen(true)}
                style={{ backgroundColor: '#EEF0FF', color: '#5C4EBA', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#F8F9FD', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <FileText size={44} color="#94A3B8" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>No Documents Uploaded Yet</h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Upload purchase invoices, warranty certificates, or user manuals</p>
                <button
                  onClick={() => setIsAddDocumentOpen(true)}
                  style={{ backgroundColor: '#5C4EBA', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Upload Document
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Document Title</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Type</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Linked Asset</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>File Name</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Date</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                          <span
                            onClick={() => setViewDocument(doc)}
                            style={{ cursor: 'pointer', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {doc.type === 'invoice' ? <Receipt size={15} color="#059669" /> : <FileText size={15} color="#5C4EBA" />}
                            <span>{doc.name}</span>
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', backgroundColor: doc.type === 'invoice' ? '#ECFDF5' : '#EEF0FF', color: doc.type === 'invoice' ? '#059669' : '#5C4EBA', textTransform: 'uppercase' }}>
                            {doc.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px', fontWeight: '600' }}>{doc.assetName || 'General'}</td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '13px' }}>{doc.fileName}</td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '13px' }}>{doc.date || 'Recent'}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setViewDocument(doc)}
                              title="View Document Details"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => setEditDocument(doc)}
                              title="Edit Document"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#EEF0FF',
                                color: '#5C4EBA',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete document "${doc.name}"?`)) {
                                  handleDeleteDocument(doc.id, doc.name);
                                }
                              }}
                              disabled={deletingId === doc.id}
                              title="Delete Document"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              {deletingId === doc.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 3. REMINDERS TAB VIEW */}
        {activeTab === 'reminders' && (
          <section style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>Central Reminders & Expiries</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  Snooze, complete, edit, or create warranty and maintenance deadlines
                </p>
              </div>
              <button
                onClick={() => setIsAddReminderOpen(true)}
                style={{ backgroundColor: '#EEF0FF', color: '#5C4EBA', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Reminder
              </button>
            </div>

            {reminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#F8F9FD', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <CheckCircle2 size={44} color="#059669" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>All Caught Up!</h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>No pending warranty or maintenance reminders scheduled.</p>
                <button
                  onClick={() => setIsAddReminderOpen(true)}
                  style={{ backgroundColor: '#5C4EBA', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Reminder
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: r.status === 'completed' ? '#F8F9FD' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: r.status === 'completed' ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: r.type === 'warranty' ? '#EEF0FF' : '#FFFBEB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {r.type === 'warranty' ? <Shield size={20} color="#5C4EBA" /> : <Wrench size={20} color="#D97706" />}
                      </div>
                      <div>
                        <h4
                          onClick={() => setViewReminder(r)}
                          style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', cursor: 'pointer' }}
                        >
                          {r.title}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          Due: <strong>{r.dueDate}</strong> • {r.assetName} • <span style={{ fontWeight: '700', color: r.status === 'completed' ? '#059669' : '#D97706' }}>{r.daysLabel || r.status}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setViewReminder(r)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#475569',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> View
                      </button>

                      <button
                        onClick={() => setEditReminder(r)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#EEF0FF',
                          color: '#5C4EBA',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Pencil size={12} /> Edit
                      </button>

                      {r.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleReminderAction(r.id, 'snooze')}
                            disabled={actionReminderId === r.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#475569',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {actionReminderId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />} Snooze 7d
                          </button>
                          <button
                            onClick={() => handleReminderAction(r.id, 'complete')}
                            disabled={actionReminderId === r.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: actionReminderId === r.id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {actionReminderId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Complete
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Delete reminder "${r.title}"?`)) {
                            handleDeleteReminder(r.id, r.title);
                          }
                        }}
                        disabled={deletingId === r.id}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: deletingId === r.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {deletingId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. SERVICES & MAINTENANCE TAB VIEW */}
        {activeTab === 'services' && (
          <section style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>Service & Maintenance Log</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Historical maintenance spend and technician records</p>
              </div>
              <button
                onClick={() => setIsAddServiceOpen(true)}
                style={{ backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Log Service
              </button>
            </div>

            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#F8F9FD', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <Wrench size={44} color="#94A3B8" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>No Service Records Logged Yet</h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Track cleaning, maintenance, repairs & technician contacts</p>
                <button
                  onClick={() => setIsAddServiceOpen(true)}
                  style={{ backgroundColor: '#5C4EBA', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Log First Service
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Service Title</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Asset</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Provider / Technician</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Cost</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Date</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Next Due</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                          <span
                            onClick={() => setViewService(s)}
                            style={{ cursor: 'pointer', color: '#1E293B' }}
                          >
                            {s.title}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px' }}>{s.assetName}</td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '14px' }}>{s.serviceProvider || 'Authorized'}</td>
                        <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '14px', color: '#059669' }}>{formatINR(s.cost)}</td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '13px' }}>{s.serviceDate}</td>
                        <td style={{ padding: '16px 12px', color: '#5C4EBA', fontSize: '13px', fontWeight: '600' }}>{s.nextDueDate || '-'}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setViewService(s)}
                              title="View Service Details"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => setEditService(s)}
                              title="Edit Service Record"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#FFFBEB',
                                color: '#D97706',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete service record "${s.title}"?`)) {
                                  handleDeleteService(s.id, s.title);
                                }
                              }}
                              disabled={deletingId === s.id}
                              title="Delete Service"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: deletingId === s.id ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              {deletingId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 5. ANALYTICS TAB VIEW */}
        {activeTab === 'analytics' && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B', marginBottom: '16px' }}>Category Distribution</h3>
              {analytics?.categories?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {analytics.categories.map((cat: any) => (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                        <span>{cat.name} ({cat.count})</span>
                        <span>{formatINR(cat.value)} ({cat.percentage}%)</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(cat.percentage, 4)}%`, height: '100%', backgroundColor: '#5C4EBA' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>Add assets to view category distribution.</p>
              )}
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B', marginBottom: '16px' }}>Protection & Coverage Health</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ backgroundColor: '#ECFDF5', padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <ShieldCheck size={28} color="#059669" />
                  </div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>Active Warranties</h4>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{analytics?.activeWarranties || 0}</p>
                </div>
                <div style={{ backgroundColor: '#EEF0FF', padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <DollarSign size={28} color="#5C4EBA" />
                  </div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#4338CA' }}>Total Maintenance</h4>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#5C4EBA', marginTop: '4px' }}>{formatINR(totalMaintenance)}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. HOUSEHOLD & FAMILY TAB VIEW */}
        {activeTab === 'household' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Household Header Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      backgroundColor: '#5C4EBA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                    }}
                  >
                    <Home size={28} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>
                        {authHousehold?.name || household?.name || (user?.fullName ? `${user.fullName}'s Home` : "My Household")}
                      </h2>
                      <span
                        style={{
                          backgroundColor: '#EEF0FF',
                          color: '#5C4EBA',
                          fontSize: '12px',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} /> {household?.plan || 'Family Pro'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      Created: {household?.createdAt || 'Jan 2026'} • {household?.members?.length || 2} Active Family Members
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting === 'csv'}
                    style={{
                      backgroundColor: '#F8FAFC',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      padding: '9px 16px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: isExporting === 'csv' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isExporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={isExporting === 'json'}
                    style={{
                      backgroundColor: '#F8FAFC',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      padding: '9px 16px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: isExporting === 'json' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isExporting === 'json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export JSON
                  </button>
                  <button
                    onClick={() => setIsInviteMemberOpen(true)}
                    style={{
                      backgroundColor: '#5C4EBA',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(92, 78, 186, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={14} /> Invite Member
                  </button>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1E293B' }}>Household Members & Permissions</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                    Manage family access permissions and ownership tagging
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Member</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Contact</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Role</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Status</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B' }}>Joined</th>
                      <th style={{ padding: '12px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {household?.members?.map((m: any) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: '#EEF0FF',
                                color: '#5C4EBA',
                                fontWeight: '800',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {m.initials || m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{m.name}</p>
                              {m.role === 'Owner' && <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>Primary Owner</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#475569', fontSize: '14px' }}>{m.emailOrPhone}</td>
                        <td style={{ padding: '16px 12px' }}>
                          {m.role === 'Owner' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', backgroundColor: '#ECFDF5', color: '#059669' }}>
                              <Crown size={12} /> Owner
                            </span>
                          ) : (
                            <select
                              value={m.role}
                              disabled={isUpdatingMemberId === m.id}
                              onChange={(e) => handleHouseholdMemberRole(m.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#334155',
                                backgroundColor: '#F8F9FD',
                                outline: 'none',
                                cursor: isUpdatingMemberId === m.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Member">Member</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          )}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: m.status === 'active' ? '#ECFDF5' : '#FFFBEB',
                              color: m.status === 'active' ? '#059669' : '#D97706',
                              textTransform: 'uppercase',
                            }}
                          >
                            {m.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#64748B', fontSize: '13px' }}>{m.joinedDate || 'Recently'}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          {m.role !== 'Owner' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {isUpdatingMemberId === m.id ? (
                                <Loader2 size={16} className="animate-spin" color="#5C4EBA" />
                              ) : (
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove member "${m.name}" from household?`)) {
                                      handleRemoveHouseholdMember(m.id, m.name);
                                    }
                                  }}
                                  disabled={isUpdatingMemberId === m.id}
                                  title="Remove Member"
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* --- ALL MODALS --- */}

      {/* Household Modal */}
      <InviteMemberModal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
        onMemberInvited={() => {
          loadData();
          showToast('Invitation sent successfully!');
        }}
      />

      {/* Asset Modals */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAssetAdded={() => {
          loadData();
          showToast('Asset & Purchase Invoice saved successfully!');
        }}
      />

      <ViewAssetModal
        assetId={viewAssetId}
        isOpen={Boolean(viewAssetId)}
        onClose={() => setViewAssetId(null)}
        onEdit={(asset) => {
          setViewAssetId(null);
          setEditAsset(asset);
        }}
        onDelete={(id) => {
          handleDeleteAsset(id);
          setViewAssetId(null);
        }}
        onAddDocument={(assetId) => {
          setIsAddDocumentOpen(true);
        }}
        onLogService={(assetId) => {
          setIsAddServiceOpen(true);
        }}
        onViewDocument={(doc) => {
          setViewDocument(doc);
        }}
      />

      <EditAssetModal
        asset={editAsset}
        isOpen={Boolean(editAsset)}
        onClose={() => setEditAsset(null)}
        onAssetUpdated={() => {
          loadData();
          showToast('Asset updated successfully!');
        }}
      />

      {/* Document Modals */}
      <AddDocumentModal
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        onDocumentAdded={() => {
          loadData();
          showToast('Document uploaded successfully!');
        }}
        assets={assetOptions}
      />

      <ViewDocumentModal
        document={viewDocument}
        isOpen={Boolean(viewDocument)}
        onClose={() => setViewDocument(null)}
        onEdit={(doc) => {
          setViewDocument(null);
          setEditDocument(doc);
        }}
        onDelete={(docId) => {
          handleDeleteDocument(docId);
          setViewDocument(null);
        }}
      />

      <EditDocumentModal
        document={editDocument}
        isOpen={Boolean(editDocument)}
        onClose={() => setEditDocument(null)}
        onDocumentUpdated={() => {
          loadData();
          showToast('Document updated successfully!');
        }}
        assets={assetOptions}
      />

      {/* Service Modals */}
      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onServiceAdded={() => {
          loadData();
          showToast('Maintenance service logged successfully!');
        }}
        assets={assetOptions}
      />

      <ViewServiceModal
        service={viewService}
        isOpen={Boolean(viewService)}
        onClose={() => setViewService(null)}
        onEdit={(srv) => {
          setViewService(null);
          setEditService(srv);
        }}
        onDelete={(srvId) => {
          handleDeleteService(srvId);
          setViewService(null);
        }}
      />

      <EditServiceModal
        service={editService}
        isOpen={Boolean(editService)}
        onClose={() => setEditService(null)}
        onServiceUpdated={() => {
          loadData();
          showToast('Service record updated successfully!');
        }}
        assets={assetOptions}
      />

      {/* Reminder Modals */}
      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
        onReminderAdded={() => {
          loadData();
          showToast('Reminder scheduled successfully!');
        }}
        assets={assetOptions}
      />

      <ViewReminderModal
        reminder={viewReminder}
        isOpen={Boolean(viewReminder)}
        onClose={() => setViewReminder(null)}
        onEdit={(rem) => {
          setViewReminder(null);
          setEditReminder(rem);
        }}
        onDelete={(remId) => {
          handleDeleteReminder(remId);
          setViewReminder(null);
        }}
        onAction={(id, action) => {
          handleReminderAction(id, action);
        }}
      />

      <EditReminderModal
        reminder={editReminder}
        isOpen={Boolean(editReminder)}
        onClose={() => setEditReminder(null)}
        onReminderUpdated={() => {
          loadData();
          showToast('Reminder updated successfully!');
        }}
        assets={assetOptions}
      />
    </div>
  );
}
