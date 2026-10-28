import React, { useContext, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showMessageAlert } from '../utils/alert';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const AdminReportsScreen = ({ navigation }) => {
  const { adminReports, resolveReport, updateReportStatus, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'resolved'
  const [resolvingId, setResolvingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // In-app cross-platform confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    report: null,
    action: 'resolve', // 'resolve' | 'reject'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  // Counts for tab badges
  const counts = useMemo(() => {
    const list = Array.isArray(adminReports) ? adminReports : [];
    let pending = 0;
    let resolved = 0;
    list.forEach((r) => {
      const s = (r.status || r.rawStatus || '').toLowerCase();
      if (s === 'resolved') resolved++;
      else pending++;
    });
    return { all: list.length, pending, resolved };
  }, [adminReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    const list = Array.isArray(adminReports) ? adminReports : [];
    return list.filter((item) => {
      const s = (item.status || item.rawStatus || '').toLowerCase();
      const isResolved = s === 'resolved';

      if (activeTab === 'pending' && isResolved) return false;
      if (activeTab === 'resolved' && !isResolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const target = (item.targetName || '').toLowerCase();
        const reporter = (item.reporterName || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        const details = (item.details || '').toLowerCase();
        if (
          !target.includes(q) &&
          !reporter.includes(q) &&
          !reason.includes(q) &&
          !details.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [adminReports, activeTab, searchQuery]);

  const handleOpenConfirm = (report, action = 'resolve') => {
    setConfirmDialog({
      visible: true,
      report,
      action,
    });
  };

  const executeConfirmAction = async () => {
    const { report, action } = confirmDialog;
    setConfirmDialog({ visible: false, report: null, action: 'resolve' });
    if (!report) return;

    setResolvingId(report.id);
    try {
      if (action === 'resolve') {
        const res = await resolveReport(report.id);
        if (res && res.success !== false) {
          showToast(`Report for "${report.targetName}" has been resolved.`);
          if (selectedReport && String(selectedReport.id) === String(report.id)) {
            setSelectedReport({ ...selectedReport, status: 'Resolved' });
          }
        } else {
          showMessageAlert('Resolve Error', res?.error || 'Failed to resolve report on server.');
        }
      } else if (action === 'reject') {
        const res = await (updateReportStatus
          ? updateReportStatus(report.id, 'rejected')
          : resolveReport(report.id));
        if (res && res.success !== false) {
          showToast(`Report for "${report.targetName}" has been dismissed.`);
          if (selectedReport && String(selectedReport.id) === String(report.id)) {
            setSelectedReport({ ...selectedReport, status: 'Rejected' });
          }
        } else {
          showMessageAlert('Action Error', res?.error || 'Failed to dismiss report.');
        }
      }
    } catch (err) {
      showMessageAlert('Action Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setResolvingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isResolved = (item.status || item.rawStatus || '').toLowerCase() === 'resolved';
    const isProcessing = resolvingId && String(resolvingId) === String(item.id);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          SHADOWS.small,
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.2)'
                  : 'rgba(254, 226, 226, 0.8)',
              },
            ]}
          >
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={[styles.typeBadgeText, { color: colors.error }]}>{item.type}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isResolved
                  ? (isDark ? 'rgba(6, 78, 59, 0.4)' : '#ECFDF5')
                  : (isDark ? 'rgba(127, 29, 29, 0.4)' : colors.errorLight),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isResolved ? colors.verified : colors.error },
              ]}
            >
              {isResolved ? 'Resolved' : item.status || 'Pending'}
            </Text>
          </View>
        </View>

        <Text style={[styles.targetName, { color: colors.textPrimary }]}>
          Target: {item.targetName}
        </Text>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
          Reason: {item.reason}
        </Text>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          Reported by: {item.reporterName} • {item.submittedDate}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.reviewBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => setSelectedReport(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={[styles.reviewBtnText, { color: colors.primary }]}>Review Details</Text>
          </TouchableOpacity>

          {!isResolved && (
            <TouchableOpacity
              style={[
                styles.resolveBtn,
                { backgroundColor: colors.primary },
                isProcessing && { opacity: 0.7 },
              ]}
              onPress={() => handleOpenConfirm(item, 'resolve')}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.resolveBtnText}>Resolve Report</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Safety Reports</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {counts.pending} pending incidents awaiting resolution
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconBtn, { backgroundColor: colors.surfaceAlt }]}
          onPress={onRefresh}
          disabled={refreshing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={[styles.toastBanner, { backgroundColor: colors.verified || '#10B981' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by target, reporter, or reason..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter Row */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
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
            All ({counts.all})
          </Text>
        </TouchableOpacity>

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
            Pending ({counts.pending})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'resolved' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'resolved' ? colors.primary : colors.textSecondary },
              activeTab === 'resolved' && styles.tabTextActive,
            ]}
          >
            Resolved ({counts.resolved})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.verified} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Reports Found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {searchQuery ? 'No reports matched your search.' : 'All reported incidents are clear.'}
            </Text>
          </View>
        }
      />

      {/* Incident Review Details Modal */}
      <Modal
        visible={!!selectedReport}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReport(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedReport(null)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Report Incident Details</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Report Type:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedReport.type}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reported Target:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedReport.targetName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reporter:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedReport.reporterName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category Reason:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                  <Text
                    style={[
                      styles.detailVal,
                      {
                        color:
                          (selectedReport.status || '').toLowerCase() === 'resolved'
                            ? colors.verified
                            : colors.error,
                      },
                    ]}
                  >
                    {selectedReport.status}
                  </Text>
                </View>

                <Text style={[styles.detailsHeader, { color: colors.textPrimary }]}>Full Incident Description:</Text>
                <View style={[styles.detailsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                    {selectedReport.details || 'No additional details provided by reporter.'}
                  </Text>
                </View>

                {(selectedReport.status || '').toLowerCase() !== 'resolved' && (
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.modalResolveBtn,
                        { backgroundColor: colors.primary },
                        resolvingId && String(resolvingId) === String(selectedReport.id) && { opacity: 0.7 },
                      ]}
                      onPress={() => handleOpenConfirm(selectedReport, 'resolve')}
                      disabled={resolvingId && String(resolvingId) === String(selectedReport.id)}
                      activeOpacity={0.8}
                    >
                      {resolvingId && String(resolvingId) === String(selectedReport.id) ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.modalResolveText}>Mark Report as Resolved</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalDismissBtn,
                        { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                      ]}
                      onPress={() => handleOpenConfirm(selectedReport, 'reject')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.modalDismissText, { color: colors.textSecondary }]}>Dismiss / Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* In-App Cross-Platform Confirmation Modal */}
      <Modal
        visible={confirmDialog.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDialog({ visible: false, report: null, action: 'resolve' })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setConfirmDialog({ visible: false, report: null, action: 'resolve' })}
        >
          <View
            style={[styles.confirmModalContent, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.large]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.confirmIconBox,
                {
                  backgroundColor:
                    confirmDialog.action === 'resolve'
                      ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                      : (isDark ? 'rgba(239, 68, 68, 0.2)' : colors.errorLight),
                },
              ]}
            >
              <Ionicons
                name={confirmDialog.action === 'resolve' ? 'shield-checkmark' : 'alert-circle'}
                size={32}
                color={confirmDialog.action === 'resolve' ? colors.verified : colors.error}
              />
            </View>

            <Text style={[styles.confirmModalTitle, { color: colors.textPrimary }]}>
              {confirmDialog.action === 'resolve' ? 'Resolve Safety Report' : 'Dismiss Report'}
            </Text>

            <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
              {confirmDialog.action === 'resolve'
                ? `Mark safety report against "${confirmDialog.report?.targetName || 'target'}" as Resolved? This confirms that moderation action has been taken.`
                : `Dismiss this report against "${confirmDialog.report?.targetName || 'target'}"? It will be closed without action.`}
            </Text>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmDialog({ visible: false, report: null, action: 'resolve' })}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmExecuteBtn,
                  {
                    backgroundColor:
                      confirmDialog.action === 'resolve' ? colors.primary : colors.error,
                  },
                ]}
                onPress={executeConfirmAction}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmExecuteText}>
                  {confirmDialog.action === 'resolve' ? 'Confirm Resolve' : 'Confirm Dismiss'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
    marginHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
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
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : {}),
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  reasonText: {
    fontSize: 14,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalBody: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  detailsBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 60,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalButtonsRow: {
    marginTop: SPACING.sm,
    gap: 8,
  },
  modalResolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  modalResolveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modalDismissText: {
    fontWeight: '600',
    fontSize: 13,
  },
  confirmModalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  confirmModalMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmExecuteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmExecuteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
