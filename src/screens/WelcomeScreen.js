import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

const { width } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }) => {
  const { colors, isDark, shadows, toggleTheme } = useTheme();

  const dynamicStyles = {
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.xs,
      marginBottom: SPACING.md,
    },
    brandName: {
      color: colors.textPrimary,
    },
    themeToggleBtn: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroCard: {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderColor: colors.border,
      padding: SPACING.lg,
      borderRadius: RADIUS.xl,
      marginBottom: SPACING.lg,
    },
    mainHeading: {
      color: colors.textPrimary,
    },
    highlightText: {
      color: colors.primary,
    },
    subHeading: {
      color: colors.textSecondary,
    },
    trustCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    trustIconBoxContainer: (bgColor) => ({
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : bgColor,
    }),
    trustTitle: {
      color: colors.textPrimary,
    },
    trustDesc: {
      color: colors.textSecondary,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: SPACING.xs,
      marginBottom: SPACING.xs,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    loginLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    termsDisclaimer: {
      color: colors.textMuted,
    },
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.contentContainer}>
        {/* 1. TOP AREA: BRANDING & THEME TOGGLE */}
        <View style={dynamicStyles.topHeader}>
          <View style={styles.brandRow}>
            <LinearGradient
              colors={colors.gradientPrimary || ['#6366F1', '#8B5CF6']}
              style={styles.logoBadge}
            >
              <Ionicons name="home" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.brandName, dynamicStyles.brandName]}>{APP_CONFIG.appName}</Text>
          </View>

          <TouchableOpacity
            style={[dynamicStyles.themeToggleBtn, shadows.small]}
            onPress={toggleTheme}
            activeOpacity={0.8}
            accessibilityLabel="Toggle Theme"
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={isDark ? '#FBBF24' : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* 2. HERO SECTION */}
        <View style={[styles.heroSection, dynamicStyles.heroCard, shadows.medium]}>
          <View style={styles.badgeWrapper}>
            <VerifiedBadge label="Campus Verified Network" />
          </View>

          <Text style={[styles.mainHeading, dynamicStyles.mainHeading]}>
            Find Your Perfect <Text style={dynamicStyles.highlightText}>Student Space</Text>
          </Text>

          <Text style={[styles.subHeading, dynamicStyles.subHeading]}>
            Connect with verified students, find suitable flatmates and discover trusted hostels with ease.
          </Text>

          {/* Quick Stats Pill Row */}
          <View style={styles.quickPillsRow}>
            <View style={[styles.pillChip, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.primary }]}>100% Student Verified</Text>
            </View>
            <View style={[styles.pillChip, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
              <Text style={[styles.pillText, { color: colors.verified }]}>Safe & Trusted</Text>
            </View>
          </View>
        </View>

        {/* 3. TRUST FEATURES SECTION */}
        <View style={styles.trustSection}>
          {/* Feature 1 */}
          <View style={[styles.trustCard, dynamicStyles.trustCard, shadows.small]}>
            <View style={[styles.trustIconBox, dynamicStyles.trustIconBoxContainer('#EEF2FF')]}>
              <Ionicons name="school" size={22} color={colors.primary} />
            </View>
            <View style={styles.trustTextBox}>
              <Text style={[styles.trustTitle, dynamicStyles.trustTitle]}>✓ Verified Students</Text>
              <Text style={[styles.trustDesc, dynamicStyles.trustDesc]}>
                Authentic college students verified with university email & student IDs.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={[styles.trustCard, dynamicStyles.trustCard, shadows.small]}>
            <View style={[styles.trustIconBox, dynamicStyles.trustIconBoxContainer('#ECFDF5')]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.verified} />
            </View>
            <View style={styles.trustTextBox}>
              <Text style={[styles.trustTitle, dynamicStyles.trustTitle]}>🛡 Safe Connections</Text>
              <Text style={[styles.trustDesc, dynamicStyles.trustDesc]}>
                In-app student chat, lifestyle compatibility matching, and safety tools.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={[styles.trustCard, dynamicStyles.trustCard, shadows.small]}>
            <View style={[styles.trustIconBox, dynamicStyles.trustIconBoxContainer('#F5F3FF')]}>
              <Ionicons name="home" size={22} color={colors.accent} />
            </View>
            <View style={styles.trustTextBox}>
              <Text style={[styles.trustTitle, dynamicStyles.trustTitle]}>🏠 Find Your Space</Text>
              <Text style={[styles.trustDesc, dynamicStyles.trustDesc]}>
                Browse verified room openings, flatmate profiles, and campus listings.
              </Text>
            </View>
          </View>
        </View>

        {/* 4. PRIMARY & SECONDARY ACTIONS */}
        <View style={styles.actionSection}>
          {/* Primary Action Button */}
          <Button
            title="Get Started"
            variant="gradient"
            size="large"
            onPress={() => navigation.navigate('Register')}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            style={styles.primaryButton}
          />

          {/* Secondary Action */}
          <View style={dynamicStyles.footerRow}>
            <Text style={dynamicStyles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={dynamicStyles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Disclaimer */}
          <Text style={[styles.termsDisclaimer, dynamicStyles.termsDisclaimer]}>
            By continuing, you agree to FlatMate's Terms of Service & Privacy Policy.
          </Text>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs + 2,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSection: {
    borderWidth: 1,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: SPACING.xs + 2,
    letterSpacing: -0.5,
  },
  subHeading: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trustSection: {
    marginBottom: SPACING.lg,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
  },
  trustIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  trustTextBox: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionSection: {
    width: '100%',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
  termsDisclaimer: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    fontSize: 12,
    marginTop: SPACING.md,
  },
});

