import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import { api } from '../services/api';
import {
  ArrowLeft,
  SlidersHorizontal,
  Receipt,
  ShieldCheck,
  BookOpen,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

interface DocumentsScreenProps {
  onBack?: () => void;
  onAddDocument?: () => void;
}

const DOC_TABS = ['All', 'Invoice', 'Warranty', 'Manual', 'Other'];

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ onBack, onAddDocument }) => {
  const [selectedTab, setSelectedTab] = useState('All');
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDocuments = (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    api.getDocuments(selectedTab === 'All' ? undefined : selectedTab.toLowerCase())
      .then((serverDocs) => {
        if (serverDocs && serverDocs.length > 0) {
          const mapped = serverDocs.map((d: any) => ({
            id: d.id,
            title: d.name || d.type,
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            ext: d.mimeType?.includes('pdf') ? 'PDF' : 'JPG',
            size: d.fileSizeBytes ? `${Math.round(d.fileSizeBytes / 1024)} KB` : '500 KB',
            docType: d.type || 'other',
            type: d.type ? (d.type.charAt(0).toUpperCase() + d.type.slice(1)) : 'Other',
          }));
          setDocs(mapped);
        } else {
          setDocs([]);
        }
      })
      .catch(() => setDocs([]))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDocuments(true);
  }, [selectedTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDocuments(false);
  };

  const filtered = docs.filter((d) => selectedTab === 'All' || d.type === selectedTab);

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
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={18} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {DOC_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.pill, selectedTab === tab && styles.pillActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.pillText, selectedTab === tab && styles.pillTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Documents List */}
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
            <Text style={[styles.emptySub, { marginTop: 12 }]}>Loading documents...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySub}>
              Tap the button below to upload invoices, warranties, or manuals
            </Text>
          </View>
        ) : (
          filtered.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.docCard} activeOpacity={0.8}>
              <View style={styles.docIconBox}>
                {doc.docType === 'invoice' ? (
                  <Receipt size={22} color={colors.primary.DEFAULT} />
                ) : doc.docType === 'warranty' ? (
                  <ShieldCheck size={22} color="#059669" />
                ) : doc.docType === 'manual' ? (
                  <BookOpen size={22} color="#D97706" />
                ) : (
                  <FileText size={22} color={colors.primary.DEFAULT} />
                )}
              </View>

              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta}>
                  {doc.date} • {doc.ext}
                </Text>
                <Text style={styles.docSize}>{doc.size}</Text>
              </View>

              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Document CTA */}
      <View style={styles.bottomCtaContainer}>
        <TouchableOpacity style={styles.addDocBtn} onPress={onAddDocument} activeOpacity={0.85}>
          <Text style={styles.addDocBtnText}>+ Add Document</Text>
        </TouchableOpacity>
      </View>
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
  filterBtn: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 18,
  },
  tabWrapper: {
    marginVertical: 14,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 90,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docEmoji: {
    fontSize: 22,
  },
  docInfo: {
    flex: 1,
    marginLeft: 14,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  docMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docSize: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  bottomCtaContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  addDocBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addDocBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
