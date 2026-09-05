import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, formatINR } from '@home-assets/tokens';
import { api, DashboardData, AssetSummary } from '../services/api';
import {
  Menu,
  Bell,
  ShieldAlert,
  Wrench,
  FileText,
  Home,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';

interface DashboardScreenProps {
  onSelectAsset: (assetId: string) => void;
  onViewAllAssets: () => void;
  onOpenNotifications: () => void;
  onOpenMenu?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectAsset,
  onViewAllAssets,
  onOpenNotifications,
  onOpenMenu,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch {
      // Keep previous data if error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton} onPress={onOpenMenu}>
            <Menu size={20} color="#334155" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>
              Good Morning, {data?.user?.name || 'Homeowner'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bellButton} onPress={onOpenNotifications}>
          <Bell size={20} color="#334155" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
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
        {isLoading ? (
          <View style={{ gap: 20, paddingTop: 10 }}>
            {/* KPI Card Skeleton */}
            <View style={[styles.kpiCard, { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 12 }}>
                Loading household assets & stats...
              </Text>
            </View>
          </View>
        ) : (
          <>
        {/* Total Assets & Total Value KPI Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Total Assets</Text>
              <Text style={styles.kpiValueLarge}>{data?.totalAssets ?? 0}</Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiCol}>
              <View style={styles.valueRow}>
                <Text style={styles.kpiLabel}>Total Value</Text>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthText}>{data?.growthPercent || '0%'}</Text>
                </View>
              </View>
              <Text style={styles.kpiValueLarge}>
                {formatINR(data?.totalPurchaseValue ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* At a Glance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>At a Glance</Text>
          <View style={styles.glanceRow}>
            {/* Warranties Expiring Card */}
            <View style={[styles.glanceCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <View style={styles.glanceIconRow}>
                <ShieldAlert size={18} color="#D97706" />
                <Text style={[styles.glanceNumber, { color: '#D97706' }]}>
                  {data?.atAGlance?.warrantiesExpiring ?? 0}
                </Text>
              </View>
              <Text style={styles.glanceTitle}>Warranties Expiring</Text>
              <Text style={styles.glanceSub}>Next 30 days</Text>
            </View>

            {/* Maintenance Due Card */}
            <View style={[styles.glanceCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
              <View style={styles.glanceIconRow}>
                <Wrench size={18} color="#EA580C" />
                <Text style={[styles.glanceNumber, { color: '#EA580C' }]}>
                  {data?.atAGlance?.maintenanceDue ?? 0}
                </Text>
              </View>
              <Text style={styles.glanceTitle}>Maintenance Due</Text>
              <Text style={styles.glanceSub}>This month</Text>
            </View>

            {/* Documents Missing Card */}
            <View style={[styles.glanceCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <View style={styles.glanceIconRow}>
                <FileText size={18} color="#DC2626" />
                <Text style={[styles.glanceNumber, { color: '#DC2626' }]}>
                  {data?.atAGlance?.documentsMissing ?? 0}
                </Text>
              </View>
              <Text style={styles.glanceTitle}>Documents Missing</Text>
              <Text style={styles.glanceSub}>Needs attention</Text>
            </View>
          </View>
        </View>

        {/* Recent Assets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Assets</Text>
            {data?.recentAssets && data.recentAssets.length > 0 && (
              <TouchableOpacity onPress={onViewAllAssets}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {!data?.recentAssets || data.recentAssets.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Home size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyRecentTitle}>No assets added yet</Text>
              <Text style={styles.emptyRecentSub}>
                Tap the + button below to scan an invoice or add your first asset
              </Text>
            </View>
          ) : (
            <View style={styles.assetList}>
              {data.recentAssets.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.assetCard}
                  onPress={() => onSelectAsset(asset.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: asset.imageUrl || 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80' }}
                    style={styles.assetImage}
                    resizeMode="cover"
                  />

                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName} numberOfLines={1}>
                      {asset.name}
                    </Text>
                    <Text style={styles.assetLocation}>{asset.location || 'Home'}</Text>

                    {asset.warranty && (
                      <View style={styles.statusPill}>
                        <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.statusText}>{asset.warranty.validLabel}</Text>
                      </View>
                    )}

                    {asset.maintenance && (
                      <View style={[styles.statusPill, { backgroundColor: '#FFFBEB' }]}>
                        <AlertCircle size={12} color="#D97706" style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: '#D97706' }]}>
                          {asset.maintenance.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        </>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#334155',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  waveEmoji: {
    fontSize: 18,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCol: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  kpiValueLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  growthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 13,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  glanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glanceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  glanceIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  glanceIcon: {
    fontSize: 18,
  },
  glanceNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  glanceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 14,
  },
  glanceSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assetImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 14,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  assetLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusDot: {
    fontSize: 8,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  emptyRecentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyRecentIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyRecentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyRecentSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
