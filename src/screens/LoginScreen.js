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
import { validateEmail, validatePassword } from '../utils/validation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error, setError } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const handleLogin = async () => {
    // Reset messages
    if (error) setError(null);
    setSuccessMessage(null);

    // Perform validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setErrors({});

    // Perform mock authentication via service
    const result = await login(email, password);

    if (result.success) {
      const isAdminAccount = result.user?.isAdmin || result.user?.role === 'admin';
      
      setSuccessMessage(`Login successful! Welcome to FlatMate ${isAdminAccount ? 'Admin' : ''}.`);
      
      if (isAdminAccount) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminDashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    }
  };

  const fillDemoStudent = () => {
    setEmail('student@flatmate.demo');
    setPassword('demo123');
    setErrors({});
    if (error) setError(null);
    setSuccessMessage(null);
  };

  const fillDemoAdmin = () => {
    setEmail('admin@flatmate.demo');
    setPassword('admin123');
    setErrors({});
    if (error) setError(null);
    setSuccessMessage(null);
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
    forgotPasswordText: {
      color: colors.primary,
    },
    demoStudentBox: {
      backgroundColor: colors.accentLight,
      borderColor: isDark ? colors.border : 'rgba(124, 58, 237, 0.2)',
    },
    demoStudentText: {
      color: colors.accent,
    },
    demoAdminBox: {
      backgroundColor: colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    demoAdminText: {
      color: colors.primary,
    },
    footerText: {
      color: colors.textSecondary,
    },
    registerLink: {
      color: colors.primary,
    },
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title="Account Sign In"
        onBack={() => navigation.navigate('Welcome')}
      />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.titleSection}>
          <VerifiedBadge label="Verified Student & Admin Access" style={{ marginBottom: SPACING.xs }} />
          <Text style={[styles.heading, dynamicStyles.heading]}>Welcome back to FlatMate</Text>
          <Text style={[styles.subheading, dynamicStyles.subheading]}>
            Sign in with your student credentials or admin access code.
          </Text>
        </View>

        {/* Global Error Banner */}
        {error && (
          <View style={[styles.errorBanner, dynamicStyles.errorBanner]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
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
          {/* Email Input */}
          <Input
            label="Email Address"
            placeholder="e.g. student@flatmate.demo"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
              if (error) setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            error={errors.email}
            helperText="Student: student@flatmate.demo | Admin: admin@flatmate.demo"
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
              if (error) setError(null);
            }}
            secureTextEntry={true}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            error={errors.password}
            helperText="Student pass: demo123 | Admin pass: admin123"
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotPasswordText, dynamicStyles.forgotPasswordText]}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button with Loading state */}
          <Button
            title="Log In"
            variant="gradient"
            size="large"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitBtn}
          />

          {/* Quick Demo Fill Buttons */}
          <View style={{ gap: SPACING.xs, marginTop: SPACING.xs }}>
            <TouchableOpacity
              style={[styles.demoBox, dynamicStyles.demoStudentBox, shadows.small]}
              onPress={fillDemoStudent}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={18} color={colors.accent} />
              <Text style={[styles.demoText, dynamicStyles.demoStudentText]}>Auto-fill Student (student@flatmate.demo)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBox, dynamicStyles.demoAdminBox, shadows.small]}
              onPress={fillDemoAdmin}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" size={18} color={colors.primary} />
              <Text style={[styles.demoText, dynamicStyles.demoAdminText]}>Auto-fill Admin (admin@flatmate.demo)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Navigation Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, dynamicStyles.footerText]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerLink, dynamicStyles.registerLink]}> Register</Text>
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
    fontWeight: '600',
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
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: SPACING.md,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

