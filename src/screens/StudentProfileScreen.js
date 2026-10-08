import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { profileService } from '../services/profileService';
import { verificationService } from '../services/verificationService';
import { connectionService } from '../services/connectionService';
import { calculateCompatibility } from '../utils/compatibility';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const StudentProfileScreen = ({ route, navigation }) => {
  const { user, blockUser } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const initialStudent = route.params?.student || {};
  const routeUserId = route.params?.userId || initialStudent.id;

  const [studentData, setStudentData] = useState(initialStudent);
  const [isFetching, setIsFetching] = useState(false);
  const [isPassed, setIsPassed] = useState(false);

  // Connection State: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [activeConnId, setActiveConnId] = useState(null);
  const [isConnLoading, setIsConnLoading] = useState(false);

  const isOwnProfile = user?.id && routeUserId && String(user.id) === String(routeUserId);

  useEffect(() => {
    const fetchRemoteProfileAndConnection = async () => {
      const parsedId = parseInt(routeUserId, 10);
      if (isNaN(parsedId) || parsedId <= 0) return;

      setIsFetching(true);
      try {
        const [profRes, verifRes, connRes] = await Promise.all([
          profileService.getUserProfile(parsedId),
          verificationService.getUserVerification(parsedId),
          user?.id ? connectionService.getConnections(user.id) : Promise.resolve({ success: false }),
        ]);

        if (profRes.success && profRes.profile) {
          const fetchedProf = profRes.profile;
          setStudentData((prev) => ({
            ...prev,
            id: parsedId,
            name: fetchedProf.fullName || fetchedProf.college_name || prev.name || 'Student',
            college: fetchedProf.college_name || prev.college,
            course: fetchedProf.course || prev.course,
            yearOfStudy: fetchedProf.year_of_study || prev.yearOfStudy,
            aboutMe: fetchedProf.bio || prev.aboutMe,
            photo: fetchedProf.photo || prev.photo,
            isVerified: verifRes.isVerified || prev.isVerified,
          }));
        }

        // Determine connection relationship
        if (connRes.success && connRes.connections) {
          const conn = connRes.connections.find(
            (c) => Number(c.student?.id) === parsedId || Number(c.senderId) === parsedId || Number(c.receiverId) === parsedId
          );

          if (conn) {
            setActiveConnId(conn.id);
            if (conn.status === 'accepted') {
              setConnectionStatus('accepted');
            } else if (conn.status === 'pending') {
              setConnectionStatus(conn.isSender ? 'pending_sent' : 'pending_received');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch remote user profile or connection status:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchRemoteProfileAndConnection();
  }, [routeUserId, user?.id]);

  const student = studentData;
  const compat = calculateCompatibility(user || {}, student);

  const handleConnect = async () => {
    if (connectionStatus !== 'none' || !student.id) return;

    setIsConnLoading(true);
    const res = await connectionService.sendConnectionRequest(student.id);
    setIsConnLoading(false);

    if (res.success) {
      setConnectionStatus('pending_sent');
      Alert.alert(
        'Connection Request Sent! 🤝',
        `Your flatmate connection request has been sent to ${student.name}. Once accepted, you can start messaging!`,
        [{ text: 'Great!' }]
      );
    } else if (res.conflict) {
      setConnectionStatus('pending_sent');
      Alert.alert('Request Pending', 'Connection request is already pending or active.');
    } else {
      Alert.alert('Connection Error', res.error || 'Failed to send connection request.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!activeConnId) return;

    setIsConnLoading(true);
    const res = await connectionService.acceptConnection(activeConnId);
    setIsConnLoading(false);

    if (res.success) {
      setConnectionStatus('accepted');
      Alert.alert(
        'Connection Accepted! 🎉',
        `You are now connected with ${student.name}. You can message each other anytime!`,
        [
          {
            text: 'Send Message',
            onPress: () => navigation.navigate('Chat', { student }),
          },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert('Accept Error', res.error || 'Failed to accept connection request.');
    }
  };

  const handleRejectRequest = async () => {
    if (!activeConnId) return;

    setIsConnLoading(true);
    const res = await connectionService.rejectConnection(activeConnId);
    setIsConnLoading(false);

    if (res.success) {
      setConnectionStatus('none');
      Alert.alert('Request Declined', 'Connection request declined.');
    } else {
      Alert.alert('Reject Error', res.error || 'Failed to decline request.');
    }
  };

  const handlePass = () => {
    setIsPassed(true);
    Alert.alert(
      'Profile Passed',
      `${student.name} has been hidden from your discovery feed.`,
      [{ text: 'Back to Discovery', onPress: () => navigation.goBack() }]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Safety Options',
      `Select an action for ${student.name || 'this student'}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report User',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Safety', {
              reportType: 'User',
              reportedUserId: student.id,
              targetName: student.name || 'Student',
              openModal: true,
            });
          },
        },
        {
          text: 'Block User',
          onPress: () => {
            blockUser(student);
            Alert.alert('User Blocked', `${student.name || 'User'} has been blocked and removed.`, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const dynamicStyles = {
    passedContainer: {
      backgroundColor: colors.background,
    },
    passedTitle: {
      color: colors.textPrimary,
    },
    mainCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    nameText: {
      color: colors.textPrimary,
    },
    collegeText: {
      color: colors.primary,
    },
    courseText: {
      color: colors.textSecondary,
    },
    locationText: {
      color: colors.textMuted,
    },
    compatBanner: {
      backgroundColor: colors.surfaceAlt,
    },
    compatExplanation: {
      color: colors.textSecondary,
    },
    specItem: {
      backgroundColor: colors.surfaceAlt,
    },
    specLabel: {
      color: colors.textMuted,
    },
    specValue: {
      color: colors.textPrimary,
    },
    bioText: {
      color: colors.textSecondary,
    },
    passBtn: {
      backgroundColor: colors.surface,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    },
    connectBtn: {
      backgroundColor: colors.primary,
    },
    connectedBtn: {
      backgroundColor: colors.textMuted,
    },
  };

  if (isPassed) {
    return (
      <Container statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Student Profile" onBack={() => navigation.goBack()} />
        <View style={[styles.passedContainer, dynamicStyles.passedContainer]}>
          <Ionicons name="eye-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.passedTitle, dynamicStyles.passedTitle]}>Profile Hidden</Text>
          <Button title="Back to Discovery" variant="primary" onPress={() => navigation.goBack()} />
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title={student.name || 'Student Profile'}
        onBack={() => navigation.goBack()}
        rightComponent={
          !isOwnProfile ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={handleBlockUser} style={{ padding: SPACING.xs }}>
                <Ionicons name="flag-outline" size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Alert.alert('Bookmark', 'Student saved to your connections list!')}
                style={{ padding: SPACING.xs }}
              >
                <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <View style={styles.content}>
        {/* Profile Image & Header Card */}
        <View style={[styles.mainCard, dynamicStyles.mainCard, shadows.medium]}>
          <Image source={{ uri: student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }} style={styles.heroImage} />

          <View style={styles.cardHeaderContent}>
            <View style={styles.nameRow}>
              <Text style={[styles.nameText, dynamicStyles.nameText]} numberOfLines={2}>{student.name || 'Student'}</Text>
              {student.isVerified && (
                <VerifiedBadge label="Verified Student" size="small" style={styles.verifiedBadgePill} />
              )}
            </View>

            <Text style={[styles.collegeText, dynamicStyles.collegeText]} numberOfLines={2}>🎓 {student.college || 'Verified Student'}</Text>
            <Text style={[styles.courseText, dynamicStyles.courseText]} numberOfLines={2}>📚 {student.course || 'Student'} ({student.yearOfStudy || 'Undergrad'})</Text>
            <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={2}>📍 {student.preferredLocation || student.city || 'Campus Area'}</Text>

            {/* Compatibility Score Banner */}
            <View style={[styles.compatBanner, dynamicStyles.compatBanner, { borderColor: compat.levelColor }]}>
              <View style={styles.compatTopRow}>
                <View style={[styles.scoreBadge, { backgroundColor: compat.levelColor }]}>
                  <Text style={styles.scoreText}>{compat.score}% Compatible</Text>
                </View>
                <Text style={[styles.levelLabel, { color: compat.levelColor }]}>{compat.level}</Text>
              </View>
              <Text style={[styles.compatExplanation, dynamicStyles.compatExplanation]}>{compat.explanation}</Text>
            </View>
          </View>
        </View>

        {/* Housing Requirements */}
        <SectionCard
          icon="home-outline"
          title="Housing Specs & Budget"
          subtitle="Target Room Details"
        >
          <View style={styles.specGrid}>
            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Monthly Budget</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{student.monthlyBudget || '₹8,500/mo'}</Text>
            </View>
            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Move-In Date</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{student.moveInDate || 'Immediate'}</Text>
            </View>
            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Room Preference</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{student.roomType || 'Shared'} Room</Text>
            </View>
            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Flat Layout</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{student.flatType || '2 BHK'}</Text>
            </View>
          </View>
        </SectionCard>

        {/* About Bio */}
        {student.aboutMe && (
          <SectionCard
            icon="information-circle-outline"
            title="About Me"
            subtitle="Personal Intro"
          >
            <Text style={[styles.bioText, dynamicStyles.bioText]}>{student.aboutMe}</Text>
          </SectionCard>
        )}

        {/* Dynamic Connection Action Footer */}
        {!isOwnProfile && (
          <View style={styles.actionsFooterRow}>
            <TouchableOpacity
              style={[styles.passBtn, dynamicStyles.passBtn]}
              onPress={handlePass}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={colors.error} />
              <Text style={styles.passBtnText}>Pass</Text>
            </TouchableOpacity>

            {connectionStatus === 'accepted' ? (
              <TouchableOpacity
                style={[styles.connectBtn, dynamicStyles.connectBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Chat', { student })}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles" size={18} color={colors.textWhite} style={{ marginRight: 6 }} />
                <Text style={styles.connectBtnText}>Message</Text>
              </TouchableOpacity>
            ) : connectionStatus === 'pending_sent' ? (
              <TouchableOpacity
                style={[styles.connectBtn, styles.connectedBtn, dynamicStyles.connectedBtn]}
                disabled
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.textWhite} style={{ marginRight: 6 }} />
                <Text style={styles.connectBtnText}>Request Pending</Text>
              </TouchableOpacity>
            ) : connectionStatus === 'pending_received' ? (
              <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.connectBtn, { flex: 1, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.errorLight, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.3)' }]}
                  onPress={handleRejectRequest}
                  disabled={isConnLoading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.connectBtnText, { color: colors.error }]}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.connectBtn, dynamicStyles.connectBtn, { flex: 1.5, backgroundColor: colors.primary }]}
                  onPress={handleAcceptRequest}
                  disabled={isConnLoading}
                  activeOpacity={0.8}
                >
                  {isConnLoading ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <Text style={styles.connectBtnText}>Accept Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.connectBtn, dynamicStyles.connectBtn]}
                onPress={handleConnect}
                disabled={isConnLoading}
                activeOpacity={0.8}
              >
                {isConnLoading ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color={colors.textWhite} style={{ marginRight: 6 }} />
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.md,
  },
  passedContainer: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passedTitle: {
    ...TYPOGRAPHY.h2,
    marginVertical: SPACING.md,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  heroImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  cardHeaderContent: {
    padding: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
    maxWidth: '65%',
  },
  verifiedBadgePill: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  collegeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  courseText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  compatBanner: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  compatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  scoreText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  compatExplanation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specItem: {
    width: '47%',
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  passBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 4,
  },
  connectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  connectedBtn: {
    backgroundColor: COLORS.textMuted,
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
});
