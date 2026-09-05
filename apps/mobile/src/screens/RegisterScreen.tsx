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
  Alert,
  Platform,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { User, Mail, Phone, Lock, Check } from 'lucide-react-native';
import { api } from '../services/api';

interface RegisterScreenProps {
  onRegisterSubmit: (phone: string) => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSubmit,
  onNavigateLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      if (Platform.OS !== 'web') Alert.alert('Missing Field', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      if (Platform.OS !== 'web') Alert.alert('Missing Field', 'Please enter your email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      if (Platform.OS !== 'web') Alert.alert('Missing Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 8) {
      if (Platform.OS !== 'web') Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      if (Platform.OS !== 'web') Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);
    try {
      await api.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        agreeToTerms: agreeTerms,
      });
      onRegisterSubmit(phone);
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Failed', err.message || 'Could not create account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const socialEmail = provider === 'google' ? 'google.mobile@example.com' : 'apple.mobile@example.com';
      await api.login(socialEmail, 'SocialLogin@2026');
      onRegisterSubmit('9876543210');
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Social Sign Up', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Let's get started with your home asset portfolio</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Full Name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneInputWrapper}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Phone size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Min 8 characters (A-Z, 0-9, special)"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Terms & Conditions Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms && <Check size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.primaryButton, (!agreeTerms || isLoading) && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={!agreeTerms || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Social Sign Up */}
          <SocialAuthButtons
            onGooglePress={() => handleSocialSignUp('google')}
            onApplePress={() => handleSocialSignUp('apple')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onNavigateLogin} activeOpacity={0.7}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 14,
    height: 50,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCode: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  termsText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  termsLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
