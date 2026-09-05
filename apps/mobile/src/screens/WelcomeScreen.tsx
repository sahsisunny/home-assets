import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '@home-assets/tokens';
import { Home, Tv, Armchair, Sparkles, ShieldCheck } from 'lucide-react-native';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Logo Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.logoBadge}>
            <Home size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Hero Visual Card */}
        <View style={styles.heroCard}>
          <View style={styles.mockLivingRoom}>
            <Armchair size={36} color={colors.primary.DEFAULT} />
            <Tv size={36} color={colors.primary.DEFAULT} />
            <Sparkles size={36} color={colors.primary.DEFAULT} />
            <ShieldCheck size={36} color={colors.primary.DEFAULT} />
          </View>
        </View>

        {/* Hero Heading & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Your Home. Organized.{'\n'}
            <Text style={styles.highlightText}>Always Protected.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Track your home assets, warranties, documents and maintenance — all in one place.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onGetStarted} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.secondaryText}>
              Already have an account? <Text style={styles.loginLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  heroCard: {
    backgroundColor: colors.primary.light,
    borderRadius: 24,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E0E3FF',
  },
  mockLivingRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 34,
  },
  highlightText: {
    color: colors.primary.DEFAULT,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
