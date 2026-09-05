import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import { ArrowLeft, Calendar } from 'lucide-react-native';

interface ReviewExtractedDataScreenProps {
  initialData?: any;
  onBack: () => void;
  onSaveAsset: (assetData: any) => void | Promise<void>;
}

export const ReviewExtractedDataScreen: React.FC<ReviewExtractedDataScreenProps> = ({
  initialData,
  onBack,
  onSaveAsset,
}) => {
  const [formData, setFormData] = useState({
    category: initialData?.category || 'Electronics',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    serialNumber: initialData?.serialNumber || '',
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
    purchasePrice: initialData?.purchasePrice || '',
    seller: initialData?.seller || '',
    warrantyValidTill: initialData?.warrantyValidTill || '12 Months',
    productName: initialData?.productName || 'Household Asset',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSaveAsset(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Asset Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Please review and confirm the details</Text>

        {/* Product Snippet Header */}
        <View style={styles.productHero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80' }}
            style={styles.heroThumbnail}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.productName}>{formData.productName}</Text>
            <Text style={styles.modelCode}>{formData.model}</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          {/* Category */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.category}
              onChangeText={(v) => handleChange('category', v)}
            />
          </View>

          {/* Brand */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Brand</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.brand}
              onChangeText={(v) => handleChange('brand', v)}
            />
          </View>

          {/* Model */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.model}
              onChangeText={(v) => handleChange('model', v)}
            />
          </View>

          {/* Serial Number */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Serial Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.serialNumber}
              onChangeText={(v) => handleChange('serialNumber', v)}
            />
          </View>

          {/* Purchase Date */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Purchase Date</Text>
            <View style={styles.dateInputWrapper}>
              <TextInput
                style={styles.fieldInput}
                value={formData.purchaseDate}
                onChangeText={(v) => handleChange('purchaseDate', v)}
              />
              <Calendar size={14} color="#64748B" style={{ marginLeft: 6 }} />
            </View>
          </View>

          {/* Purchase Price */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Purchase Price</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={[styles.fieldInput, styles.priceInput]}
                value={formData.purchasePrice}
                onChangeText={(v) => handleChange('purchasePrice', v)}
              />
            </View>
          </View>

          {/* Seller */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Seller</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.seller}
              onChangeText={(v) => handleChange('seller', v)}
            />
          </View>

          {/* Warranty Valid Till */}
          <View style={[styles.fieldRow, styles.lastFieldRow]}>
            <Text style={styles.fieldLabel}>Warranty Valid Till</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.warrantyValidTill}
              onChangeText={(v) => handleChange('warrantyValidTill', v)}
            />
          </View>
        </View>

        {/* Save Asset Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Asset</Text>
          )}
        </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  productHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  heroInfo: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modelCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastFieldRow: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  fieldInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
    flex: 1.2,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.2,
  },
  calendarIcon: {
    fontSize: 14,
    marginLeft: 6,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.2,
  },
  rupeePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 2,
  },
  priceInput: {
    flex: 0,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
