import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const AdminDashboardScreen = ({ navigation }) => {
  const { user, adminStats, fetchAdminData, logout } = useContext(AuthContext);
  const { colors, isDark, shadows } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleAdminLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.textPrimary,
    },
    headerSub: {
      color: colors.textSecondary,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    welcomeTitle: {
      color: colors.textPrimary,
    },
    welcomeDesc: {
      color: colors.textSecondary,
    },
    sectionHeading: {
      color: colors.textMuted,
    },
    statCard: {
      backgroundColor: colors.surface,
    },
    statValue: {
      color: colors.textPrimary,
    },
    statLabel: {
      color: colors.textMuted,
    },
    moduleCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    moduleTitle: {
      color: colors.textPrimary,
    },
    moduleDesc: {
      color: colors.textSecondary,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Admin Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.adminBadgeIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="key" size={18} color={colors.textWhite} />
          </View>
          <View>
            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Admin Portal</Text>
            <Text style={[styles.headerSub, dynamicStyles.headerSub]}>{user?.email || 'admin@flatmate.demo'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleAdminLogout} style={[styles.logoutHeaderBtn, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutHeaderText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Banner */}
        <View style={[styles.welcomeCard, dynamicStyles.welcomeCard, shadows.small]}>
          <Text style={[styles.welcomeTitle, dynamicStyles.welcomeTitle]}>FlatMate Moderation Hub 🛡️</Text>
          <Text style={[styles.welcomeDesc, dynamicStyles.welcomeDesc]}>
            Manage student verifications, user moderation, housing listings, and community safety reports.
          </Text>
        </View>

        {/* METRICS GRID */}
        <Text style={[styles.sectionHeading, dynamicStyles.sectionHeading]}>System Metrics & Overview</Text>
        <View style={styles.statsGrid}>
          {/* Total Students */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.primaryLight, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.totalStudents}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Students</Text>
          </View>

          {/* Verified Students */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.verifiedLight, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.verifiedLight }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.verified} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.verifiedStudents}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Verified Students</Text>
          </View>

          {/* Pending Verifications */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.warningLight, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="time" size={22} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.pendingVerifications}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Pending Verification</Text>
          </View>

          {/* Active Listings */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.accentLight, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="home" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.activeListings}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Active Listings</Text>
          </View>

          {/* Safety Reports */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.errorLight, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="flag" size={22} color={colors.error} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.reportsCount}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Safety Reports</Text>
          </View>

          {/* Suspended Users */}
          <View style={[styles.statCard, dynamicStyles.statCard, shadows.small, { borderColor: colors.surfaceAlt, borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="ban" size={22} color={colors.textSecondary} />
            </View>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{adminStats.suspendedUsers}</Text>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Suspended Users</Text>
          </View>
        </View>

        {/* MANAGEMENT NAVIGATION MODULES */}
        <Text style={[styles.sectionHeading, dynamicStyles.sectionHeading]}>Management Modules</Text>

        <TouchableOpacity
          style={[styles.moduleCard, dynamicStyles.moduleCard, shadows.small]}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.8}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={[styles.moduleTitle, dynamicStyles.moduleTitle]}>Student User Accounts</Text>
            <Text style={[styles.moduleDesc, dynamicStyles.moduleDesc]}>View students, check status & suspend/unsuspend</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.moduleCard, dynamicStyles.moduleCard, shadows.small]}
          onPress={() => navigation.navigate('AdminVerification')}
          activeOpacity={0.8}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={[styles.moduleTitle, dynamicStyles.moduleTitle]}>Student Verification Queue</Text>
            <Text style={[styles.moduleDesc, dynamicStyles.moduleDesc]}>Approve or reject student ID requests</Text>
          </View>
          {adminStats.pendingVerifications > 0 && (
            <View style={[styles.badgePill, { backgroundColor: colors.warning }]}>
              <Text style={[styles.badgePillText, { color: colors.textWhite }]}>{adminStats.pendingVerifications}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.moduleCard, dynamicStyles.moduleCard, shadows.small]}
          onPress={() => navigation.navigate('AdminListings')}
          activeOpacity={0.8}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="home-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={[styles.moduleTitle, dynamicStyles.moduleTitle]}>Room & Housing Listings</Text>
            <Text style={[styles.moduleDesc, dynamicStyles.moduleDesc]}>Approve, reject or remove campus listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.moduleCard, dynamicStyles.moduleCard, shadows.small]}
          onPress={() => navigation.navigate('AdminReports')}
          activeOpacity={0.8}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="warning-outline" size={24} color={colors.error} />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={[styles.moduleTitle, dynamicStyles.moduleTitle]}>Safety & Abuse Reports</Text>
            <Text style={[styles.moduleDesc, dynamicStyles.moduleDesc]}>Review student reports and resolve incidents</Text>
          </View>
          {adminStats.reportsCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgePillText, { color: colors.textWhite }]}>{adminStats.reportsCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  logoutHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 4,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm + 2,
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  moduleDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  badgePillText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
});
