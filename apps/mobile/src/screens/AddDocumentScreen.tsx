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
import * as DocumentPicker from 'expo-document-picker';
import { colors, DOCUMENT_TYPES } from '@home-assets/tokens';
import {
  ArrowLeft,
  Receipt,
  ShieldCheck,
  BookOpen,
  FileText,
  Paperclip,
} from 'lucide-react-native';

interface AddDocumentScreenProps {
  assetId?: string;
  assetName?: string;
  onBack: () => void;
  onSaveDocument: (docData: any) => void | Promise<void>;
}

export const AddDocumentScreen: React.FC<AddDocumentScreenProps> = ({
  assetId,
  assetName = 'General Household Asset',
  onBack,
  onSaveDocument,
}) => {
  const [selectedType, setSelectedType] = useState('invoice');
  const [docName, setDocName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name || 'document.pdf');
        setFileSelected(true);
        if (file.size) setFileSizeBytes(file.size);

        if (file.uri) {
          try {
            const resp = await fetch(file.uri);
            const blob = await resp.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setFileData(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } catch {
            // keep uri
          }
        }
      }
    } catch {
      if (Platform.OS !== 'web') {
        Alert.alert('File Selection', 'Unable to pick file. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!docName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveDocument({
        assetId,
        assetName,
        type: selectedType,
        name: docName,
        fileName,
        fileData,
        mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        fileSizeBytes,
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
        <Text style={styles.headerTitle}>Add Document</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Linked Asset */}
        <View style={styles.linkedAssetCard}>
          <Text style={styles.linkedLabel}>Linked Asset</Text>
          <Text style={styles.linkedName}>{assetName}</Text>
        </View>

        {/* Document Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Document Type *</Text>
          <View style={styles.typesGrid}>
            {DOCUMENT_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, isSelected && styles.typeCardActive]}
                  onPress={() => {
                    setSelectedType(type.id);
                    setDocName(`${type.label} - ${assetName}`);
                  }}
                >
                  {type.id === 'invoice' ? (
                    <Receipt size={22} color={isSelected ? colors.primary.DEFAULT : '#64748B'} />
                  ) : type.id === 'warranty' ? (
                    <ShieldCheck size={22} color={isSelected ? colors.primary.DEFAULT : '#64748B'} />
                  ) : type.id === 'manual' ? (
                    <BookOpen size={22} color={isSelected ? colors.primary.DEFAULT : '#64748B'} />
                  ) : (
                    <FileText size={22} color={isSelected ? colors.primary.DEFAULT : '#64748B'} />
                  )}
                  <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Document Details */}
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Document Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Croma Official Invoice"
              placeholderTextColor="#94A3B8"
              value={docName}
              onChangeText={setDocName}
            />
          </View>

          {/* File Upload Box */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>File Attachment</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handlePickDocument}
              activeOpacity={0.8}
            >
              <Paperclip size={24} color={colors.primary.DEFAULT} />
              <Text style={styles.uploadMainText}>
                {fileSelected ? fileName : 'Tap to select PDF or image from device'}
              </Text>
              <Text style={styles.uploadSubText}>PDF, JPG, PNG up to 25MB</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.primaryButton, (!docName.trim() || isSaving) && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={!docName.trim() || isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Save Document</Text>
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
    paddingBottom: 32,
  },
  linkedAssetCard: {
    backgroundColor: colors.primary.light,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E3FF',
  },
  linkedLabel: {
    fontSize: 11,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeCardActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.light,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  formCard: {
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
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FD',
    gap: 4,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadMainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  uploadSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  primaryButton: {
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
