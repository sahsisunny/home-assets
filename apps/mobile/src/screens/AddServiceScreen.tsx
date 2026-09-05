import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, formatINR } from '@home-assets/tokens';
import { ArrowLeft } from 'lucide-react-native';

interface AddServiceScreenProps {
  assetId?: string;
  assetName?: string;
  onBack: () => void;
  onSaveService: (serviceData: any) => void | Promise<void>;
}

const SERVICE_TYPES = [
  { id: 'scheduled_service', label: 'Routine Service' },
  { id: 'cleaning', label: 'Deep Cleaning' },
  { id: 'filter_replacement', label: 'Filter Replace' },
  { id: 'repair', label: 'Repair Work' },
  { id: 'inspection', label: 'Inspection' },
];

export const AddServiceScreen: React.FC<AddServiceScreenProps> = ({
  assetId,
  assetName = 'General Asset',
  onBack,
  onSaveService,
}) => {
  const [title, setTitle] = useState(`${assetName} Routine Service`);
  const [type, setType] = useState('scheduled_service');
  const [cost, setCost] = useState('');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceProvider, setServiceProvider] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState(() => {
    // Default next service in 6 months
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || isSaving) {
      if (!title.trim() && Platform.OS !== 'web') Alert.alert('Required', 'Please enter a service title.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveService({
        assetId,
        assetName,
        title,
        type,
        cost: parseFloat(cost) || 0,
        serviceDate,
        serviceProvider,
        technicianNotes,
        nextDueDate,
      });
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
        <Text style={styles.headerTitle}>Add Service Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Linked Asset Info Banner */}
        <View style={styles.linkedCard}>
          <Text style={styles.linkedLabel}>Linked Asset</Text>
          <Text style={styles.linkedName}>{assetName}</Text>
        </View>

        {/* Service Type Pills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {SERVICE_TYPES.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={[styles.typePill, type === st.id && styles.typePillActive]}
                onPress={() => setType(st.id)}
              >
                <Text style={[styles.typeText, type === st.id && styles.typeTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Details Card */}
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Service Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AC General Service & Filter Clean"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Service Cost (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ 0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={cost}
                onChangeText={setCost}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Service Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={serviceDate}
                onChangeText={setServiceDate}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Service Provider / Technician</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Urban Company, Brand Center, ABC Services"
              placeholderTextColor="#94A3B8"
              value={serviceProvider}
              onChangeText={setServiceProvider}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Next Due Date (Auto-creates reminder)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Technician Notes & Observations</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="Filter deep cleaned, gas pressure verified, parts replaced..."
              placeholderTextColor="#94A3B8"
              multiline
              value={technicianNotes}
              onChangeText={setTechnicianNotes}
            />
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.saveButton, (!title.trim() || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim() || isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Service Record</Text>
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
  linkedCard: {
    backgroundColor: colors.primary.light,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E3FF',
  },
  linkedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
    textTransform: 'uppercase',
  },
  linkedName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  pillsScroll: {
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  typeTextActive: {
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
