import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '@home-assets/tokens';
import { api } from '../services/api';
import {
  FileText,
  X,
  Zap,
  AlertTriangle,
  Receipt,
  Image as ImageIcon,
  Check,
} from 'lucide-react-native';

interface ScanInvoiceScreenProps {
  onBack: () => void;
  onScanComplete: (extractedData: any) => void;
}

export const ScanInvoiceScreen: React.FC<ScanInvoiceScreenProps> = ({ onBack, onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const steps = [
    'Reading invoice document',
    'Analyzing with AI',
    'Extracting product & price details',
    'Validating information...',
  ];

  const processImage = async (base64: string, mimeType: string = 'image/jpeg') => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressStep(0);

    const stepInterval = setInterval(() => {
      setProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);

    try {
      const result = await api.extractInvoice(base64, mimeType);
      clearInterval(stepInterval);
      setProgressStep(3);

      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsProcessing(false);

      if (!result.success || !result.data?.primaryItem) {
        throw new Error('Unable to scan invoice.');
      }

      const item = result.data.primaryItem;
      onScanComplete({
        category: item.category
          ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
          : 'Electronics',
        brand: item.brand || '',
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        purchaseDate: result.data.invoiceDate || new Date().toISOString().split('T')[0],
        purchasePrice: item.totalPrice ? item.totalPrice.toLocaleString('en-IN') : '',
        seller: result.data.seller || '',
        warrantyValidTill: item.warrantyMonths ? `${item.warrantyMonths} Months` : '12 Months',
        productName: item.productName || 'Household Asset',
      });
    } catch {
      clearInterval(stepInterval);
      setIsProcessing(false);
      const simpleError = 'Unable to scan invoice. Please try again or enter details manually.';
      setErrorMessage(simpleError);
      if (Platform.OS !== 'web') {
        Alert.alert('Scan Failed', simpleError);
      }
    }
  };

  const handlePickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64 && asset.uri) {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        if (base64) {
          const mimeType = asset.mimeType || (asset.uri?.endsWith('.png') ? 'image/png' : 'image/jpeg');
          await processImage(base64, mimeType);
        }
      }
    } catch {
      const simpleError = 'Unable to scan invoice. Please try again or enter details manually.';
      setErrorMessage(simpleError);
      if (Platform.OS !== 'web') {
        Alert.alert('Scan Failed', simpleError);
      }
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        // Fallback to gallery picker if camera permission is denied
        await handlePickGallery();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64 && asset.uri) {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        if (base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          await processImage(base64, mimeType);
        }
      }
    } catch {
      const simpleError = 'Unable to scan invoice. Please try again or enter details manually.';
      setErrorMessage(simpleError);
      if (Platform.OS !== 'web') {
        Alert.alert('Scan Failed', simpleError);
      }
    }
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.containerProcessing}>
        <View style={styles.processingContent}>
          <View style={styles.pulseIconContainer}>
            <FileText size={36} color="#5C4EBA" />
          </View>

          <Text style={styles.processingTitle}>Scanning Invoice...</Text>
          <Text style={styles.processingSub}>Extracting details with AI</Text>

          {/* Extraction Checklist */}
          <View style={styles.checklist}>
            {steps.map((step, idx) => {
              const isDone = idx < progressStep;
              const isCurrent = idx === progressStep;
              return (
                <View key={idx} style={styles.checkRow}>
                  <View
                    style={[
                      styles.checkCircle,
                      isDone && styles.checkCircleDone,
                      isCurrent && styles.checkCircleCurrent,
                    ]}
                  >
                    {isDone ? (
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
                    ) : (
                      <View style={styles.dotPending} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.checkText,
                      isDone && styles.checkTextDone,
                      isCurrent && styles.checkTextCurrent,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerCamera}>
      {/* Top Controls */}
      <View style={styles.cameraHeader}>
        <TouchableOpacity style={styles.controlBtn} onPress={onBack}>
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Scan Invoice</Text>
        <TouchableOpacity style={styles.controlBtn}>
          <Zap size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Simple Generic Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={18} color="#991B1B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setErrorMessage(null)}>
            <X size={16} color="#991B1B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Viewfinder Area */}
      <View style={styles.viewfinderArea}>
        <View style={styles.invoiceFrame}>
          <View style={styles.scannerCornerTL} />
          <View style={styles.scannerCornerTR} />
          <View style={styles.scannerCornerBL} />
          <View style={styles.scannerCornerBR} />

          <View style={styles.viewfinderContent}>
            <Receipt size={48} color="#38BDF8" style={{ marginBottom: 12 }} />
            <Text style={styles.viewfinderTitle}>Align Invoice in Frame</Text>
            <Text style={styles.viewfinderSub}>
              Ensure items, serial numbers, and totals are clearly visible
            </Text>
          </View>

          <View style={styles.guideBadge}>
            <Text style={styles.guideText}>AI automatically extracts details</Text>
          </View>
        </View>
      </View>

      {/* Bottom Shutter Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton} onPress={onBack}>
          <Text style={styles.galleryText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterButton} onPress={handleCaptureCamera} activeOpacity={0.85}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryButton} onPress={handlePickGallery}>
          <ImageIcon size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerCamera: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  controlBtn: {
    padding: 6,
  },
  controlIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  cameraTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 15,
    padding: 4,
  },
  viewfinderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  invoiceFrame: {
    width: '94%',
    height: '84%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#38BDF8',
    borderTopLeftRadius: 18,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#38BDF8',
    borderTopRightRadius: 18,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#38BDF8',
    borderBottomLeftRadius: 18,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#38BDF8',
    borderBottomRightRadius: 18,
  },
  viewfinderContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  viewfinderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  viewfinderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  viewfinderSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  guideBadge: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  guideText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  galleryIcon: {
    fontSize: 26,
  },
  containerProcessing: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    width: '85%',
    alignItems: 'center',
  },
  pulseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseEmoji: {
    fontSize: 36,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  processingSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 28,
  },
  checklist: {
    width: '100%',
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#10B981',
  },
  checkCircleCurrent: {
    backgroundColor: '#EEF0FF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  checkTextDone: {
    color: '#1E293B',
    fontWeight: '600',
  },
  checkTextCurrent: {
    color: '#5C4EBA',
    fontWeight: '700',
  },
});
