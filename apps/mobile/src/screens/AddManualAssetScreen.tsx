import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, ASSET_CATEGORIES, ASSET_LOCATIONS } from '@home-assets/tokens';

interface AddManualAssetScreenProps {
  onBack: () => void;
  onSaveAsset: (assetData: any) => void | Promise<void>;
}

export const AddManualAssetScreen: React.FC<AddManualAssetScreenProps> = ({
  onBack,
  onSaveAsset,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('appliances');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [seller, setSeller] = useState('');
  const [location, setLocation] = useState('Living Room');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveAsset({
        name,
        categoryId: category,
        brand,
        model,
        serialNumber,
        purchaseDate,
        purchasePrice: parseFloat(purchasePrice) || 0,
        currentValue: parseFloat(purchasePrice) || 0,
        seller,
        location,
        notes,
        warranty: warrantyMonths
          ? {
              provider: brand || 'Brand Warranty',
              endDate: new Date(Date.now() + parseInt(warrantyMonths) * 30 * 24 * 3600 * 1000)
                .toISOString()
                .split('T')[0],
            }
          : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Asset Manually</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Pills */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {ASSET_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, category === cat.id && styles.catPillActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Asset Name *</Text>
            <TextInput
              style={styles.input}
              placeholder={'e.g. Sony Bravia 65" 4K TV'}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sony"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Model Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. KD-65X74L"
                placeholderTextColor="#94A3B8"
                value={model}
                onChangeText={setModel}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Serial Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SN-998822104"
              placeholderTextColor="#94A3B8"
              value={serialNumber}
              onChangeText={setSerialNumber}
            />
          </View>
        </View>

        {/* Purchase & Valuation */}
        <View style={styles.card}>
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Purchase Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ Amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Purchase Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Store / Seller</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Croma, Amazon, Reliance Digital"
              placeholderTextColor="#94A3B8"
              value={seller}
              onChangeText={setSeller}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Location / Room</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {ASSET_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.locPill, location === loc && styles.locPillActive]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={[styles.locText, location === loc && styles.locTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Warranty Settings */}
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Warranty Period (Months)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12, 24, 36"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={warrantyMonths}
              onChangeText={setWarrantyMonths}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="Additional details, warranty registration ID..."
              placeholderTextColor="#94A3B8"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!name.trim() || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
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
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  catScroll: {
    flexDirection: 'row',
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1E293B',
  },
  locPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  locPillActive: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.DEFAULT,
    borderWidth: 1,
  },
  locText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  locTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
