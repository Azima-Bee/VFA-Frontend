import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { validateEmail } from '../utils/validation';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword, isLoading, error, setError } = useAuth();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleResetPassword = async () => {
    // Reset message states
    if (error) setError(null);
    setEmailError(null);
    setSuccessMessage(null);

    // Validate email
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    // Call reset password service method
    const result = await resetPassword(email);

    if (result.success) {
      const msg = 'Password reset link has been sent to your email.';
      setSuccessMessage(msg);
      Alert.alert('Reset Link Sent', msg, [
        {
          text: 'Back to Login',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    }
  };

  const dynamicStyles = {
    heading: {
      color: colors.textPrimary,
    },
    subheading: {
      color: colors.textSecondary,
    },
    errorBanner: {
      backgroundColor: colors.errorLight,
      borderColor: isDark ? colors.border : 'rgba(239, 68, 68, 0.3)',
    },
    errorBannerText: {
      color: colors.error,
    },
    successBanner: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      borderColor: isDark ? colors.border : 'rgba(16, 185, 129, 0.3)',
    },
    successBannerText: {
      color: colors.success,
    },
    backToLoginText: {
      color: colors.primary,
    },
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title="Password Recovery"
        onBack={() => navigation.navigate('Login')}
      />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.titleSection}>
          <VerifiedBadge label="Account Recovery" style={{ marginBottom: SPACING.xs }} />
          <Text style={[styles.heading, dynamicStyles.heading]}>Forgot Password?</Text>
          <Text style={[styles.subheading, dynamicStyles.subheading]}>
            Enter your student email address below and we'll send you instructions to reset your password.
          </Text>
        </View>

        {/* Global Error Banner */}
        {error && (
          <View style={[styles.errorBanner, dynamicStyles.errorBanner]}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, dynamicStyles.errorBannerText]}>{error}</Text>
          </View>
        )}

        {/* Success Banner */}
        {successMessage && (
          <View style={[styles.successBanner, dynamicStyles.successBanner]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.successBannerText, dynamicStyles.successBannerText]}>{successMessage}</Text>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          <Input
            label="Student Email Address"
            placeholder="e.g. student@flatmate.demo"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            error={emailError}
            helperText="Enter the email associated with your FlatMate account"
          />

          <Button
            title="Send Reset Link"
            variant="gradient"
            size="large"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitBtn}
          />
        </View>

        {/* Back to Login Link */}
        <View style={styles.footerRow}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.primary} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.backToLoginText, dynamicStyles.backToLoginText]}> Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.md,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  heading: {
    ...TYPOGRAPHY.h1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  subheading: {
    ...TYPOGRAPHY.body,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

