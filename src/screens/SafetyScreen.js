import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { SectionCard } from '../components/SectionCard';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showMessageAlert } from '../utils/alert';
import { reportService } from '../services/reportService';
import { connectionService } from '../services/connectionService';
import { listingService } from '../services/listingService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const REASONS_MAP = {
  User: [
    'Suspicious account',
    'Fake student identity',
    'Harassment',
    'Scam or fraud attempt',
    'Inappropriate content',
    'Other',
  ],
  Listing: [
    'Fake listing',
    'Inaccurate price or details',
    'Scam / deposit fraud',
    'Property unavailable',
    'Inappropriate images',
    'Other',
  ],
  Chat: [
    'Harassment or abusive chat',
    'Offensive language',
    'Scam / phishing attempt',
    'Unsolicited spam',
    'Inappropriate requests',
    'Other',
  ],
};

export const SafetyScreen = ({ route, navigation }) => {
  const { user, blockedUsers, unblockUser, submitReport } = useContext(AuthContext);
  const { colors, isDark, shadows } = useTheme();

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reportType, setReportType] = useState('User');
  const [targetName, setTargetName] = useState('');
  const [reportedUserId, setReportedUserId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [reportReason, setReportReason] = useState('Suspicious account');
  const [reportDetails, setReportDetails] = useState('');

  const [quickUsers, setQuickUsers] = useState([]);
  const [quickListings, setQuickListings] = useState([]);

  // Fetch quick select targets (connections and listings) on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [connRes, listRes] = await Promise.all([
          connectionService.getConnections().catch(() => ({ success: false })),
          listingService.getListings().catch(() => ({ success: false })),
        ]);
        if (isMounted) {
          if (connRes?.success && Array.isArray(connRes.connections)) {
            const list = connRes.connections
              .map((c) => ({
                id: c.student?.id || c.senderId || c.receiverId,
                name: c.student?.name || 'Student',
              }))
              .filter((u) => u.id && u.name);
            setQuickUsers(list.slice(0, 6));
          }
          if (listRes?.success && Array.isArray(listRes.listings)) {
            const list = listRes.listings
              .map((l) => ({
                id: l.id,
                title: l.title || `Listing #${l.id}`,
              }))
              .filter((l) => l.id && l.title);
            setQuickListings(list.slice(0, 6));
          }
        }
      } catch (err) {
        // non-blocking
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync route params when opened with pre-filled target
  useEffect(() => {
    if (route?.params) {
      const type = route.params.reportType || (route.params.listingId ? 'Listing' : 'User');
      const uId = route.params.reportedUserId || route.params.student?.id || route.params.userId || null;
      const lId = route.params.listingId || route.params.listing?.id || null;
      const tName = route.params.targetName || route.params.student?.name || route.params.listing?.title || '';

      if (type) {
        setReportType(type);
        const reasons = REASONS_MAP[type] || REASONS_MAP.User;
        setReportReason(reasons[0]);
      }
      if (uId) setReportedUserId(uId);
      if (lId) setListingId(lId);
      if (tName) setTargetName(tName);

      if (route.params.openModal || uId || lId) {
        setReportModalVisible(true);
      }
    }
  }, [route?.params]);

  const fetchMyReportsList = async () => {
    setLoadingHistory(true);
    try {
      const res = await reportService.getMyReports();
      if (res?.success && Array.isArray(res.reports)) {
        setMyReports(res.reports);
      }
    } catch (e) {
      console.warn('Fetch my reports error:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenReport = (type = 'User') => {
    setReportType(type);
    setTargetName('');
    setReportedUserId(null);
    setListingId(null);
    const reasons = REASONS_MAP[type] || REASONS_MAP.User;
    setReportReason(reasons[0]);
    setReportDetails('');
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!targetName.trim()) {
      showMessageAlert(
        'Target Required',
        `Please enter the name, title, or ID of the ${reportType.toLowerCase()} you wish to report.`
      );
      return;
    }

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

    setIsSubmitting(true);
    try {
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
        setTargetName('');
        setReportDetails('');
        showMessageAlert(
          'Report Submitted',
          'Report submitted successfully. Our safety team will review it within 24 hours.'
        );
        fetchMyReportsList();
      } else {
        showMessageAlert(
          'Submission Error',
          res?.error || 'Failed to submit report. Please try again.'
        );
      }
    } catch (err) {
      showMessageAlert(
        'Submission Error',
        err.message || 'Failed to submit report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentReasons = REASONS_MAP[reportType] || REASONS_MAP.User;

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
    quickChip: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    quickChipText: {
      color: colors.textSecondary,
    },
    historyCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    historyTarget: {
      color: colors.textPrimary,
    },
    historyReason: {
      color: colors.textSecondary,
    },
    historyDate: {
      color: colors.textMuted,
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
              Encountered suspicious behavior, fake listings, or harassment? Report it immediately to our moderation team.
            </Text>

            <View style={styles.reportButtonsRow}>
              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportUserBtn]}
                onPress={() => handleOpenReport('User')}
                activeOpacity={0.8}
              >
                <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
                <Text style={[styles.reportTypeLabel, { color: colors.primary }]}>Report User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportListingBtn]}
                onPress={() => handleOpenReport('Listing')}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={22} color={colors.warning} />
                <Text style={[styles.reportTypeLabel, { color: colors.warning }]}>Report Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportTypeBtn, dynamicStyles.reportChatBtn]}
                onPress={() => handleOpenReport('Chat')}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
                <Text style={[styles.reportTypeLabel, { color: colors.accent }]}>Report Chat</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportAuxRow}>
              <TouchableOpacity
                style={[styles.historyActionBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                onPress={() => {
                  fetchMyReportsList();
                  setHistoryModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.historyActionText, { color: colors.primary }]}>
                  View My Submitted Reports
                </Text>
              </TouchableOpacity>

              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.historyActionBtn, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : colors.primaryLight }]}
                  onPress={() => navigation.navigate('AdminReports')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shield-outline" size={16} color={colors.primary} />
                  <Text style={[styles.historyActionText, { color: colors.primary, fontWeight: '700' }]}>
                    Admin Reports Queue
                  </Text>
                </TouchableOpacity>
              )}
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
                      showMessageAlert('User Unblocked', `${item.name} has been unblocked.`);
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

      {/* REPORT SUBMISSION MODAL */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReportModalVisible(false)}
        >
          <View
            style={[styles.modalContent, dynamicStyles.modalContent]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={reportType === 'Listing' ? 'home' : reportType === 'Chat' ? 'chatbubbles' : 'person'}
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Report {reportType}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Select Chips */}
              {(reportType === 'User' || reportType === 'Chat') && quickUsers.length > 0 && (
                <View style={styles.quickSection}>
                  <Text style={[styles.quickSectionLabel, { color: colors.textMuted }]}>
                    Quick select from recent contacts:
                  </Text>
                  <View style={styles.quickChipsRow}>
                    {quickUsers.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.quickChip,
                          dynamicStyles.quickChip,
                          targetName === item.name && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setTargetName(item.name);
                          setReportedUserId(item.id);
                        }}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            dynamicStyles.quickChipText,
                            targetName === item.name && { color: colors.primary, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {reportType === 'Listing' && quickListings.length > 0 && (
                <View style={styles.quickSection}>
                  <Text style={[styles.quickSectionLabel, { color: colors.textMuted }]}>
                    Quick select from listings:
                  </Text>
                  <View style={styles.quickChipsRow}>
                    {quickListings.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.quickChip,
                          dynamicStyles.quickChip,
                          targetName === item.title && { borderColor: colors.warning, backgroundColor: '#FFFBEB' },
                        ]}
                        onPress={() => {
                          setTargetName(item.title);
                          setListingId(item.id);
                        }}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            dynamicStyles.quickChipText,
                            targetName === item.title && { color: colors.warning, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>
                {reportType === 'Listing' ? 'Listing Title or Listing ID *' : `${reportType} Name, Email, or ID *`}
              </Text>
              <TextInput
                style={[styles.textInput, dynamicStyles.textInput]}
                placeholder={
                  reportType === 'Listing'
                    ? 'Enter property title or listing ID...'
                    : `Enter ${reportType.toLowerCase()} name, email or ID...`
                }
                value={targetName}
                onChangeText={setTargetName}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Reason for Report:</Text>
              <View style={styles.reasonsList}>
                {currentReasons.map((reason) => (
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
                placeholder="Describe what happened or why you are submitting this report..."
                value={reportDetails}
                onChangeText={setReportDetails}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor={colors.textMuted}
              />

              <Button
                title={isSubmitting ? 'Submitting Report...' : 'Submit Report'}
                variant="gradient"
                size="large"
                onPress={handleSubmitReport}
                disabled={isSubmitting}
                icon={
                  isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                  ) : (
                    <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )
                }
                style={{ marginTop: SPACING.md, marginBottom: SPACING.sm }}
              />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MY SUBMITTED REPORTS HISTORY MODAL */}
      <Modal
        visible={historyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHistoryModalVisible(false)}
        >
          <View
            style={[styles.modalContent, dynamicStyles.modalContent]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="list" size={20} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>My Submitted Reports</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={fetchMyReportsList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {loadingHistory ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your reports...</Text>
                </View>
              ) : myReports.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="shield-checkmark-outline" size={44} color={colors.textMuted} />
                  <Text style={[styles.emptyHistoryTitle, { color: colors.textPrimary }]}>No Reports Submitted</Text>
                  <Text style={[styles.emptyHistorySub, { color: colors.textSecondary }]}>
                    You have not submitted any safety reports yet. If you encounter any issue, use the buttons above.
                  </Text>
                </View>
              ) : (
                myReports.map((item) => {
                  const isResolved = item.status === 'resolved';
                  const isReviewed = item.status === 'reviewed';
                  const targetLabel =
                    item.reported_user_name ||
                    item.listing_title ||
                    (item.reported_user_id ? `User #${item.reported_user_id}` : null) ||
                    (item.listing_id ? `Listing #${item.listing_id}` : null) ||
                    (item.description && item.description.match(/\[Target: ([^\]]+)\]/)?.[1]) ||
                    'General Report';

                  return (
                    <View
                      key={item.id}
                      style={[styles.historyCard, dynamicStyles.historyCard, shadows.small]}
                    >
                      <View style={styles.historyHeaderRow}>
                        <Text style={[styles.historyTarget, dynamicStyles.historyTarget]} numberOfLines={1}>
                          {targetLabel}
                        </Text>
                        <View
                          style={[
                            styles.historyStatusBadge,
                            {
                              backgroundColor: isResolved
                                ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                                : isReviewed
                                  ? (isDark ? 'rgba(99, 102, 241, 0.2)' : colors.primaryLight)
                                  : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB'),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyStatusText,
                              {
                                color: isResolved
                                  ? colors.verified
                                  : isReviewed
                                    ? colors.primary
                                    : colors.warning,
                              },
                            ]}
                          >
                            {item.status || 'pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.historyReason, dynamicStyles.historyReason]}>
                        Reason: {item.reason}
                      </Text>
                      {item.description ? (
                        <Text style={[styles.historyDesc, { color: colors.textMuted }]} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text style={[styles.historyDate, dynamicStyles.historyDate]}>
                        Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
    borderWidth: 1,
  },
  reportTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  reportAuxRow: {
    marginTop: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  historyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  historyActionText: {
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    padding: Platform.OS === 'web' ? SPACING.lg : 0,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderRadius: Platform.OS === 'web' ? RADIUS.xl : undefined,
    padding: SPACING.lg,
    maxHeight: '90%',
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  quickSection: {
    marginBottom: SPACING.xs,
  },
  quickSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  quickChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
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
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : {}),
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
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  emptyHistoryBox: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  emptyHistorySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTarget: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: SPACING.xs,
  },
  historyStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyReason: {
    fontSize: 12,
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
