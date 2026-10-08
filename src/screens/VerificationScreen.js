import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StatusBadge, VerifiedBadge } from '../components/Badge';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const SAMPLE_ID_CARDS = [
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
];

export const VerificationScreen = ({ navigation }) => {
  const {
    user,
    verificationStatus,
    setVerificationStatus,
    isEmailOtpVerified,
    sendVerificationOtp,
    verifyEmailOtp,
    submitStudentVerification,
    isLoading,
    error,
    setError,
  } = useAuth();

  const [universityEmail, setUniversityEmail] = useState(user?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [idCardImage, setIdCardImage] = useState(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'
  );

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [errors, setErrors] = useState({});

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (error) setError(null);
    setSuccessBanner(null);

    const emailErr = validateEmail(universityEmail);
    if (emailErr) {
      setErrors({ ...errors, email: emailErr });
      return;
    }

    setErrors({ ...errors, email: null });
    const result = await sendVerificationOtp(universityEmail);

    if (result.success) {
      setOtpSent(true);
      setSuccessBanner(result.message);
      setOtpCode(result.demoOtp || '123456'); // Auto-fill for seamless testing
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (error) setError(null);
    setSuccessBanner(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrors({ ...errors, otp: 'Enter 6-digit OTP code.' });
      return;
    }

    setErrors({ ...errors, otp: null });
    const result = await verifyEmailOtp(universityEmail, otpCode);

    if (result.success) {
      setSuccessBanner('Email OTP verified successfully!');
    }
  };

  // Step 3: Submit Complete Verification Package
  const handleSubmitVerification = async () => {
    if (error) setError(null);
    setSuccessBanner(null);

    const emailErr = validateEmail(universityEmail);
    let idErr = null;
    let cardErr = null;

    if (!studentIdNumber || !studentIdNumber.trim()) {
      idErr = 'Student ID / Enrollment Number is required.';
    }

    if (!idCardImage) {
      cardErr = 'College ID Card photo is required.';
    }

    if (emailErr || idErr || cardErr) {
      setErrors({
        email: emailErr,
        studentId: idErr,
        idCard: cardErr,
      });
      return;
    }

    setErrors({});

    const result = await submitStudentVerification({
      universityEmail,
      studentIdNumber,
      idCardImageUri: idCardImage,
    });

    if (result.success) {
      const msg = 'Verification submitted successfully. Our team will review your details.';
      setSuccessBanner(msg);
      Alert.alert(
        'Submission Received 🎉',
        msg,
        [
          {
            text: 'View Status on Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }
  };

  // Demo status switcher for testing
  const toggleDemoStatus = (status) => {
    setVerificationStatus(status);
    if (status === 'Verified') {
      Alert.alert('Demo Status Changed', 'Verification approved! Verified Student badge active.');
    }
  };

  return (
    <Container scrollable statusBarStyle="dark">
      <Header
        title="Student Identity Verification"
        onBack={() => navigation.navigate('Home')}
      />

      <View style={styles.content}>
        {/* Main Title Section */}
        <View style={styles.titleSection}>
          <StatusBadge status={verificationStatus} style={{ marginBottom: SPACING.xs }} />
          <Text style={styles.heading}>Verify Your Student Identity</Text>
          <Text style={styles.subheading}>
            FlatMate is an exclusive community for college students. Verify your student status to unlock flatmate matching.
          </Text>
        </View>

        {/* Global Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Success Banner */}
        {successBanner && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.successBannerText}>{successBanner}</Text>
          </View>
        )}

        {/* Current Status Banner Box */}
        <View style={[styles.statusBox, SHADOWS.small]}>
          <View style={styles.statusBoxHeader}>
            <Text style={styles.statusBoxTitle}>Current Verification Status</Text>
            <StatusBadge status={verificationStatus} />
          </View>

          <Text style={styles.statusBoxDesc}>
            {verificationStatus === 'Verified'
              ? 'Congratulations! Your student identity has been fully verified. Your profile now displays the Verified Student Badge.'
              : verificationStatus === 'Pending'
                ? 'Your documents have been submitted and are under review by our team. Verification usually takes 2-12 hours.'
                : verificationStatus === 'Rejected'
                  ? 'Your previous verification documents could not be verified. Please re-upload a clear photo of your student ID.'
                  : 'Complete the 3 quick steps below to verify your student account.'}
          </Text>

          {/* Quick Demo Simulator Toggle */}
          <View style={styles.demoToggleRow}>
            <Text style={styles.demoToggleLabel}>Demo Status Switcher:</Text>
            <View style={styles.demoButtons}>
              {['Not Verified', 'Pending', 'Verified', 'Rejected'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.demoBtn,
                    verificationStatus === st && styles.demoBtnActive,
                  ]}
                  onPress={() => toggleDemoStatus(st)}
                >
                  <Text
                    style={[
                      styles.demoBtnText,
                      verificationStatus === st && styles.demoBtnTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* METHOD 1: University Email & OTP */}
        <SectionCard
          icon="mail-outline"
          title="1. College / University Email Verification"
          subtitle="Verify via official campus .edu or .ac email"
        >
          <Input
            label="College/University Email Address"
            placeholder="e.g. alex@stanford.edu"
            value={universityEmail}
            onChangeText={(t) => {
              setUniversityEmail(t);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="school-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.email}
            editable={!isEmailOtpVerified}
          />

          {!isEmailOtpVerified ? (
            <View>
              <Button
                title={otpSent ? 'Resend Verification OTP' : 'Send OTP Code'}
                variant={otpSent ? 'outline' : 'primary'}
                size="medium"
                onPress={handleSendOtp}
                loading={isLoading}
                icon={<Ionicons name="paper-plane-outline" size={16} color={otpSent ? COLORS.primary : COLORS.textWhite} />}
                style={styles.actionBtn}
              />

              {otpSent && (
                <View style={styles.otpBox}>
                  <Text style={styles.otpLabel}>Enter 6-Digit OTP (Demo Code: 123456)</Text>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChangeText={(t) => {
                      setOtpCode(t);
                      if (errors.otp) setErrors({ ...errors, otp: null });
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    leftIcon={<Ionicons name="key-outline" size={20} color={COLORS.textSecondary} />}
                    error={errors.otp}
                  />

                  <View style={styles.otpActions}>
                    <Button
                      title="Verify OTP Code"
                      variant="gradient"
                      size="medium"
                      onPress={handleVerifyOtp}
                      loading={isLoading}
                      style={{ flex: 1, marginRight: SPACING.xs }}
                    />

                    <TouchableOpacity style={styles.resendLink} onPress={handleSendOtp}>
                      <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.verifiedSuccessRow}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.verifiedSuccessText}>University Email Verified</Text>
            </View>
          )}
        </SectionCard>

        {/* METHOD 2: Student ID / Enrollment Number */}
        <SectionCard
          icon="card-outline"
          title="2. Student ID / Enrollment Number"
          subtitle="Your official college roll number or registration ID"
        >
          <Input
            label="Student ID / Enrollment Number"
            placeholder="e.g. STU-2026-89012"
            value={studentIdNumber}
            onChangeText={(t) => {
              setStudentIdNumber(t);
              if (errors.studentId) setErrors({ ...errors, studentId: null });
            }}
            leftIcon={<Ionicons name="id-card-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.studentId}
            helperText="Encrypted and kept strictly private. Not shown on public profile."
          />
        </SectionCard>

        {/* METHOD 3: College ID Card Photo Upload */}
        <SectionCard
          icon="image-outline"
          title="3. College ID Card Photo Upload"
          subtitle="Upload clear front photo of your physical student ID card"
        >
          {idCardImage ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: idCardImage }} style={styles.imagePreview} />

              <View style={styles.imageOverlayControls}>
                <TouchableOpacity
                  style={styles.imageControlBtn}
                  onPress={() => setImageModalVisible(true)}
                >
                  <Ionicons name="swap-horizontal" size={16} color={COLORS.textWhite} />
                  <Text style={styles.imageControlText}>Replace Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imageControlBtn, { backgroundColor: COLORS.error }]}
                  onPress={() => setIdCardImage(null)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.textWhite} />
                  <Text style={styles.imageControlText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, errors.idCard && styles.uploadBoxError]}
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
              <Text style={styles.uploadTitle}>Tap to Upload College ID Card</Text>
              <Text style={styles.uploadSub}>Supports JPG, PNG (Max 5MB)</Text>
            </TouchableOpacity>
          )}

          {errors.idCard && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{errors.idCard}</Text>
            </View>
          )}
        </SectionCard>

        {/* PRIVACY NOTICE (Requirement #14) */}
        <View style={styles.privacyCard}>
          <Ionicons name="lock-closed" size={22} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>Strict Privacy & Data Security</Text>
            <Text style={styles.privacyText}>
              • Your uploaded College ID card photo and Student ID number are encrypted and strictly confidential.
              {'\n'}• They will <Text style={{ fontWeight: '700' }}>NEVER</Text> be displayed publicly.
              {'\n'}• Only the <Text style={{ fontWeight: '700' }}>"Verified Student"</Text> badge will appear on your flatmate profile.
            </Text>
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <Button
          title="Submit for Verification"
          variant="gradient"
          size="large"
          onPress={handleSubmitVerification}
          loading={isLoading}
          disabled={isLoading}
          icon={<Ionicons name="shield-checkmark" size={20} color={COLORS.textWhite} />}
          style={styles.submitBtn}
        />
      </View>

      {/* MODAL FOR SAMPLE ID CARD SELECTION */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={[styles.modalContent, SHADOWS.large]}>
            <Text style={styles.modalTitle}>Select College ID Card Photo</Text>
            <Text style={styles.modalSub}>Select a sample student ID card image for demonstration:</Text>

            <View style={styles.sampleGrid}>
              {SAMPLE_ID_CARDS.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleItem}
                  onPress={() => {
                    setIdCardImage(imgUri);
                    if (errors.idCard) setErrors({ ...errors, idCard: null });
                    setImageModalVisible(false);
                  }}
                >
                  <Image source={{ uri: imgUri }} style={styles.sampleImg} />
                  <Text style={styles.sampleLabel}>Sample ID Card #{idx + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successBannerText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  statusBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBoxDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  demoToggleRow: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  demoToggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  demoBtn: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  demoBtnText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  demoBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionBtn: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  otpBox: {
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  otpActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLink: {
    paddingHorizontal: SPACING.sm,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  verifiedSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  verifiedSuccessText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
    marginLeft: SPACING.xs,
  },
  imagePreviewWrapper: {
    position: 'relative',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imageOverlayControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xs,
  },
  imageControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  imageControlText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  uploadSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  submitBtn: {
    marginBottom: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  sampleGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sampleItem: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sampleImg: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  sampleLabel: {
    padding: SPACING.xs,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  closeBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
