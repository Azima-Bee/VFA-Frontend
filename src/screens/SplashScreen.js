import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }) => {
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;

    const timer = setTimeout(() => {
      if (user) {
        const isAdmin = user.isAdmin || user.role === 'admin';
        navigation.replace(isAdmin ? 'AdminDashboard' : 'Home');
      } else {
        navigation.replace('Welcome');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation, user, isInitializing]);

  const handleSkip = () => {
    if (user) {
      const isAdmin = user.isAdmin || user.role === 'admin';
      navigation.replace(isAdmin ? 'AdminDashboard' : 'Home');
    } else {
      navigation.replace('Welcome');
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#3730A3', '#4F46E5', '#7C3AED']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Main Logo Container */}
          <View style={[styles.logoCard, SHADOWS.large]}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.logoGradient}
            >
              <Ionicons name="home" size={48} color={COLORS.textWhite} />
              <View style={styles.badgeOverlay}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.verified} />
              </View>
            </LinearGradient>
          </View>

          {/* App Title */}
          <Text style={styles.appName}>{APP_CONFIG.appName}</Text>

          {/* Verified Student Pill */}
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.verified} />
            <Text style={styles.verifiedText}>Student Verification Platform</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>"{APP_CONFIG.tagline}"</Text>
        </View>

        {/* Footer Navigation Trigger */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={handleSkip}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 2,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  verifiedText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    maxWidth: width * 0.75,
    lineHeight: 24,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    ...SHADOWS.medium,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
});
