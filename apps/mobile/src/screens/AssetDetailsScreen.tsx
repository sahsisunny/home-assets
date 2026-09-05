import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors, formatINR } from '@home-assets/tokens';
import { api, ServiceRecordData } from '../services/api';
import {
  ArrowLeft,
  Share2,
  Pencil,
  ShieldCheck,
  Package,
  FileText,
  Wrench,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react-native';
import { RefreshControl } from 'react-native';

interface AssetDetailsScreenProps {
  assetId?: string;
  onBack: () => void;
  onAddDocument: () => void;
  onAddService: () => void;
}

export const AssetDetailsScreen: React.FC<AssetDetailsScreenProps> = ({
  assetId,
  onBack,
  onAddDocument,
  onAddService,
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Documents' | 'Service' | 'History'>('Overview');
  const [asset, setAsset] = useState<any>(null);
  const [assetDocs, setAssetDocs] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceRecordData[]>([]);
  const [totalServiceSpend, setTotalServiceSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAssetData = async (showLoader = true) => {
    if (!assetId) {
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);
    try {
      const [assetData, docsData, serviceData] = await Promise.all([
        api.getAssetById(assetId).catch(() => null),
        api.getDocuments(undefined, assetId).catch(() => []),
        api.getServices(assetId).catch(() => ({ data: [], totalSpend: 0 })),
      ]);
      setAsset(assetData);
      setAssetDocs(docsData || []);
      setServices(serviceData.data || []);
      setTotalServiceSpend(serviceData.totalSpend || 0);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssetData(true);
  }, [assetId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAssetData(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Asset Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Asset Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Package size={40} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>Asset not found</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
            <Text style={styles.secondaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Asset Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 size={18} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Pencil size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.DEFAULT]}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Product Card with Thumbnail & Status */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: asset.imageUrl || 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{asset.name}</Text>
            <Text style={styles.model}>{asset.model || 'No model specified'}</Text>

            {asset.warranty && (
              <View style={styles.warrantyBadge}>
                <ShieldCheck size={12} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.warrantyText}>{asset.warranty.validLabel || 'Warranty Active'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsRow}>
          {(['Overview', 'Documents', 'Service', 'History'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
                {tab === 'Documents' && assetDocs.length > 0 ? ` (${assetDocs.length})` : ''}
                {tab === 'Service' && services.length > 0 ? ` (${services.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content (Overview) */}
        {activeTab === 'Overview' && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{asset.categoryId || asset.category || 'General'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{asset.brand || '-'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{asset.model || '-'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial Number</Text>
              <Text style={styles.detailValue}>{asset.serialNumber || '-'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date</Text>
              <Text style={styles.detailValue}>{asset.purchaseDate || '-'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price</Text>
              <Text style={styles.detailValue}>{formatINR(asset.purchasePrice || 0)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Value</Text>
              <View style={styles.currentValWrapper}>
                <Text style={styles.detailValue}>{formatINR(asset.currentValue || asset.purchasePrice || 0)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller</Text>
              <Text style={styles.detailValue}>{asset.seller || '-'}</Text>
            </View>

            <View style={[styles.detailRow, styles.lastRow]}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{asset.location || 'Home'}</Text>
            </View>
          </View>
        )}

        {/* Tab Content (Documents) */}
        {activeTab === 'Documents' && (
          <View style={styles.detailsCard}>
            {assetDocs.length === 0 ? (
              <View style={styles.tabEmptyBox}>
                <FileText size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No documents attached</Text>
                <Text style={styles.emptySub}>Add invoice, warranty card or user manuals</Text>
              </View>
            ) : (
              assetDocs.map((doc) => (
                <View key={doc.id} style={styles.docItemRow}>
                  <View style={styles.docMiniIcon}>
                    <FileText size={18} color={colors.primary.DEFAULT} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.docTitleText}>{doc.name || doc.type}</Text>
                    <Text style={styles.docSubText}>{doc.fileName || 'document.pdf'}</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab Content (Service History) */}
        {activeTab === 'Service' && (
          <View style={styles.detailsCard}>
            {services.length === 0 ? (
              <View style={styles.tabEmptyBox}>
                <Wrench size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No service records yet</Text>
                <Text style={styles.emptySub}>
                  Log maintenance, repairs, filter changes, and service costs
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.serviceHeaderBanner}>
                  <Text style={styles.serviceSpendLabel}>Total Maintenance Spend</Text>
                  <Text style={styles.serviceSpendAmount}>{formatINR(totalServiceSpend)}</Text>
                </View>

                {services.map((srv) => (
                  <View key={srv.id} style={styles.serviceCardItem}>
                    <View style={styles.serviceTopRow}>
                      <Text style={styles.serviceTitle}>{srv.title}</Text>
                      <Text style={styles.serviceCost}>{formatINR(srv.cost)}</Text>
                    </View>
                    <Text style={styles.serviceProvider}>
                      {srv.serviceProvider || 'Authorized Technician'} • {srv.serviceDate}
                    </Text>
                    {srv.technicianNotes ? (
                      <Text style={styles.serviceNotes}>{srv.technicianNotes}</Text>
                    ) : null}
                    {srv.nextDueDate ? (
                      <View style={styles.nextDuePill}>
                        <Text style={styles.nextDueText}>Next Due: {srv.nextDueDate}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Tab Content (History Timeline) */}
        {activeTab === 'History' && (
          <View style={styles.detailsCard}>
            <View style={styles.timelineList}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Asset Catalogued</Text>
                  <Text style={styles.timelineDate}>{asset.purchaseDate || 'Recently'}</Text>
                  <Text style={styles.timelineDesc}>Initial record added to Home Asset Manager</Text>
                </View>
              </View>

              {asset.warranty && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Warranty Registered</Text>
                    <Text style={styles.timelineDate}>{asset.warranty.endDate ? `Valid till ${asset.warranty.endDate}` : 'Active'}</Text>
                    <Text style={styles.timelineDesc}>{asset.warranty.provider || 'Brand Warranty'}</Text>
                  </View>
                </View>
              )}

              {services.map((s) => (
                <View key={s.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{s.title}</Text>
                    <Text style={styles.timelineDate}>{s.serviceDate} • {formatINR(s.cost)}</Text>
                    <Text style={styles.timelineDesc}>{s.serviceProvider || 'Technician service'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onAddDocument} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>+ Add Document</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={onAddService} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>+ Add Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  model: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shieldIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  warrantyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  currentValWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabEmptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  docSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevronMini: {
    fontSize: 18,
    color: '#94A3B8',
  },
  serviceHeaderBanner: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceSpendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  serviceSpendAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
  },
  serviceCardItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 4,
  },
  serviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceCost: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  serviceProvider: {
    fontSize: 12,
    color: '#64748B',
  },
  serviceNotes: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#F8F9FD',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  nextDuePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF0FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  nextDueText: {
    fontSize: 11,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  timelineList: {
    paddingVertical: 12,
    gap: 18,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.primary.DEFAULT,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
