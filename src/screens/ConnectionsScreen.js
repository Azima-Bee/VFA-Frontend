import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge, StatusBadge } from '../components/Badge';
import { BottomNavBar } from '../components/BottomNavBar';
import { calculateCompatibility } from '../utils/compatibility';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { connectionService } from '../services/connectionService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const ConnectionsScreen = ({ navigation }) => {
  const { user, isUserBlocked } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  const [activeTab, setActiveTab] = useState('Requests'); // 'Requests' | 'Connections' | 'Sent'

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadConnectionsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    const res = await connectionService.getConnections(user?.id);

    if (res.success) {
      setIncomingRequests(res.incoming || []);
      setSentRequests(res.sent || []);
      setConnections(res.accepted || []);
    } else {
      setErrorMsg(res.error || 'Failed to load connections.');
      setIncomingRequests([]);
      setSentRequests([]);
      setConnections([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    loadConnectionsData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadConnectionsData(true);
    });
    return unsubscribe;
  }, [loadConnectionsData, navigation]);

  const visibleIncoming = incomingRequests.filter((item) => !isUserBlocked(item.student?.id));
  const visibleSent = sentRequests.filter((item) => !isUserBlocked(item.student?.id));
  const visibleConnections = connections.filter((item) => !isUserBlocked(item.student?.id));

  // Accept Connection Request
  const handleAcceptRequest = async (req) => {
    setActionInProgressId(req.id);
    const res = await connectionService.acceptConnection(req.id);
    setActionInProgressId(null);

    if (res.success) {
      Alert.alert(
        'Connection Accepted! 🎉',
        `You are now connected with ${req.student?.name || 'this student'}. You can message each other anytime!`,
        [
          {
            text: 'Send Message',
            onPress: () => navigation.navigate('Chat', { student: req.student }),
          },
          { text: 'OK' },
        ]
      );
      loadConnectionsData(true);
    } else {
      Alert.alert('Accept Error', res.error || 'Failed to accept connection request.');
    }
  };

  // Reject Connection Request
  const handleRejectRequest = async (reqId) => {
    setActionInProgressId(reqId);
    const res = await connectionService.rejectConnection(reqId);
    setActionInProgressId(null);

    if (res.success) {
      Alert.alert('Request Declined', 'Connection request declined.');
      loadConnectionsData(true);
    } else {
      Alert.alert('Reject Error', res.error || 'Failed to decline connection request.');
    }
  };

  const dynamicStyles = {
    screenWrapper: { backgroundColor: colors.background },
    segmentTabBar: { backgroundColor: colors.surface, borderColor: colors.border },
    segmentTabActive: { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : COLORS.primaryLight },
    segmentTabText: { color: colors.textSecondary },
    segmentTabTextActive: { color: colors.primary },
    errorBanner: { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : COLORS.errorLight },
    errorBannerText: { color: colors.error },
    loadingText: { color: colors.textSecondary },
    emptyTitle: { color: colors.textPrimary },
    emptySub: { color: colors.textSecondary },
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    nameText: { color: colors.textPrimary },
    collegeText: { color: colors.primary },
    connectedText: { color: colors.textMuted },
    statusPill: { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : COLORS.primaryLight },
    statusPillText: { color: colors.primary },
    actionButtonsRow: { borderTopColor: colors.border },
    acceptBtn: { backgroundColor: colors.primary },
    rejectBtn: { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : COLORS.errorLight },
    messageBtn: { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : COLORS.primaryLight, borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)' },
    messageBtnText: { color: colors.primary },
    avatar: { borderColor: colors.primary },
  };

  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable={false} statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Connections" onBack={() => navigation.goBack()} />

        {/* 3-SECTION TAB BAR (Requests, Connections, Sent) */}
        <View style={[styles.segmentTabBar, dynamicStyles.segmentTabBar]}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'Requests' && [styles.segmentTabActive, dynamicStyles.segmentTabActive]]}
            onPress={() => setActiveTab('Requests')}
          >
            <Text style={[styles.segmentTabText, dynamicStyles.segmentTabText, activeTab === 'Requests' && [styles.segmentTabTextActive, dynamicStyles.segmentTabTextActive]]}>
              Requests ({visibleIncoming.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'Connections' && [styles.segmentTabActive, dynamicStyles.segmentTabActive]]}
            onPress={() => setActiveTab('Connections')}
          >
            <Text style={[styles.segmentTabText, dynamicStyles.segmentTabText, activeTab === 'Connections' && [styles.segmentTabTextActive, dynamicStyles.segmentTabTextActive]]}>
              Connections ({visibleConnections.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'Sent' && [styles.segmentTabActive, dynamicStyles.segmentTabActive]]}
            onPress={() => setActiveTab('Sent')}
          >
            <Text style={[styles.segmentTabText, dynamicStyles.segmentTabText, activeTab === 'Sent' && [styles.segmentTabTextActive, dynamicStyles.segmentTabTextActive]]}>
              Sent ({visibleSent.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ERROR BANNER */}
        {errorMsg && (
          <View style={[styles.errorBanner, dynamicStyles.errorBanner]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, dynamicStyles.errorBannerText]}>{errorMsg}</Text>
          </View>
        )}

        {/* LOADING INDICATOR */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading flatmate connections...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: INCOMING REQUESTS */}
            {activeTab === 'Requests' && (
              <View style={styles.tabContent}>
                {visibleIncoming.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="person-add-outline" size={48} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
                    <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Incoming Requests</Text>
                    <Text style={[styles.emptySub, dynamicStyles.emptySub]}>When students send you a flatmate connection request, they will appear here.</Text>
                    <Button
                      title="Discover Flatmates"
                      variant="gradient"
                      size="medium"
                      onPress={() => navigation.navigate('Discover')}
                      style={{ marginTop: SPACING.md }}
                    />
                  </View>
                ) : (
                  <FlatList
                    data={visibleIncoming}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadConnectionsData(true)}
                        tintColor={colors.primary}
                      />
                    }
                    renderItem={({ item }) => {
                      const stu = item.student;
                      const isProcessing = actionInProgressId === item.id;

                      return (
                        <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                          <TouchableOpacity
                            style={styles.cardHeaderRow}
                            onPress={() => navigation.navigate('StudentProfile', { student: stu, userId: stu.id })}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: stu.photo }} style={[styles.avatar, dynamicStyles.avatar]} />
                            <View style={styles.cardInfo}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.nameText, dynamicStyles.nameText]}>{stu.name}</Text>
                                {stu.isVerified && <VerifiedBadge size="small" />}
                              </View>
                              <Text style={[styles.collegeText, dynamicStyles.collegeText]}>🎓 {stu.college}</Text>
                            </View>
                          </TouchableOpacity>

                          {/* ACTION BUTTONS ROW */}
                          <View style={[styles.actionButtonsRow, dynamicStyles.actionButtonsRow]}>
                            <TouchableOpacity
                              style={[styles.btn, styles.rejectBtn, dynamicStyles.rejectBtn]}
                              onPress={() => handleRejectRequest(item.id)}
                              disabled={isProcessing}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close-outline" size={16} color={colors.error} />
                              <Text style={styles.rejectBtnText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.btn, styles.acceptBtn, dynamicStyles.acceptBtn]}
                              onPress={() => handleAcceptRequest(item)}
                              disabled={isProcessing}
                              activeOpacity={0.8}
                            >
                              {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.textWhite} />
                              ) : (
                                <>
                                  <Ionicons name="checkmark-outline" size={16} color={colors.textWhite} />
                                  <Text style={styles.acceptBtnText}>Accept</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }}
                  />
                )}
              </View>
            )}

            {/* TAB 2: EXISTING CONNECTIONS */}
            {activeTab === 'Connections' && (
              <View style={styles.tabContent}>
                {visibleConnections.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={48} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
                    <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Connections Yet</Text>
                    <Text style={[styles.emptySub, dynamicStyles.emptySub]}>Connect with verified students to start chatting about rooms and flat sharing.</Text>
                    <Button
                      title="Discover Flatmates"
                      variant="gradient"
                      size="medium"
                      onPress={() => navigation.navigate('Discover')}
                      style={{ marginTop: SPACING.md }}
                    />
                  </View>
                ) : (
                  <FlatList
                    data={visibleConnections}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadConnectionsData(true)}
                        tintColor={colors.primary}
                      />
                    }
                    renderItem={({ item }) => {
                      const stu = item.student;

                      return (
                        <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                          <TouchableOpacity
                            style={styles.cardHeaderRow}
                            onPress={() => navigation.navigate('StudentProfile', { student: stu, userId: stu.id })}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: stu.photo }} style={[styles.avatar, dynamicStyles.avatar]} />
                            <View style={styles.cardInfo}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.nameText, dynamicStyles.nameText]}>{stu.name}</Text>
                                {stu.isVerified && <VerifiedBadge size="small" />}
                              </View>
                              <Text style={[styles.collegeText, dynamicStyles.collegeText]}>🎓 {stu.college}</Text>
                              <Text style={[styles.connectedText, dynamicStyles.connectedText]}>Connected student flatmate</Text>
                            </View>
                          </TouchableOpacity>

                          <View style={[styles.actionButtonsRow, dynamicStyles.actionButtonsRow]}>
                            <TouchableOpacity
                              style={[styles.btn, styles.messageBtn, dynamicStyles.messageBtn]}
                              onPress={() => navigation.navigate('Chat', { student: stu })}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
                              <Text style={[styles.messageBtnText, dynamicStyles.messageBtnText]}>Message</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }}
                  />
                )}
              </View>
            )}

            {/* TAB 3: SENT REQUESTS */}
            {activeTab === 'Sent' && (
              <View style={styles.tabContent}>
                {visibleSent.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="paper-plane-outline" size={48} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
                    <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Sent Requests</Text>
                    <Text style={[styles.emptySub, dynamicStyles.emptySub]}>Connection requests you send to other students will appear here.</Text>
                    <Button
                      title="Find Flatmates"
                      variant="gradient"
                      size="medium"
                      onPress={() => navigation.navigate('Discover')}
                      style={{ marginTop: SPACING.md }}
                    />
                  </View>
                ) : (
                  <FlatList
                    data={visibleSent}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadConnectionsData(true)}
                        tintColor={colors.primary}
                      />
                    }
                    renderItem={({ item }) => {
                      const stu = item.student;

                      return (
                        <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                          <TouchableOpacity
                            style={styles.cardHeaderRow}
                            onPress={() => navigation.navigate('StudentProfile', { student: stu, userId: stu.id })}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: stu.photo }} style={[styles.avatar, dynamicStyles.avatar]} />
                            <View style={styles.cardInfo}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.nameText, dynamicStyles.nameText]}>{stu.name}</Text>
                                {stu.isVerified && <VerifiedBadge size="small" />}
                              </View>
                              <Text style={[styles.collegeText, dynamicStyles.collegeText]}>🎓 {stu.college}</Text>
                            </View>

                            <View style={[styles.statusPill, dynamicStyles.statusPill]}>
                              <Text style={[styles.statusPillText, dynamicStyles.statusPillText]}>Pending</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  />
                )}
              </View>
            )}
          </>
        )}
      </Container>

      {/* BOTTOM NAVIGATION */}
      <BottomNavBar activeTab="Connections" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmentTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  tabContent: {
    flex: 1,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listPadding: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
    maxWidth: '70%',
  },
  collegeText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  connectedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  messageBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  messageBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
