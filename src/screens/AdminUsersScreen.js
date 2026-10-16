import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { showMessageAlert } from '../utils/alert';

const PAGE_SIZE = 10;

export const AdminUsersScreen = ({ navigation }) => {
  const { adminUsers, toggleSuspendUser, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended' | 'verified' | 'pending'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // In-App Confirmation Modal for Web & Mobile
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    user: null,
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
        setError(res.error || 'Failed to fetch student accounts from server.');
      }
    } catch (err) {
      setError(err?.message || 'Network error occurred while fetching student accounts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAdminData]);

  // Load student users on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Counts for filter pills
  const counts = useMemo(() => {
    const list = Array.isArray(adminUsers) ? adminUsers : [];
    let active = 0;
    let suspended = 0;
    let verified = 0;
    let pending = 0;
    list.forEach((u) => {
      const acc = (u.accountStatus || '').toLowerCase();
      const ver = (u.verificationStatus || '').toLowerCase();
      if (acc === 'suspended') suspended++;
      else active++;

      if (ver === 'verified') verified++;
      else if (ver === 'pending') pending++;
    });
    return { all: list.length, active, suspended, verified, pending };
  }, [adminUsers]);

  // Filtered student accounts
  const filteredUsers = useMemo(() => {
    const list = Array.isArray(adminUsers) ? adminUsers : [];
    return list.filter((user) => {
      const accStatus = (user.accountStatus || '').toLowerCase();
      const verStatus = (user.verificationStatus || '').toLowerCase();

      // Status filter
      if (statusFilter === 'active' && accStatus !== 'active') return false;
      if (statusFilter === 'suspended' && accStatus !== 'suspended') return false;
      if (statusFilter === 'verified' && verStatus !== 'verified') return false;
      if (statusFilter === 'pending' && verStatus !== 'pending') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const college = (user.college || '').toLowerCase();
        const course = (user.course || '').toLowerCase();
        const city = (user.city || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !college.includes(q) &&
          !course.includes(q) &&
          !city.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [adminUsers, statusFilter, searchQuery]);

  // Paginated data slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handleOpenConfirmSuspend = (user) => {
    setConfirmDialog({
      visible: true,
      user,
    });
  };

  const executeToggleSuspend = async () => {
    const user = confirmDialog.user;
    setConfirmDialog({ visible: false, user: null });
    if (!user) return;

    const isSuspended = user.accountStatus === 'Suspended';
    setActionLoadingId(user.id);

    try {
      const res = await toggleSuspendUser(user.id);
      if (res && res.success) {
        showToast(
          isSuspended
            ? `Student account for ${user.name} unsuspended.`
            : `Student account for ${user.name} suspended.`
        );
        if (selectedUser && String(selectedUser.id) === String(user.id)) {
          setSelectedUser({
            ...selectedUser,
            accountStatus: isSuspended ? 'Active' : 'Suspended',
          });
        }
      } else {
        showMessageAlert('Action Failed', res?.error || 'Failed to update account status.');
      }
    } catch (err) {
      showMessageAlert('Action Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isSuspended = item.accountStatus === 'Suspended';
    const isActionLoading = String(actionLoadingId) === String(item.id);

    return (
      <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfoLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(item.name || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userMainInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
                {item.role === 'admin' && (
                  <View style={[styles.adminRoleBadge, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.adminRoleText, { color: colors.accent }]}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.userCollege, { color: colors.primary }]}>🎓 {item.college}</Text>
              <Text style={[styles.userCourse, { color: colors.textSecondary }]}>
                📚 {item.course} {item.year ? `• ${item.year}` : ''}
              </Text>
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
                {
                  backgroundColor: isSuspended
                    ? (isDark ? 'rgba(127,29,29,0.4)' : colors.errorLight)
                    : (isDark ? 'rgba(6,78,59,0.4)' : '#ECFDF5'),
                },
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
                ? {
                    backgroundColor: isDark ? 'rgba(6,78,59,0.3)' : '#ECFDF5',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
              isActionLoading && { opacity: 0.6 },
            ]}
            onPress={() => handleOpenConfirmSuspend(item)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color={isSuspended ? colors.success : colors.error} />
            ) : (
              <>
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
              </>
            )}
          </TouchableOpacity>
        </View>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Student Accounts</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {filteredUsers.length} students {searchQuery ? 'matching' : 'registered'}
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

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by name, email, college, course, city..."
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

      {/* Filter Chips Row */}
      <View style={styles.filterScrollViewWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'all'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'all' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'active'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setStatusFilter('active')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'active' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Active ({counts.active})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'suspended'
                ? { backgroundColor: colors.error, borderColor: colors.error }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setStatusFilter('suspended')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'suspended' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Suspended ({counts.suspended})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'verified'
                ? { backgroundColor: colors.verified, borderColor: colors.verified }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setStatusFilter('verified')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'verified' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Verified ({counts.verified})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'pending'
                ? { backgroundColor: colors.warning, borderColor: colors.warning }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'pending' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Pending Verif ({counts.pending})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.stateCenterContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading student user accounts from database...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateCenterContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Failed to Load Accounts</Text>
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
          data={paginatedUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No Students Found' : 'No Accounts in this Category'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {searchQuery
                  ? `No student accounts match "${searchQuery}".`
                  : 'No student accounts found for the selected filter.'}
              </Text>
              {(searchQuery || statusFilter !== 'all') && (
                <TouchableOpacity
                  style={[styles.clearSearchBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  <Text style={[styles.clearSearchText, { color: colors.primary }]}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            filteredUsers.length > PAGE_SIZE ? (
              <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { borderColor: colors.border },
                    currentPage === 1 && { opacity: 0.4 },
                  ]}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
                  <Text style={[styles.pageBtnText, { color: colors.textPrimary }]}>Previous</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicatorText, { color: colors.textSecondary }]}>
                  Page {currentPage} of {totalPages}
                  {'\n'}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    ({(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                    {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length})
                  </Text>
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { borderColor: colors.border },
                    currentPage === totalPages && { opacity: 0.4 },
                  ]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Text style={[styles.pageBtnText, { color: colors.textPrimary }]}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Student Account Details</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Database ID:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>#{selectedUser.id}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Full Name:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email Address:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.email}</Text>
                </View>

                {selectedUser.phone ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone Number:</Text>
                    <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.phone}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>College / University:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.college}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Course / Major:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.course}</Text>
                </View>

                {selectedUser.year ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Year of Study:</Text>
                    <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.year}</Text>
                  </View>
                ) : null}

                {selectedUser.city ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>City:</Text>
                    <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.city}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Verification Status:</Text>
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
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Registered Date:</Text>
                  <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{selectedUser.joinedDate}</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setSelectedUser(null)}
              >
                <Text style={[styles.modalCloseBtnText, { color: colors.textPrimary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog Modal for Suspend / Unsuspend */}
      <Modal
        visible={confirmDialog.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDialog({ visible: false, user: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View
              style={[
                styles.modalIconBox,
                {
                  backgroundColor:
                    confirmDialog.user?.accountStatus === 'Suspended'
                      ? (isDark ? 'rgba(6,78,59,0.3)' : '#ECFDF5')
                      : (isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight),
                },
              ]}
            >
              <Ionicons
                name={confirmDialog.user?.accountStatus === 'Suspended' ? 'checkmark-circle' : 'ban'}
                size={32}
                color={confirmDialog.user?.accountStatus === 'Suspended' ? colors.success : colors.error}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {confirmDialog.user?.accountStatus === 'Suspended'
                ? 'Unsuspend Student Account'
                : 'Suspend Student Account'}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {confirmDialog.user?.accountStatus === 'Suspended'
                ? `Restore full account access for ${confirmDialog.user?.name}? The student will be able to log in and use all features.`
                : `Are you sure you want to suspend account for ${confirmDialog.user?.name}? The student will be prevented from logging in.`}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmDialog({ visible: false, user: null })}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor:
                      confirmDialog.user?.accountStatus === 'Suspended'
                        ? colors.success
                        : colors.error,
                  },
                ]}
                onPress={executeToggleSuspend}
              >
                <Text style={styles.modalConfirmText}>
                  {confirmDialog.user?.accountStatus === 'Suspended'
                    ? 'Confirm Unsuspend'
                    : 'Confirm Suspend'}
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
  filterScrollViewWrapper: {
    paddingVertical: SPACING.xs,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  adminRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  adminRoleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userCollege: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  userCourse: {
    fontSize: 12,
    marginTop: 1,
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
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
    fontSize: 17,
    fontWeight: '800',
  },
  modalBody: {
    marginVertical: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  detailVal: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalFooter: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Confirmation Dialog Modal
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
