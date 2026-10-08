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
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateFullName,
  validateUniversity,
  validateCourse,
  validateYearOfStudy,
} from '../utils/validation';
import { UNIVERSITIES } from '../data/mockData';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'];
const COMMON_COURSES = ['Computer Science', 'Business & Finance', 'Engineering', 'Medicine & Health', 'Design & Media'];

export const RegisterScreen = ({ navigation }) => {
  const { register, isLoading, error, setError } = useAuth();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const handleRegister = async () => {
    // Reset global error and success states
    if (error) setError(null);
    setSuccessMessage(null);

    // Run field validations
    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const uniErr = validateUniversity(university);
    const courseErr = validateCourse(course);
    const yearErr = validateYearOfStudy(yearOfStudy);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);

    if (nameErr || emailErr || uniErr || courseErr || yearErr || passErr || confirmErr) {
      setErrors({
        fullName: nameErr,
        email: emailErr,
        university: uniErr,
        course: courseErr,
        yearOfStudy: yearErr,
        password: passErr,
        confirmPassword: confirmErr,
      });
      return;
    }

    setErrors({});

    // Submit mock registration
    const result = await register({
      fullName,
      email,
      university,
      course,
      yearOfStudy,
      password,
    });

    if (result.success) {
      setSuccessMessage('Registration successful! Please log in with your credentials.');
      Alert.alert(
        'Registration Successful 🎉',
        'Account registered successfully! Please log in with your credentials.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      // Navigate to Login screen
      navigation.navigate('Login');
    }
  };

  const selectUniversity = (uniName) => {
    setUniversity(uniName);
    if (errors.university) setErrors({ ...errors, university: null });
  };

  const selectCourse = (courseName) => {
    setCourse(courseName);
    if (errors.course) setErrors({ ...errors, course: null });
  };

  const selectYear = (yearLabel) => {
    setYearOfStudy(yearLabel);
    if (errors.yearOfStudy) setErrors({ ...errors, yearOfStudy: null });
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
    chipLabel: {
      color: colors.textMuted,
    },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    footerText: {
      color: colors.textSecondary,
    },
    loginLink: {
      color: colors.primary,
    },
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title="Student Registration"
        onBack={() => navigation.navigate('Welcome')}
      />

      <View style={styles.content}>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <VerifiedBadge label="Student Account Setup" style={{ marginBottom: SPACING.xs }} />
          <Text style={[styles.heading, dynamicStyles.heading]}>Create Your Account</Text>
          <Text style={[styles.subheading, dynamicStyles.subheading]}>
            Join verified student flatmates around your university campus.
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
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.successBannerText, dynamicStyles.successBannerText]}>{successMessage}</Text>
          </View>
        )}

        {/* Registration Form */}
        <View style={styles.formSection}>
          {/* 1. Full Name */}
          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: null });
            }}
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
            error={errors.fullName}
          />

          {/* 2. Email */}
          <Input
            label="Email Address"
            placeholder="e.g. alex@stanford.edu"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            error={errors.email}
          />

          {/* 3. College/University */}
          <Input
            label="College / University"
            placeholder="e.g. Stanford University"
            value={university}
            onChangeText={(text) => {
              setUniversity(text);
              if (errors.university) setErrors({ ...errors, university: null });
            }}
            leftIcon={<Ionicons name="school-outline" size={20} color={colors.textSecondary} />}
            error={errors.university}
          />

          {/* Quick Select Campus Chips */}
          <Text style={[styles.chipLabel, dynamicStyles.chipLabel]}>Quick Select Campus:</Text>
          <View style={styles.chipRow}>
            {UNIVERSITIES.slice(0, 4).map((uni) => (
              <TouchableOpacity
                key={uni}
                style={[
                  styles.chip,
                  dynamicStyles.chip,
                  university === uni && [styles.chipActive, dynamicStyles.chipActive],
                ]}
                onPress={() => selectUniversity(uni)}
              >
                <Text
                  style={[
                    styles.chipText,
                    dynamicStyles.chipText,
                    university === uni && [styles.chipTextActive, dynamicStyles.chipTextActive],
                  ]}
                >
                  {uni}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 4. Course */}
          <Input
            label="Course / Major"
            placeholder="e.g. Computer Science"
            value={course}
            onChangeText={(text) => {
              setCourse(text);
              if (errors.course) setErrors({ ...errors, course: null });
            }}
            leftIcon={<Ionicons name="book-outline" size={20} color={colors.textSecondary} />}
            error={errors.course}
          />

          {/* Quick Select Course Chips */}
          <Text style={[styles.chipLabel, dynamicStyles.chipLabel]}>Quick Select Course:</Text>
          <View style={styles.chipRow}>
            {COMMON_COURSES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  dynamicStyles.chip,
                  course === c && [styles.chipActive, dynamicStyles.chipActive],
                ]}
                onPress={() => selectCourse(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    dynamicStyles.chipText,
                    course === c && [styles.chipTextActive, dynamicStyles.chipTextActive],
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 5. Year of Study */}
          <Input
            label="Year of Study"
            placeholder="e.g. Year 2"
            value={yearOfStudy}
            onChangeText={(text) => {
              setYearOfStudy(text);
              if (errors.yearOfStudy) setErrors({ ...errors, yearOfStudy: null });
            }}
            leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />}
            error={errors.yearOfStudy}
          />

          {/* Quick Select Year Chips */}
          <Text style={[styles.chipLabel, dynamicStyles.chipLabel]}>Quick Select Year:</Text>
          <View style={styles.chipRow}>
            {YEAR_OPTIONS.map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[
                  styles.chip,
                  dynamicStyles.chip,
                  yearOfStudy === yr && [styles.chipActive, dynamicStyles.chipActive],
                ]}
                onPress={() => selectYear(yr)}
              >
                <Text
                  style={[
                    styles.chipText,
                    dynamicStyles.chipText,
                    yearOfStudy === yr && [styles.chipTextActive, dynamicStyles.chipTextActive],
                  ]}
                >
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 6. Password */}
          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            secureTextEntry={true}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            error={errors.password}
          />

          {/* 7. Confirm Password */}
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            secureTextEntry={true}
            leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />}
            error={errors.confirmPassword}
          />

          {/* Submit Button */}
          <Button
            title="Register Account"
            variant="gradient"
            size="large"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer Link to Login */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, dynamicStyles.footerText]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, dynamicStyles.loginLink]}> Log In</Text>
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
    marginBottom: SPACING.lg,
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
    fontWeight: '500',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: -SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  chip: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  chipActive: {},
  chipText: {
    fontSize: 12,
  },
  chipTextActive: {
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

