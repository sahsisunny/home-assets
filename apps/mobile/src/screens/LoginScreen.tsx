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
  Alert,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { api } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
  onForgotPassword: () => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onForgotPassword,
  onBack,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      if (Platform.OS !== 'web') {
        Alert.alert('Missing Fields', 'Please enter your email or mobile number and password.');
      }
      return;
    }

    if (isLoading) return;
    setIsLoading(true);
    try {
      await api.login(identifier, password);
      onLoginSuccess();
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Login Failed', err.message || 'Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await api.login('google.mobile@example.com', 'SocialLogin@2026');
      onLoginSuccess();
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Social Login Failed', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await api.login('apple.mobile@example.com', 'SocialLogin@2026');
      onLoginSuccess();
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Social Login Failed', err.message);
      }
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
          {onBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={20} color="#1E293B" />
            </TouchableOpacity>
          ) : (
            <View style={{ height: 12 }} />
          )}

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.subtitle}>Welcome back! Enter your credentials to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email or Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com or 98765 43210"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType={identifier.match(/^\d+$/) ? 'phone-pad' : 'email-address'}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Log In CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Google & Apple Social Auth */}
            <SocialAuthButtons
              onGooglePress={handleGoogleLogin}
              onApplePress={handleAppleLogin}
            />
          </View>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onNavigateRegister} activeOpacity={0.7}>
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.footerLink}>Sign up</Text>
              </Text>
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
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    marginTop: 12,
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
    gap: 16,
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
    height: 52,
  },
  eyeButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPasswordText: {
    color: colors.primary.DEFAULT,
    fontSize: 13,
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
    paddingVertical: 20,
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
