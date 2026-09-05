import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, formatINR } from '@home-assets/tokens';
import { api, AssetSummary } from '../services/api';
import { ArrowLeft, SlidersHorizontal, Search, Package } from 'lucide-react-native';

interface AssetListScreenProps {
  onBack: () => void;
  onSelectAsset: (assetId: string) => void;
}

const CATEGORIES = ['All', 'Appliances', 'Electronics', 'Furniture', 'Other'];

export const AssetListScreen: React.FC<AssetListScreenProps> = ({ onBack, onSelectAsset }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAssets = (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    api.getAssets(selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(), searchQuery)
      .then((serverData) => {
        if (serverData && serverData.length > 0) {
          const mapped = serverData.map((item) => ({
            id: item.id,
            name: item.name,
            location: item.location || 'Home',
            price: item.purchasePrice || item.currentValue || 0,
            imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80',
            status: item.warranty?.validLabel || 'Active',
            statusType: item.warranty?.status === 'active' ? 'active' : 'warning',
            category: item.categoryId || 'Other',
          }));
          setAssets(mapped);
        } else {
          setAssets([]);
        }
      })
      .catch(() => setAssets([]))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAssets(true);
  }, [selectedCategory, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAssets(false);
  };

  const filtered = assets.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Assets</Text>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={18} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Assets List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
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
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No assets found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try modifying your search or filter' : 'Tap the + button below to add your first asset'}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.assetCard}
              onPress={() => onSelectAsset(item.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.assetImage} />
              <View style={styles.assetDetails}>
                <Text style={styles.assetName}>{item.name}</Text>
                <Text style={styles.assetLocation}>{item.location}</Text>
                <Text style={styles.assetPrice}>{formatINR(item.price)}</Text>
              </View>

              <View
                style={[
                  styles.badge,
                  item.statusType === 'active' ? styles.badgeActive : styles.badgeWarning,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.statusType === 'active' ? styles.badgeTextActive : styles.badgeTextWarning,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  categoryWrapper: {
    marginVertical: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 24,
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
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  assetDetails: {
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
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'center',
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeWarning: {
    backgroundColor: '#FFFBEB',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#059669',
  },
  badgeTextWarning: {
    color: '#D97706',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
