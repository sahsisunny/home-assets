import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@home-assets/tokens';

interface OtpScreenProps {
  phoneNumber?: string;
  onVerifySuccess: () => void;
  onBack: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  phoneNumber = '',
  onVerifySuccess,
  onBack,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(28);
  const [isLoading, setIsLoading] = useState(false);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    if (isLoading) return;
    const code = otp.join('');
    if (code.length < 6) {
      alert('Please enter the full 6-digit OTP code');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      onVerifySuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>{' '}
            <Text style={styles.changeLink}>Change</Text>
          </Text>
        </View>

        {/* 6 Digit OTP Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, idx) => (
            <View key={idx} style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}>
              <TextInput
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, idx)}
              />
            </View>
          ))}
        </View>

        {/* Resend Timer */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>
            Resend code in <Text style={styles.timerText}>00:{timer < 10 ? `0${timer}` : timer}</Text>
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  backArrow: {
    fontSize: 20,
    color: '#1E293B',
  },
  header: {
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 22,
  },
  phoneNumber: {
    color: '#1E293B',
    fontWeight: '700',
  },
  changeLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 32,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.light,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    width: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerText: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
