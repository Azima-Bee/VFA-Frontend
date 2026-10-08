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
import { StatusBadge } from '../components/Badge';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const AdminUsersScreen = ({ navigation }) => {
  const { adminUsers, toggleSuspendUser, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleToggleSuspend = (user) => {
    const isSuspended = user.accountStatus === 'Suspended';
    Alert.alert(
      isSuspended ? 'Unsuspend Student Account' : 'Suspend Student Account',
      `Are you sure you want to ${isSuspended ? 'unsuspend' : 'suspend'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Unsuspend' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const res = await toggleSuspendUser(user.id);
            if (res?.success) {
              if (selectedUser && selectedUser.id === user.id) {
                setSelectedUser({
                  ...selectedUser,
                  accountStatus: isSuspended ? 'Active' : 'Suspended',
                });
              }
              Alert.alert('Status Updated', `Student account has been ${isSuspended ? 'unsuspended' : 'suspended'}.`);
            } else {
              Alert.alert('Action Failed', res?.error || 'Failed to update account status.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isSuspended = item.accountStatus === 'Suspended';

    return (
      <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.userMainInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.userCollege, { color: colors.primary }]}>🎓 {item.college}</Text>
              <Text style={[styles.userCourse, { color: colors.textSecondary }]}>📚 {item.course}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusRow, { borderColor: colors.border }]}>
          <View style={styles.statusBadgeGroup}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Verif: </Text>
            <StatusBadge status={item.verificationStatus} />
          </View>

          <View style={styles.statusBadgeGroup}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Account: </Text>
            <View
              style={[
                styles.accountStatusPill,
                { backgroundColor: isSuspended ? (isDark ? 'rgba(127,29,29,0.4)' : colors.errorLight) : (isDark ? 'rgba(6,78,59,0.4)' : '#ECFDF5') },
              ]}
            >
              <Text
                style={[
                  styles.accountStatusText,
                  { color: isSuspended ? colors.error : colors.success },
                ]}
              >
                {item.accountStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : colors.primaryLight }]}
            onPress={() => setSelectedUser(item)}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={[styles.viewBtnText, { color: colors.primary }]}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.suspendBtn,
              isSuspended
                ? { backgroundColor: isDark ? 'rgba(6,78,59,0.3)' : '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.3)' }
                : { backgroundColor: isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight, borderColor: 'rgba(239, 68, 68, 0.3)' },
            ]}
            onPress={() => handleToggleSuspend(item)}
          >
            <Ionicons
              name={isSuspended ? 'checkmark-circle-outline' : 'ban-outline'}
              size={16}
              color={isSuspended ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.suspendBtnText,
                { color: isSuspended ? colors.success : colors.error },
              ]}
            >
              {isSuspended ? 'Unsuspend' : 'Suspend Account'}
            </Text>
          </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Student Accounts</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={adminUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Student Accounts</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No student user accounts found in the database.</Text>
          </View>
        }
      />

      {/* User Details Modal */}
      <Modal
        visible={!!selectedUser}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Student Details</Text>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Full Name:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>University Email:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>College:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.college}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Course / Major:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.course}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Verification:</Text>
                  <StatusBadge status={selectedUser.verificationStatus} />
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Account Status:</Text>
                  <Text
                    style={[
                      styles.detailVal,
                      {
                        color:
                          selectedUser.accountStatus === 'Suspended'
                            ? colors.error
                            : colors.success,
                      },
                    ]}
                  >
                    {selectedUser.accountStatus}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Joined Date:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.joinedDate}</Text>
                </View>
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
  userCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    marginBottom: SPACING.sm,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  userMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userCollege: {
    fontSize: 12,
    fontWeight: '600',
  },
  userCourse: {
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: SPACING.xs,
  },
  statusBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountStatusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  accountStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  suspendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  suspendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    gap: SPACING.xs + 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: SPACING.sm,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  detailVal: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
});
