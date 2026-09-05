import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react-native';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onResetSuccess: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onBack,
  onResetSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Criteria validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch;

  const handleReset = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      onResetSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previous used passwords.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Criteria List matching Mockup Screen 6 */}
            <View style={styles.criteriaContainer}>
              <View style={styles.criterionRow}>
                <View style={[styles.checkCircle, hasMinLength && styles.checkCirclePassed]}>
                  {hasMinLength ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
                  )}
                </View>
                <Text style={[styles.criterionText, hasMinLength && styles.criterionTextPassed]}>
                  At least 8 characters
                </Text>
              </View>

              <View style={styles.criterionRow}>
                <View style={[styles.checkCircle, hasUppercase && styles.checkCirclePassed]}>
                  {hasUppercase ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
                  )}
                </View>
                <Text style={[styles.criterionText, hasUppercase && styles.criterionTextPassed]}>
                  One uppercase letter
                </Text>
              </View>

              <View style={styles.criterionRow}>
                <View style={[styles.checkCircle, hasNumber && styles.checkCirclePassed]}>
                  {hasNumber ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
                  )}
                </View>
                <Text style={[styles.criterionText, hasNumber && styles.criterionTextPassed]}>
                  One number
                </Text>
              </View>

              <View style={styles.criterionRow}>
                <View style={[styles.checkCircle, hasSpecial && styles.checkCirclePassed]}>
                  {hasSpecial ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
                  )}
                </View>
                <Text style={[styles.criterionText, hasSpecial && styles.criterionTextPassed]}>
                  One special character
                </Text>
              </View>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (!isValid || isLoading) && styles.primaryButtonDisabled]}
              onPress={handleReset}
              disabled={!isValid || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 20,
    color: '#1E293B',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 16,
    height: 52,
  },
  eyeIcon: {
    fontSize: 16,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  criteriaContainer: {
    marginVertical: 12,
    gap: 10,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCirclePassed: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '800',
  },
  checkIconPassed: {
    color: '#FFFFFF',
  },
  criterionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  criterionTextPassed: {
    color: '#1E293B',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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
