import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge, StatusBadge } from '../components/Badge';
import { SectionCard } from '../components/SectionCard';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const ProfileScreen = ({ navigation }) => {
  const { user, profile, verificationStatus, logout } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const hasProfile = !!profile || (user && (user.college_name || user.university || user.course));

  const dynamicStyles = {
    wrapper: {
      backgroundColor: colors.background,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    avatarImg: {
      borderColor: colors.primary,
    },
    avatarCircle: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    avatarText: {
      color: colors.primary,
    },
    userName: {
      color: colors.textPrimary,
    },
    userEmail: {
      color: colors.textSecondary,
    },
    userUni: {
      color: colors.primary,
    },
    divider: {
      backgroundColor: colors.border,
    },
    majorContainer: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    majorText: {
      color: colors.textPrimary,
    },
    verifBtn: {
      backgroundColor: colors.primaryLight,
    },
    verifBtnText: {
      color: colors.primary,
    },
    emptyCard: {
      backgroundColor: colors.surfaceAlt,
      borderColor: isDark ? colors.border : colors.primaryLight,
    },
    emptyTitle: {
      color: colors.textPrimary,
    },
    emptySub: {
      color: colors.textSecondary,
    },
  };

  return (
    <View style={[styles.wrapper, dynamicStyles.wrapper]}>
      <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header
          title="My Student Profile"
          showBack={false}
          rightComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ padding: SPACING.xs }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <View style={styles.content}>
          {/* User Avatar & Info Card */}
          <View style={[styles.profileCard, dynamicStyles.profileCard, shadows.medium]}>
            <View style={styles.avatarRow}>
              {user?.photo || profile?.photo ? (
                <Image source={{ uri: user?.photo || profile?.photo }} style={[styles.avatarImg, dynamicStyles.avatarImg]} />
              ) : (
                <View style={[styles.avatarCircle, dynamicStyles.avatarCircle]}>
                  <Text style={[styles.avatarText, dynamicStyles.avatarText]}>
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
              )}
              <View style={styles.infoWrapper}>
                <Text style={[styles.userName, dynamicStyles.userName]}>{user?.fullName || profile?.fullName || 'Student User'}</Text>
                <Text style={[styles.userEmail, dynamicStyles.userEmail]}>{user?.email || 'Student Account'}</Text>
                <Text style={[styles.userUni, dynamicStyles.userUni]}>
                  🎓 {profile?.college_name || profile?.university || user?.university || 'University Not Set'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <View style={styles.statusRow}>
              <View style={styles.badgeWrapper}>
                {verificationStatus === 'Verified' ? (
                  <VerifiedBadge label="Verified Student" size="small" />
                ) : (
                  <StatusBadge status={verificationStatus} />
                )}
              </View>

              <View style={[styles.majorContainer, dynamicStyles.majorContainer]}>
                <Ionicons name="book-outline" size={13} color={colors.primary} />
                <Text style={[styles.majorText, dynamicStyles.majorText]} numberOfLines={2}>
                  {profile?.course || user?.course || 'Course Not Set'} • {profile?.year_of_study || user?.yearOfStudy || 'Year Not Set'}
                </Text>
              </View>
            </View>
          </View>

          {/* 404 Empty State Banner if profile has not been created yet */}
          {!hasProfile && (
            <View style={[styles.emptyCard, dynamicStyles.emptyCard]}>
              <Ionicons name="person-add-outline" size={32} color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>Profile Not Created Yet</Text>
              <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
                Complete your student profile details to find compatible flatmates around your campus.
              </Text>
              <Button
                title="Create Student Profile"
                variant="gradient"
                size="medium"
                onPress={() => navigation.navigate('ProfileSetup')}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}

          {/* Verification Status Action Card */}
          <SectionCard
            icon="shield-checkmark-outline"
            title="Identity Verification"
            subtitle="Campus Badge Status"
          >
            <View style={styles.verifRow}>
              <StatusBadge status={verificationStatus} />
              <TouchableOpacity
                style={[styles.verifBtn, dynamicStyles.verifBtn]}
                onPress={() => navigation.navigate('Verification')}
              >
                <Text style={[styles.verifBtnText, dynamicStyles.verifBtnText]}>
                  {verificationStatus === 'Verified' ? 'View Badge' : 'Verify Identity'}
                </Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* Actions */}
          <Button
            title={hasProfile ? "Edit Student Profile" : "Set Up Profile"}
            variant="gradient"
            size="large"
            onPress={() => navigation.navigate('ProfileSetup')}
            icon={<Ionicons name="create-outline" size={18} color={colors.textWhite} />}
            style={{ marginBottom: SPACING.sm }}
          />

          <Button
            title="Settings & Privacy"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate('Settings')}
            icon={<Ionicons name="settings-outline" size={18} color={colors.primary} />}
            style={{ marginBottom: SPACING.sm }}
          />

          <Button
            title="Safety Center"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate('Safety')}
            icon={<Ionicons name="shield-outline" size={18} color={colors.primary} />}
            style={{ marginBottom: SPACING.md }}
          />

          <Button
            title="Log Out"
            variant="ghost"
            size="large"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
            style={styles.logoutBtn}
          />
        </View>
      </Container>
      <BottomNavBar activeTab="Profile" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingVertical: SPACING.md,
  },
  profileCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: SPACING.md,
    borderWidth: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  infoWrapper: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  userUni: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  badgeWrapper: {
    flexShrink: 0,
  },
  majorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '65%',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  majorText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    flexShrink: 1,
  },
  verifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifBtn: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  verifBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  logoutBtn: {
    marginBottom: SPACING.xl,
  },
});

