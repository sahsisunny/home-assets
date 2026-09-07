'use client';

import React from 'react';
import {
  Package,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  FileText,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Trash2,
  PlusCircle,
  Folder,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';

interface VoiceReportCardsProps {
  tool: {
    name: string;
    args?: any;
    result?: any;
  };
  onPromptClick?: (prompt: string) => void;
}

export function VoiceToolResultCard({ tool, onPromptClick }: VoiceReportCardsProps) {
  const { name, result } = tool;
  if (!result) return null;

  // 1. Asset Search & Asset List
  if (name === 'search_assets') {
    const assets = result.assets || [];
    if (assets.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <Package size={16} color="#94A3B8" />
          <span>No matching assets found in your home inventory.</span>
        </div>
      );
    }

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <Package size={14} color="#4F46E5" />
          <span style={styles.headerTitle}>
            Found {result.totalFound} Asset{result.totalFound === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assets.map((asset: any) => (
            <div key={asset.id} style={styles.itemBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={styles.itemTitle}>{asset.name}</div>
                  <div style={styles.metaRow}>
                    <span style={styles.badge}>{asset.category}</span>
                    {asset.location && (
                      <span style={styles.metaText}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        {asset.location}
                      </span>
                    )}
                  </div>
                </div>
                <div style={styles.priceBadge}>{asset.purchasePrice}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: asset.warrantyStatus.includes('Active')
                      ? '#059669'
                      : asset.warrantyStatus.includes('Expiring')
                      ? '#D97706'
                      : '#6B7280',
                  }}
                >
                  🛡️ {asset.warrantyStatus}
                </span>
                {onPromptClick && (
                  <button
                    onClick={() => onPromptClick(`Tell me details about ${asset.name}`)}
                    style={styles.actionLink}
                  >
                    Details <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Single Asset Details
  if (name === 'get_asset_details') {
    if (!result.found || !result.asset) {
      return (
        <div style={styles.emptyContainer}>
          <AlertTriangle size={15} color="#D97706" />
          <span>{result.message || 'Asset details not found.'}</span>
        </div>
      );
    }

    const a = result.asset;
    const w = a.warranty;

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <Package size={15} color="#4F46E5" />
          <span style={styles.headerTitle}>{a.name}</span>
          <span style={styles.badge}>{a.category}</span>
        </div>

        <div style={styles.grid2}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Purchase Price</div>
            <div style={styles.statValue}>{a.purchasePriceFormatted}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Location</div>
            <div style={styles.statValue}>{a.location}</div>
          </div>
        </div>

        <div style={styles.detailsList}>
          {a.brand && a.brand !== 'Not recorded' && (
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Brand / Model:</span>
              <span style={styles.detailVal}>
                {a.brand} {a.model !== 'Not recorded' ? a.model : ''}
              </span>
            </div>
          )}
          {a.purchaseDate && a.purchaseDate !== 'Not recorded' && (
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Purchased:</span>
              <span style={styles.detailVal}>{a.purchaseDate}</span>
            </div>
          )}
          {typeof w === 'object' && w !== null ? (
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Warranty:</span>
              <span
                style={{
                  ...styles.detailVal,
                  color: w.isExpired ? '#DC2626' : w.daysRemaining <= 30 ? '#D97706' : '#059669',
                  fontWeight: 700,
                }}
              >
                {w.statusLabel} ({w.provider})
              </span>
            </div>
          ) : (
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Warranty:</span>
              <span style={{ ...styles.detailVal, color: '#6B7280' }}>No warranty recorded</span>
            </div>
          )}
        </div>

        {onPromptClick && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button
              onClick={() => onPromptClick(`Check warranty for ${a.name}`)}
              style={styles.pillButton}
            >
              <ShieldCheck size={12} color="#4F46E5" /> Check Warranty
            </button>
            <button
              onClick={() => onPromptClick(`Log maintenance for ${a.name}`)}
              style={styles.pillButton}
            >
              <Wrench size={12} color="#4F46E5" /> Log Service
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Asset Mutations (Create / Update / Delete)
  if (name === 'create_asset' || name === 'update_asset') {
    const isCreate = name === 'create_asset';
    const a = result.asset;
    if (!a) return null;

    return (
      <div style={{ ...styles.cardContainer, borderLeft: '3px solid #10B981' }}>
        <div style={styles.header}>
          <CheckCircle2 size={15} color="#10B981" />
          <span style={{ ...styles.headerTitle, color: '#065F46' }}>
            {isCreate ? 'Asset Added to Inventory' : 'Asset Details Updated'}
          </span>
        </div>
        <div style={styles.itemBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={styles.itemTitle}>{a.name}</div>
            {a.purchasePriceFormatted && <div style={styles.priceBadge}>{a.purchasePriceFormatted}</div>}
          </div>
          <div style={styles.metaRow}>
            <span style={styles.badge}>{a.category}</span>
            <span style={styles.metaText}>
              <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
              {a.location}
            </span>
            {a.hasWarranty && <span style={{ ...styles.badge, backgroundColor: '#D1FAE5', color: '#065F46' }}>Warranty Active</span>}
          </div>
        </div>
      </div>
    );
  }

  if (name === 'delete_asset') {
    return (
      <div style={{ ...styles.cardContainer, borderLeft: '3px solid #EF4444' }}>
        <div style={styles.header}>
          <Trash2 size={15} color="#EF4444" />
          <span style={{ ...styles.headerTitle, color: '#991B1B' }}>Asset Removed</span>
        </div>
        <div style={{ fontSize: '12px', color: '#4B5563' }}>{result.message}</div>
      </div>
    );
  }

  // 4. Warranty Status & Expiring Warranties
  if (name === 'get_warranty_status' || name === 'add_warranty') {
    const w = result.warranty;
    if (!result.hasWarranty && !w) {
      return (
        <div style={styles.emptyContainer}>
          <ShieldAlert size={15} color="#D97706" />
          <span>{result.message || 'No warranty recorded.'}</span>
        </div>
      );
    }

    const isExpired = w.isExpired || w.status === 'Expired';
    const isExpiringSoon = w.daysLeft <= 30 || w.daysRemaining <= 30;

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          {isExpired ? (
            <ShieldAlert size={15} color="#DC2626" />
          ) : (
            <ShieldCheck size={15} color="#059669" />
          )}
          <span style={styles.headerTitle}>
            Warranty Report: {result.assetName || w.assetName}
          </span>
        </div>

        <div style={styles.itemBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>{w.provider}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '8px',
                backgroundColor: isExpired ? '#FEE2E2' : isExpiringSoon ? '#FEF3C7' : '#D1FAE5',
                color: isExpired ? '#991B1B' : isExpiringSoon ? '#92400E' : '#065F46',
              }}
            >
              {isExpired ? 'Expired' : isExpiringSoon ? `Expiring in ${w.daysLeft || w.daysRemaining} days` : 'Active Coverage'}
            </span>
          </div>
          <div style={styles.detailsList}>
            {w.warrantyNumber && (
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>Policy Number:</span>
                <span style={styles.detailVal}>{w.warrantyNumber}</span>
              </div>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailKey}>Valid Dates:</span>
              <span style={styles.detailVal}>
                {w.startDate} to {w.endDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (name === 'list_expiring_warranties') {
    const list = result.expiringOrExpiredWarranties || [];
    if (list.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <ShieldCheck size={15} color="#059669" />
          <span>All warranties are active! None expiring in the next 30 days.</span>
        </div>
      );
    }

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <ShieldAlert size={15} color="#D97706" />
          <span style={styles.headerTitle}>
            {list.length} Warranty Attention Item{list.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {list.map((item: any) => {
            const isExp = item.status === 'expired';
            return (
              <div key={item.assetId} style={styles.itemBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.itemTitle}>{item.assetName}</div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '8px',
                      backgroundColor: isExp ? '#FEE2E2' : '#FEF3C7',
                      color: isExp ? '#991B1B' : '#92400E',
                    }}
                  >
                    {isExp ? 'Expired' : `${item.daysLeft} days left`}
                  </span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaText}>{item.provider}</span>
                  <span style={styles.metaText}>• Exp: {item.endDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. Maintenance Records & Logs
  if (name === 'get_maintenance_history' || name === 'create_maintenance_record') {
    const isCreate = name === 'create_maintenance_record';
    if (isCreate) {
      const r = result.record;
      if (!r) return null;
      return (
        <div style={{ ...styles.cardContainer, borderLeft: '3px solid #3B82F6' }}>
          <div style={styles.header}>
            <Wrench size={15} color="#3B82F6" />
            <span style={{ ...styles.headerTitle, color: '#1E40AF' }}>Service Record Logged</span>
          </div>
          <div style={styles.itemBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={styles.itemTitle}>{r.title}</span>
              <span style={styles.priceBadge}>{r.costFormatted}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.badge}>{r.assetName}</span>
              <span style={styles.metaText}>{r.serviceDate}</span>
              <span style={styles.metaText}>• {r.serviceProvider}</span>
            </div>
            {r.nextServiceDate && (
              <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600, marginTop: '4px' }}>
                📅 Next Service Reminder: {r.nextServiceDate}
              </div>
            )}
          </div>
        </div>
      );
    }

    const records = result.records || [];
    if (records.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <Wrench size={15} color="#94A3B8" />
          <span>No past maintenance records found for this item.</span>
        </div>
      );
    }

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <Wrench size={15} color="#4F46E5" />
          <span style={styles.headerTitle}>
            Maintenance History ({result.totalSpendFormatted} total spend)
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {records.slice(0, 4).map((rec: any) => (
            <div key={rec.id} style={styles.itemBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.itemTitle}>{rec.title}</span>
                <span style={styles.priceBadge}>{rec.costFormatted}</span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.badge}>{rec.assetName}</span>
                <span style={styles.metaText}>{rec.serviceDate}</span>
                <span style={styles.metaText}>• {rec.serviceProvider}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. Documents & Invoices
  if (name === 'search_documents' || name === 'create_document') {
    if (name === 'create_document') {
      const d = result.document;
      if (!d) return null;
      return (
        <div style={{ ...styles.cardContainer, borderLeft: '3px solid #10B981' }}>
          <div style={styles.header}>
            <CheckCircle2 size={15} color="#10B981" />
            <span style={{ ...styles.headerTitle, color: '#065F46' }}>Document Attached</span>
          </div>
          <div style={styles.itemBox}>
            <div style={styles.itemTitle}>{d.name}</div>
            <div style={styles.metaRow}>
              <span style={styles.badge}>{d.type}</span>
              <span style={styles.metaText}>Linked to: {d.assetName}</span>
            </div>
          </div>
        </div>
      );
    }

    const docs = result.documents || [];
    if (docs.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <FileText size={15} color="#94A3B8" />
          <span>No matching invoices or documents found.</span>
        </div>
      );
    }

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <FileText size={15} color="#4F46E5" />
          <span style={styles.headerTitle}>
            Found {docs.length} Document{docs.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.map((d: any) => (
            <div key={d.id} style={styles.itemBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.itemTitle}>{d.name}</span>
                <span style={styles.badge}>{d.type}</span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.metaText}>Asset: {d.assetName}</span>
                <span style={styles.metaText}>• {d.uploadedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. Reminders
  if (name === 'list_reminders' || name === 'create_reminder' || name === 'complete_reminder') {
    if (name === 'create_reminder') {
      const rem = result.reminder;
      if (!rem) return null;
      return (
        <div style={{ ...styles.cardContainer, borderLeft: '3px solid #6366F1' }}>
          <div style={styles.header}>
            <Bell size={15} color="#6366F1" />
            <span style={{ ...styles.headerTitle, color: '#3730A3' }}>Reminder Scheduled</span>
          </div>
          <div style={styles.itemBox}>
            <div style={styles.itemTitle}>{rem.title}</div>
            <div style={styles.metaRow}>
              <span style={{ ...styles.badge, backgroundColor: '#EEF2FF', color: '#4338CA' }}>
                Due: {rem.dueDate}
              </span>
              {rem.assetName && <span style={styles.metaText}>For: {rem.assetName}</span>}
            </div>
          </div>
        </div>
      );
    }

    if (name === 'complete_reminder') {
      return (
        <div style={{ ...styles.cardContainer, borderLeft: '3px solid #10B981' }}>
          <div style={styles.header}>
            <CheckCircle2 size={15} color="#10B981" />
            <span style={{ ...styles.headerTitle, color: '#065F46' }}>Reminder Completed</span>
          </div>
          <div style={{ fontSize: '12px', color: '#4B5563' }}>{result.message}</div>
        </div>
      );
    }

    const reminders = result.reminders || [];
    if (reminders.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <CheckCircle2 size={15} color="#059669" />
          <span>No pending reminders. You are all caught up!</span>
        </div>
      );
    }

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <Bell size={15} color="#D97706" />
          <span style={styles.headerTitle}>
            {reminders.length} Reminder{reminders.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {reminders.map((r: any) => (
            <div key={r.id} style={styles.itemBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.itemTitle}>{r.title}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: r.daysLeft < 0 ? '#DC2626' : r.daysLeft <= 3 ? '#D97706' : '#059669',
                  }}
                >
                  {r.daysLabel}
                </span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.badge}>{r.type}</span>
                <span style={styles.metaText}>Due: {r.dueDate}</span>
                {r.assetName && r.assetName !== 'General' && (
                  <span style={styles.metaText}>• {r.assetName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. Household Summary & Valuation
  if (name === 'get_household_summary') {
    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <TrendingUp size={15} color="#4F46E5" />
          <span style={styles.headerTitle}>Household Portfolio Valuation</span>
        </div>
        <div style={styles.grid2}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total Asset Value</div>
            <div style={{ ...styles.statValue, color: '#059669', fontSize: '15px' }}>
              {result.totalValuationFormatted || result.totalPurchaseValueFormatted}
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total Inventory</div>
            <div style={styles.statValue}>{result.totalAssets} Items</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Active Warranties</div>
            <div style={styles.statValue}>{result.activeWarrantiesCount} Covered</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Maintenance Spend</div>
            <div style={styles.statValue}>{result.totalMaintenanceSpendFormatted}</div>
          </div>
        </div>
      </div>
    );
  }

  // 9. Smart Recommendations
  if (name === 'get_smart_recommendations') {
    const recs = result.recommendations || [];
    if (recs.length === 0) return null;

    return (
      <div style={styles.cardContainer}>
        <div style={styles.header}>
          <Sparkles size={15} color="#F59E0B" />
          <span style={styles.headerTitle}>Actionable Home Briefing</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recs.map((rec: any) => {
            const isHigh = rec.severity === 'high';
            return (
              <div key={rec.id} style={styles.itemBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.itemTitle}>{rec.title}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7',
                      color: isHigh ? '#B91C1C' : '#92400E',
                      textTransform: 'uppercase',
                    }}
                  >
                    {rec.severity}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#4B5563', marginTop: '2px' }}>
                  {rec.description}
                </div>
                {onPromptClick && rec.suggestedAction && (
                  <button
                    onClick={() => onPromptClick(rec.suggestedAction)}
                    style={{ ...styles.actionLink, marginTop: '5px' }}
                  >
                    Action: {rec.suggestedAction} <ArrowRight size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    marginTop: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '10px 12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyContainer: {
    marginTop: '6px',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px dashed #CBD5E1',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748B',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '6px',
  },
  headerTitle: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#1E293B',
    flex: 1,
  },
  itemBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  itemTitle: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#1E293B',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    padding: '1px 6px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  priceBadge: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #A7F3D0',
  },
  metaText: {
    fontSize: '11px',
    color: '#64748B',
  },
  actionLink: {
    background: 'none',
    border: 'none',
    color: '#4F46E5',
    fontSize: '11px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    cursor: 'pointer',
    padding: '2px 0',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  },
  statBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 8px',
  },
  statLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B',
    marginTop: '2px',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
  },
  detailKey: {
    color: '#64748B',
    fontWeight: 500,
  },
  detailVal: {
    color: '#1E293B',
    fontWeight: 600,
  },
  pillButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '8px',
    border: '1px solid #C7D2FE',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
