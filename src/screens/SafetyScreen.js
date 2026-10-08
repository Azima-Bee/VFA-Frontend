import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { SectionCard } from '../components/SectionCard';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const SafetyScreen = ({ route, navigation }) => {
  const { blockedUsers, unblockUser, submitReport } = useContext(AuthContext);
  const { colors, isDark, shadows } = useTheme();

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('User');
  const [targetName, setTargetName] = useState('');
  const [reportedUserId, setReportedUserId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [reportReason, setReportReason] = useState('Suspicious account');
  const [reportDetails, setReportDetails] = useState('');

  const reportReasons = [
    'Suspicious account',
    'Fake listing',
    'Harassment',
    'Scam/fraud',
    'Inappropriate content',
    'Other',
  ];

  // Sync route params when opened with pre-filled target
  useEffect(() => {
    if (route?.params) {
      const type = route.params.reportType || (route.params.listingId ? 'Listing' : 'User');
      const uId = route.params.reportedUserId || route.params.student?.id || route.params.userId || null;
      const lId = route.params.listingId || route.params.listing?.id || null;
      const tName = route.params.targetName || route.params.student?.name || route.params.listing?.title || '';

      if (type) setReportType(type);
      if (uId) setReportedUserId(uId);
      if (lId) setListingId(lId);
      if (tName) setTargetName(tName);

      if (route.params.openModal || uId || lId) {
        setReportModalVisible(true);
      }
    }
  }, [route?.params]);

  const handleOpenReport = (type = 'User') => {
    setReportType(type);
    setTargetName('');
    setReportedUserId(null);
    setListingId(null);
    setReportReason('Suspicious account');
    setReportDetails('');
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    const isListing = reportType === 'Listing';
    let targetReportedUserId = !isListing ? reportedUserId : null;
    let targetListingId = isListing ? listingId : null;

    if (!targetReportedUserId && !targetListingId && targetName.trim()) {
      const parsedNum = parseInt(targetName.trim(), 10);
      if (!isNaN(parsedNum) && parsedNum > 0 && String(parsedNum) === targetName.trim()) {
        if (isListing) {
          targetListingId = parsedNum;
        } else {
          targetReportedUserId = parsedNum;
        }
      }
    }

    if (!targetReportedUserId && !targetListingId) {
      Alert.alert(
        'Target ID Required',
        isListing
          ? 'Please report directly from the listing details screen, or enter a valid numeric listing ID.'
          : 'Please report directly from the student’s profile or chat, or enter a valid numeric user ID.'
      );
      return;
    }

    const res = await submitReport({
      type: `${reportType} Report`,
      reportedUserId: targetReportedUserId,
      listingId: targetListingId,
      targetName: targetName.trim(),
      reason: reportReason,
      details: reportDetails.trim()
        ? (targetName.trim() ? `Target: ${targetName.trim()}\n${reportDetails.trim()}` : reportDetails.trim())
        : (targetName.trim() ? `Target: ${targetName.trim()}` : ''),
    });

    if (res?.success) {
      setReportModalVisible(false);
      Alert.alert('Report Submitted', 'Report submitted successfully. Our safety team will review it within 24 hours.', [
        { text: 'OK' },
      ]);
    } else {
      Alert.alert('Submission Error', res?.error || 'Failed to submit report. Please try again.');
    }
  };

  const dynamicStyles = {
    wrapper: {
      backgroundColor: colors.background,
    },
    heroBanner: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    heroIconCircle: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : colors.verifiedLight,
    },
    heroTitle: {
      color: colors.textPrimary,
    },
    heroSub: {
      color: colors.textSecondary,
    },
    ruleTitle: {
      color: colors.textPrimary,
    },
    ruleDesc: {
      color: colors.textSecondary,
    },
    sectionParagraph: {
      color: colors.textSecondary,
    },
    boldText: {
      color: colors.textPrimary,
    },
    sectionSubText: {
      color: colors.textSecondary,
    },
    reportUserBtn: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    reportListingBtn: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFFBEB',
      borderColor: isDark ? colors.border : 'rgba(245, 158, 11, 0.2)',
    },
    reportChatBtn: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.18)' : colors.accentLight,
      borderColor: isDark ? colors.border : 'rgba(124, 58, 237, 0.2)',
    },
    emptyBlockedText: {
      color: colors.textMuted,
    },
    blockedRow: {
      borderBottomColor: colors.border,
    },
    blockedName: {
      color: colors.textPrimary,
    },
    blockedDate: {
      color: colors.textMuted,
    },
    unblockBtn: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    unblockBtnText: {
      color: colors.primary,
    },
    contactText: {
      color: colors.textSecondary,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    modalHeader: {
      borderBottomColor: colors.border,
    },
    modalTitle: {
      color: colors.textPrimary,
    },
    inputLabel: {
      color: colors.textPrimary,
    },
    textInput: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    reasonChip: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    reasonChipText: {
      color: colors.textSecondary,
    },
    selectedReasonChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectedReasonText: {
      color: colors.textWhite,
    },
  };

  return (
    <View style={[styles.wrapper, dynamicStyles.wrapper]}>
      <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Safety Center" onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          {/* Main Hero Safety Banner */}
          <View style={[styles.heroBanner, dynamicStyles.heroBanner, shadows.small]}>
            <View style={[styles.heroIconCircle, dynamicStyles.heroIconCircle]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.verified} />
            </View>
            <View style={styles.heroTextContent}>
              <Text style={[styles.heroTitle, dynamicStyles.heroTitle]}>Student Safety First</Text>
              <Text style={[styles.heroSub, dynamicStyles.heroSub]}>
                FlatMate is built on verified student identities and community trust. Follow our safety rules to stay protected.
              </Text>
            </View>
          </View>

          {/* CRITICAL SAFETY RULES */}
          <SectionCard
            icon="alert-circle-outline"
            title="Essential Safety Rules"
            subtitle="Must-Know Precautions"
          >
            <View style={styles.ruleItem}>
              <Ionicons name="people" size={20} color={colors.primary} style={styles.ruleIcon} />
              <View style={styles.ruleTextContainer}>
                <Text style={[styles.ruleTitle, dynamicStyles.ruleTitle]}>Public First Meetings</Text>
                <Text style={[styles.ruleDesc, dynamicStyles.ruleDesc]}>
                  Meet new flatmates in public places (e.g., campus cafe or library) first before sharing private space.
                </Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="key" size={20} color={colors.error} style={styles.ruleIcon} />
              <View style={styles.ruleTextContainer}>
                <Text style={[styles.ruleTitle, dynamicStyles.ruleTitle]}>Protect Private Info</Text>
                <Text style={[styles.ruleDesc, dynamicStyles.ruleDesc]}>
                  Never share passwords, OTPs, government IDs or financial information with anyone.
                </Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="home" size={20} color={colors.warning} style={styles.ruleIcon} />
              <View style={styles.ruleTextContainer}>
                <Text style={[styles.ruleTitle, dynamicStyles.ruleTitle]}>Verify Property First</Text>
                <Text style={[styles.ruleDesc, dynamicStyles.ruleDesc]}>
                  Verify property details in person or via live video tour before paying any deposit or rent.
                </Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="cash" size={20} color={colors.error} style={styles.ruleIcon} />
              <View style={styles.ruleTextContainer}>
                <Text style={[styles.ruleTitle, dynamicStyles.ruleTitle]}>No Upfront Money Transfers</Text>
                <Text style={[styles.ruleDesc, dynamicStyles.ruleDesc]}>
                  Do not send money online before confirming the property ownership and receiving a written lease.
                </Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="location" size={20} color={colors.accent} style={styles.ruleIcon} />
              <View style={styles.ruleTextContainer}>
                <Text style={[styles.ruleTitle, dynamicStyles.ruleTitle]}>Keep Exact Addresses Private</Text>
                <Text style={[styles.ruleDesc, dynamicStyles.ruleDesc]}>
                  Keep exact residential room/flat numbers private until a verified mutual connection is established.
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* COMMUNITY GUIDELINES & SAFE MEETUP TIPS */}
          <SectionCard
            icon="journal-outline"
            title="Community Guidelines & Tips"
            subtitle="Campus Standards"
          >
            <Text style={[styles.sectionParagraph, dynamicStyles.sectionParagraph]}>
              1. <Text style={[styles.boldText, dynamicStyles.boldText]}>Respect & Inclusivity:</Text> Treat all fellow students with kindness regardless of major, background, or lifestyle preference.
            </Text>
            <Text style={[styles.sectionParagraph, dynamicStyles.sectionParagraph]}>
              2. <Text style={[styles.boldText, dynamicStyles.boldText]}>Honest Profiling:</Text> Ensure your budget, habits, and lifestyle info reflect your actual preferences.
            </Text>
            <Text style={[styles.sectionParagraph, dynamicStyles.sectionParagraph]}>
              3. <Text style={[styles.boldText, dynamicStyles.boldText]}>Safe Meetups:</Text> Always bring a friend or notify a roommate when visiting a new flat for the first time.
            </Text>
          </SectionCard>

          {/* REPORT & BLOCK ACTIONS */}
          <SectionCard
            icon="flag-outline"
            title="Report & Moderation"
            subtitle="Take Action"
          >
            <Text style={[styles.sectionSubText, dynamicStyles.sectionSubText]}>
              Encountered suspicious behavior, fake listings, or harassment? Report it immediately.
            </Text>

            <View style={styles.reportButtonsRow}>
              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportUserBtn]}
                onPress={() => handleOpenReport('User')}
              >
                <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
                <Text style={[styles.reportTypeLabel, { color: colors.primary }]}>Report User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportListingBtn]}
                onPress={() => handleOpenReport('Listing')}
              >
                <Ionicons name="home-outline" size={22} color={colors.warning} />
                <Text style={[styles.reportTypeLabel, { color: colors.warning }]}>Report Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportChatBtn]}
                onPress={() => handleOpenReport('Chat')}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
                <Text style={[styles.reportTypeLabel, { color: colors.accent }]}>Report Chat</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* BLOCKED USERS */}
          <SectionCard
            icon="ban-outline"
            title="Blocked Users"
            subtitle="Managed Block List"
          >
            {blockedUsers.length === 0 ? (
              <Text style={[styles.emptyBlockedText, dynamicStyles.emptyBlockedText]}>You have not blocked any users.</Text>
            ) : (
              blockedUsers.map((item) => (
                <View key={item.id} style={[styles.blockedRow, dynamicStyles.blockedRow]}>
                  <View style={styles.blockedInfo}>
                    <Text style={[styles.blockedName, dynamicStyles.blockedName]}>{item.name}</Text>
                    <Text style={[styles.blockedDate, dynamicStyles.blockedDate]}>Blocked on {item.date}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.unblockBtn, dynamicStyles.unblockBtn]}
                    onPress={() => {
                      unblockUser(item.id);
                      Alert.alert('User Unblocked', `${item.name} has been unblocked.`);
                    }}
                  >
                    <Text style={[styles.unblockBtnText, dynamicStyles.unblockBtnText]}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </SectionCard>

          {/* EMERGENCY & SUPPORT */}
          <SectionCard
            icon="call-outline"
            title="Emergency & Support"
            subtitle="Need Urgent Help?"
          >
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, dynamicStyles.contactText]}>Safety Desk: safety@flatmate.demo</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="shield" size={18} color={colors.verified} />
              <Text style={[styles.contactText, dynamicStyles.contactText]}>Campus Security: Contact your university security desk</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="warning-outline" size={18} color={colors.error} />
              <Text style={[styles.contactText, dynamicStyles.contactText]}>Immediate Emergency: Dial local emergency services (911)</Text>
            </View>
          </SectionCard>
        </View>
      </Container>

      {/* REPORT MODAL */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Report {reportType}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Name or Identifier of {reportType}:</Text>
              <TextInput
                style={[styles.textInput, dynamicStyles.textInput]}
                placeholder={`Enter ${reportType.toLowerCase()} name or ID...`}
                value={targetName}
                onChangeText={setTargetName}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Reason for Report:</Text>
              <View style={styles.reasonsList}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonChip,
                      dynamicStyles.reasonChip,
                      reportReason === reason && [styles.selectedReasonChip, dynamicStyles.selectedReasonChip],
                    ]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        dynamicStyles.reasonChipText,
                        reportReason === reason && [styles.selectedReasonText, dynamicStyles.selectedReasonText],
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Additional Details (Optional):</Text>
              <TextInput
                style={[styles.textInput, dynamicStyles.textInput, styles.textArea]}
                placeholder="Describe what happened or why you are reporting..."
                value={reportDetails}
                onChangeText={setReportDetails}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor={colors.textMuted}
              />

              <Button
                title="Submit Report"
                variant="gradient"
                size="large"
                onPress={handleSubmitReport}
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingVertical: SPACING.md,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  heroTextContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  ruleIcon: {
    marginRight: SPACING.sm + 2,
    marginTop: 2,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionParagraph: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  reportButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  reportTypeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  reportTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyBlockedText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  blockedDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  unblockBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unblockBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  // Modal Styles
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  reasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  reasonChip: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedReasonChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedReasonText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
});
