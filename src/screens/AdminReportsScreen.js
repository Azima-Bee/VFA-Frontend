import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const AdminReportsScreen = ({ navigation }) => {
  const { adminReports, resolveReport, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleResolve = (report) => {
    Alert.alert(
      'Resolve Report',
      `Mark this safety report for "${report.targetName}" as Resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          onPress: () => {
            resolveReport(report.id);
            if (selectedReport && selectedReport.id === report.id) {
              setSelectedReport({ ...selectedReport, status: 'Resolved' });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isResolved = item.status === 'Resolved';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : 'rgba(254,226,226,0.8)' }]}>
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={[styles.typeBadgeText, { color: colors.error }]}>{item.type}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: isResolved ? (isDark ? 'rgba(6, 78, 59, 0.4)' : '#ECFDF5') : (isDark ? 'rgba(127, 29, 29, 0.4)' : colors.errorLight) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isResolved ? colors.success : colors.error },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.targetName, { color: colors.textPrimary }]}>Target: {item.targetName}</Text>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>Reason: {item.reason}</Text>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          Reported by: {item.reporterName} • {item.submittedDate}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.reviewBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => setSelectedReport(item)}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={[styles.reviewBtnText, { color: colors.primary }]}>Review Details</Text>
          </TouchableOpacity>

          {!isResolved && (
            <TouchableOpacity
              style={[styles.resolveBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleResolve(item)}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.resolveBtnText}>Resolve Report</Text>
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
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Safety Reports</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={adminReports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.verified} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Safety Reports</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>All reported incidents have been resolved.</Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={!!selectedReport}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Report Incident Details</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
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
                          selectedReport.status === 'Resolved'
                            ? colors.success
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

                {selectedReport.status !== 'Resolved' && (
                  <TouchableOpacity
                    style={[styles.modalResolveBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleResolve(selectedReport)}
                  >
                    <Text style={styles.modalResolveText}>Mark Report as Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
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
  modalResolveBtn: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  modalResolveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

