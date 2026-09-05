import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '@home-assets/tokens';
import { ArrowLeft, Camera, Pencil, FileText, ChevronRight } from 'lucide-react-native';

interface AddAssetMethodScreenProps {
  onBack: () => void;
  onSelectScan: () => void;
  onSelectManual: () => void;
  onSelectWithoutInvoice: () => void;
}

export const AddAssetMethodScreen: React.FC<AddAssetMethodScreenProps> = ({
  onBack,
  onSelectScan,
  onSelectManual,
  onSelectWithoutInvoice,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Asset - Choose Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.sectionHeading}>Add New Asset</Text>
          <Text style={styles.sectionSubtitle}>Choose how you want to add your asset</Text>
        </View>

        {/* Method 1 — Scan Invoice (Primary / Recommended) */}
        <TouchableOpacity style={styles.methodCard} onPress={onSelectScan} activeOpacity={0.85}>
          <View style={[styles.iconBox, { backgroundColor: '#EEF0FF' }]}>
            <Camera size={22} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.methodTextCol}>
            <Text style={styles.methodTitle}>Scan Invoice / Receipt</Text>
            <Text style={styles.methodDesc}>
              Take a photo of your invoice or receipt. We'll extract details automatically.
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Method 2 — Add Manually */}
        <TouchableOpacity style={styles.methodCard} onPress={onSelectManual} activeOpacity={0.85}>
          <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
            <Pencil size={22} color="#475569" />
          </View>
          <View style={styles.methodTextCol}>
            <Text style={styles.methodTitle}>Add Manually</Text>
            <Text style={styles.methodDesc}>Enter asset details manually.</Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Method 3 — Add Without Invoice */}
        <TouchableOpacity
          style={styles.methodCard}
          onPress={onSelectWithoutInvoice}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
            <FileText size={22} color="#475569" />
          </View>
          <View style={styles.methodTextCol}>
            <Text style={styles.methodTitle}>Add Without Invoice</Text>
            <Text style={styles.methodDesc}>
              Add asset details without invoice. You can add documents later.
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: {
    fontSize: 24,
  },
  methodTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  methodDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 24,
    color: '#94A3B8',
    marginLeft: 8,
  },
});
