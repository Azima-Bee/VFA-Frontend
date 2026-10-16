import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { showConfirmDialog, showMessageAlert } from '../utils/alert';

export const AdminVerificationScreen = ({ navigation }) => {
  const { adminVerifications, approveVerification, rejectVerification, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Cross-platform In-App Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    action: null, // 'approve' | 'reject'
    item: null,
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetchAdminData();
      if (res && res.success === false) {
        setError(res.error || 'Failed to fetch verification queue from server.');
      }
    } catch (err) {
      setError(err?.message || 'Network error occurred while fetching verification requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAdminData]);

  // Load queue on initial screen mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Counts for tab badges
  const counts = useMemo(() => {
    const list = Array.isArray(adminVerifications) ? adminVerifications : [];
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    list.forEach((v) => {
      const s = (v.status || v.rawStatus || '').toLowerCase();
      if (s === 'pending') pending++;
      else if (s === 'approved' || s === 'verified') approved++;
      else if (s === 'rejected') rejected++;
    });
    return { pending, approved, rejected, total: list.length };
  }, [adminVerifications]);

  // Filtered queue items based on active tab and search query
  const filteredData = useMemo(() => {
    const list = Array.isArray(adminVerifications) ? adminVerifications : [];
    return list.filter((item) => {
      const s = (item.status || item.rawStatus || '').toLowerCase();
      const isApproved = s === 'approved' || s === 'verified';
      const isRejected = s === 'rejected';
      const isPending = s === 'pending';

      // Tab filter
      if (activeTab === 'pending' && !isPending) return false;
      if (activeTab === 'approved' && !isApproved) return false;
      if (activeTab === 'rejected' && !isRejected) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (item.studentName || '').toLowerCase();
        const email = (item.userEmail || '').toLowerCase();
        const college = (item.college || '').toLowerCase();
        const docType = (item.documentType || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !college.includes(q) && !docType.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [adminVerifications, activeTab, searchQuery]);

  const handleOpenApproveDialog = (item) => {
    setConfirmDialog({
      visible: true,
      action: 'approve',
      item,
    });
  };

  const handleOpenRejectDialog = (item) => {
    setConfirmDialog({
      visible: true,
      action: 'reject',
      item,
    });
  };

  const executeConfirmAction = async () => {
    const { action, item } = confirmDialog;
    setConfirmDialog({ visible: false, action: null, item: null });
    if (!item || !action) return;

    setProcessingId(item.id);
    try {
      if (action === 'approve') {
        const res = await approveVerification(item.id);
        if (res && res.success) {
          showToast(`Verified badge successfully granted to ${item.studentName}!`);
        } else {
          showMessageAlert('Approval Failed', res?.error || 'Could not approve verification.');
        }
      } else if (action === 'reject') {
        const res = await rejectVerification(item.id);
        if (res && res.success) {
          showToast(`Verification rejected for ${item.studentName}.`);
        } else {
          showMessageAlert('Rejection Failed', res?.error || 'Could not reject verification.');
        }
      }
    } catch (err) {
      showMessageAlert('Action Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const rawStatus = (item.status || item.rawStatus || '').toLowerCase();
    const isApproved = rawStatus === 'approved' || rawStatus === 'verified';
    const isRejected = rawStatus === 'rejected';
    const isPending = rawStatus === 'pending';
    const isProcessing = String(processingId) === String(item.id);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardTopHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.studentName}</Text>
            <Text style={[styles.collegeName, { color: colors.primary }]}>🎓 {item.college || 'Not Specified'}</Text>
            {item.userEmail ? (
              <Text style={[styles.studentEmail, { color: colors.textMuted }]}>✉️ {item.userEmail}</Text>
            ) : null}
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isApproved
                  ? (isDark ? 'rgba(6,78,59,0.4)' : '#ECFDF5')
                  : isRejected
                  ? (isDark ? 'rgba(127,29,29,0.4)' : colors.errorLight)
                  : (isDark ? 'rgba(120,53,15,0.4)' : '#FFFBEB'),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: isApproved
                    ? colors.success
                    : isRejected
                    ? colors.error
                    : colors.warning,
                },
              ]}
            >
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>

        <Text style={[styles.submittedDate, { color: colors.textMuted }]}>Submitted: {item.submittedDate || 'Recent'}</Text>

        {/* Document Indicators */}
        <View style={[styles.docsContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.docsSectionTitle, { color: colors.textSecondary }]}>Submitted Verification Indicators:</Text>

          <View style={styles.docItem}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.docStatusText, { color: colors.textPrimary }]}>
              {item.studentIdStatus || `Document: ${(item.documentType || 'Student ID').toUpperCase().replace('_', ' ')}`}
            </Text>
          </View>

          <View style={styles.docItem}>
            <Ionicons name="mail-unread-outline" size={16} color={colors.accent} />
            <Text style={[styles.docStatusText, { color: colors.textPrimary }]}>
              {item.universityEmailStatus || `Email: ${item.userEmail || 'Registered Email'}`}
            </Text>
          </View>

          {item.documentUrl ? (
            <View style={styles.docItem}>
              <Ionicons name="link-outline" size={16} color={colors.success} />
              <Text style={[styles.docStatusText, { color: colors.textSecondary }]} numberOfLines={1}>
                Doc URL: {item.documentUrl}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Row */}
        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.rejectBtn,
                { backgroundColor: isDark ? 'rgba(127,29,29,0.25)' : colors.errorLight },
                isProcessing && { opacity: 0.6 },
              ]}
              onPress={() => handleOpenRejectDialog(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                  <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: colors.primary }, isProcessing && { opacity: 0.6 }]}
              onPress={() => handleOpenApproveDialog(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve Badge</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewedRow}>
            <Ionicons
              name={isApproved ? 'shield-checkmark' : 'close-circle'}
              size={16}
              color={isApproved ? colors.success : colors.error}
            />
            <Text style={[styles.reviewedText, { color: isApproved ? colors.success : colors.error }]}>
              {isApproved ? 'Student identity verified & badge granted' : 'Verification request rejected'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Student Verifications</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {counts.pending} pending requests awaiting review
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconBtn, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => loadData(true)}
          disabled={loading || refreshing}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={[styles.toastBanner, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by student name, college, email..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter Row */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'pending' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : colors.textSecondary },
              activeTab === 'pending' && styles.tabTextActive,
            ]}
          >
            Pending
          </Text>
          {counts.pending > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.tabBadgeText}>{counts.pending}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'approved' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('approved')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'approved' ? colors.primary : colors.textSecondary },
              activeTab === 'approved' && styles.tabTextActive,
            ]}
          >
            Approved
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: isDark ? 'rgba(6,78,59,0.6)' : '#D1FAE5' }]}>
            <Text style={[styles.tabBadgeText, { color: colors.success }]}>{counts.approved}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'rejected' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'rejected' ? colors.primary : colors.textSecondary },
              activeTab === 'rejected' && styles.tabTextActive,
            ]}
          >
            Rejected
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: isDark ? 'rgba(127,29,29,0.5)' : '#FEE2E2' }]}>
            <Text style={[styles.tabBadgeText, { color: colors.error }]}>{counts.rejected}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'all' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? colors.primary : colors.textSecondary },
              activeTab === 'all' && styles.tabTextActive,
            ]}
          >
            All ({counts.total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.stateCenterContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading student verifications from secure database...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateCenterContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Failed to Load Queue</Text>
          <Text style={[styles.errorSub, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadData(false)}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'pending' ? 'checkmark-done-circle-outline' : 'search-outline'}
                size={56}
                color={activeTab === 'pending' ? colors.verified : colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery
                  ? 'No Matches Found'
                  : activeTab === 'pending'
                  ? 'Queue Cleared 🎉'
                  : `No ${activeTab.toUpperCase()} Records`}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {searchQuery
                  ? `No verifications found matching "${searchQuery}".`
                  : activeTab === 'pending'
                  ? 'All student verification requests have been reviewed.'
                  : `There are currently no verifications in the ${activeTab} queue.`}
              </Text>
              {searchQuery ? (
                <TouchableOpacity
                  style={[styles.clearSearchBtn, { borderColor: colors.border }]}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={[styles.clearSearchText, { color: colors.primary }]}>Clear Search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      {/* Cross-Platform Confirmation Modal */}
      <Modal
        visible={confirmDialog.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDialog({ visible: false, action: null, item: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View
              style={[
                styles.modalIconBox,
                {
                  backgroundColor:
                    confirmDialog.action === 'approve'
                      ? (isDark ? 'rgba(6,78,59,0.3)' : '#ECFDF5')
                      : (isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight),
                },
              ]}
            >
              <Ionicons
                name={confirmDialog.action === 'approve' ? 'shield-checkmark' : 'alert-circle'}
                size={32}
                color={confirmDialog.action === 'approve' ? colors.success : colors.error}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {confirmDialog.action === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {confirmDialog.action === 'approve'
                ? `Grant Verified Student Badge to ${confirmDialog.item?.studentName}? This will verify their profile across the platform.`
                : `Reject student ID verification request for ${confirmDialog.item?.studentName}? The student will receive a notification to resubmit.`}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmDialog({ visible: false, action: null, item: null })}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor:
                      confirmDialog.action === 'approve' ? colors.primary : colors.error,
                  },
                ]}
                onPress={executeConfirmAction}
              >
                <Text style={styles.modalConfirmText}>
                  {confirmDialog.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stateCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  errorSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  collegeName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  submittedDate: {
    fontSize: 11,
    marginBottom: SPACING.sm,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  docsContainer: {
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.xs,
  },
  docsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  docStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  reviewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    gap: 6,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  clearSearchBtn: {
    marginTop: SPACING.md,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // In-App Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
