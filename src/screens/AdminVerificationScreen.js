import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const AdminVerificationScreen = ({ navigation }) => {
  const { adminVerifications, approveVerification, rejectVerification, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleApprove = (item) => {
    Alert.alert(
      'Approve Verification',
      `Grant Verified Student Badge to ${item.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveVerification(item.id),
        },
      ]
    );
  };

  const handleReject = (item) => {
    Alert.alert(
      'Reject Verification',
      `Reject student verification request for ${item.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectVerification(item.id),
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isApproved = item.status === 'Approved';
    const isRejected = item.status === 'Rejected';
    const isPending = item.status === 'Pending';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardTopHeader}>
          <View>
            <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.studentName}</Text>
            <Text style={[styles.collegeName, { color: colors.primary }]}>🎓 {item.college}</Text>
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
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.submittedDate, { color: colors.textMuted }]}>Submitted: {item.submittedDate}</Text>

        {/* SECURITY SAFEGUARD: DO NOT EXPOSE PUBLIC SENSITIVE ID DOCUMENTS */}
        <View style={[styles.docsContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.docsSectionTitle, { color: colors.textSecondary }]}>Submitted Document Indicators:</Text>

          <View style={styles.docItem}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.docStatusText, { color: colors.textPrimary }]}>{item.studentIdStatus}</Text>
          </View>

          <View style={styles.docItem}>
            <Ionicons name="mail-unread-outline" size={16} color={colors.accent} />
            <Text style={[styles.docStatusText, { color: colors.textPrimary }]}>{item.universityEmailStatus}</Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, { backgroundColor: isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight }]}
              onPress={() => handleReject(item)}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleApprove(item)}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve Badge</Text>
            </TouchableOpacity>
          </View>
        )}
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Student Verifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={adminVerifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color={colors.verified} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Queue Cleared</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No pending student verification requests to review.</Text>
          </View>
        }
      />
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
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
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
});
