import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, formatINR } from '@home-assets/tokens';
import { api, AssetSummary } from '../services/api';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react-native';

interface AnalyticsScreenProps {
  onBack?: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [totalMaintenanceSpend, setTotalMaintenanceSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [assetsData, servicesData] = await Promise.all([
        api.getAssets(),
        api.getServices(),
      ]);
      setAssets(assetsData || []);
      setTotalMaintenanceSpend(servicesData?.totalSpend || 0);
    } catch {
      // keep previous state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  const totalPurchaseValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || Number(a.purchasePrice) || 0), 0);

  // Group by category
  const categoryMap: { [key: string]: { total: number; count: number; name: string } } = {
    electronics: { total: 0, count: 0, name: 'Electronics' },
    appliances: { total: 0, count: 0, name: 'Appliances' },
    furniture: { total: 0, count: 0, name: 'Furniture' },
    vehicles: { total: 0, count: 0, name: 'Vehicles' },
    equipment: { total: 0, count: 0, name: 'Equipment' },
    other: { total: 0, count: 0, name: 'Other' },
  };

  assets.forEach((a) => {
    const cat = (a.categoryId || 'other').toLowerCase();
    const price = Number(a.purchasePrice) || 0;
    if (categoryMap[cat]) {
      categoryMap[cat].total += price;
      categoryMap[cat].count += 1;
    } else {
      categoryMap.other.total += price;
      categoryMap.other.count += 1;
    }
  });

  const categories = Object.values(categoryMap).filter((c) => c.count > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Household Analytics</Text>
        <View style={{ width: 24 }} />
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
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <>
            {/* Top Overview KPI Card */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Total Portfolio Value</Text>
              <Text style={styles.overviewValue}>{formatINR(totalPurchaseValue)}</Text>

              <View style={styles.kpiRow}>
                <View style={styles.kpiSubCol}>
                  <Text style={styles.kpiSubLabel}>Est. Current Value</Text>
                  <Text style={styles.kpiSubValue}>{formatINR(totalCurrentValue)}</Text>
                </View>

                <View style={styles.kpiDivider} />

                <View style={styles.kpiSubCol}>
                  <Text style={styles.kpiSubLabel}>Maintenance Spend</Text>
                  <Text style={[styles.kpiSubValue, { color: '#B45309' }]}>
                    {formatINR(totalMaintenanceSpend)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Spending Breakdown by Category */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Category Distribution</Text>
              <Text style={styles.sectionSub}>Asset investment by household category</Text>

              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No assets added yet to calculate distribution.</Text>
              ) : (
                <View style={styles.categoryList}>
                  {categories.map((c) => {
                    const percent = totalPurchaseValue > 0 ? Math.round((c.total / totalPurchaseValue) * 100) : 0;
                    return (
                      <View key={c.name} style={styles.categoryItem}>
                        <View style={styles.catHeader}>
                          <Text style={styles.catName}>{c.name} ({c.count})</Text>
                          <Text style={styles.catAmount}>{formatINR(c.total)} ({percent}%)</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${Math.max(percent, 4)}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Asset Coverage & Protection Health */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Protection Health</Text>
              <View style={styles.healthRow}>
                <View style={[styles.healthChip, { backgroundColor: '#ECFDF5' }]}>
                  <ShieldCheck size={22} color="#059669" style={{ marginBottom: 4 }} />
                  <Text style={styles.healthTitle}>Warranty Coverage</Text>
                  <Text style={[styles.healthVal, { color: '#059669' }]}>
                    {assets.filter((a) => a.warranty?.status === 'active').length} of {assets.length} Active
                  </Text>
                </View>

                <View style={[styles.healthChip, { backgroundColor: '#EEF0FF' }]}>
                  <FileText size={22} color={colors.primary.DEFAULT} style={{ marginBottom: 4 }} />
                  <Text style={styles.healthTitle}>Invoice Backup</Text>
                  <Text style={[styles.healthVal, { color: colors.primary.DEFAULT }]}>
                    {assets.filter((a) => (a.documentsCount || 0) > 0).length} of {assets.length} Backed up
                  </Text>
                </View>
              </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 30,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  kpiSubCol: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  kpiSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  kpiSubValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingVertical: 10,
  },
  categoryList: {
    gap: 14,
  },
  categoryItem: {
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 4,
  },
  healthRow: {
    flexDirection: 'row',
    gap: 12,
  },
  healthChip: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  healthTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  healthVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
