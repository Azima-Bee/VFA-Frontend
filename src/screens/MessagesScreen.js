import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../hooks/useAuth';
import { messageService } from '../services/messageService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const MessagesScreen = ({ navigation }) => {
  const { user, isUserBlocked } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    const res = await messageService.getConversations();

    if (res.success) {
      setConversations(res.conversations || []);
    } else {
      setErrorMsg(res.error || 'Failed to load conversations.');
      setConversations([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadConversations();
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations(true);
    });
    return unsubscribe;
  }, [loadConversations, navigation]);

  const visibleConversations = conversations.filter(
    (item) => !isUserBlocked(item.student?.id)
  );

  const handleOpenChat = (item) => {
    // Clear local unread flag on tap
    setConversations((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, unreadCount: 0 } : c))
    );

    navigation.navigate('Chat', {
      student: item.student,
    });
  };

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
    },
    connectionsBanner: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    bannerIconBox: {
      backgroundColor: colors.primaryLight,
    },
    bannerTitle: {
      color: colors.textPrimary,
    },
    bannerSub: {
      color: colors.textSecondary,
    },
    errorBanner: {
      backgroundColor: colors.errorLight,
    },
    errorBannerText: {
      color: colors.error,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    emptyTitle: {
      color: colors.textPrimary,
    },
    emptySub: {
      color: colors.textSecondary,
    },
    chatCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    avatarImg: {
      borderColor: colors.primary,
    },
    onlineDot: {
      backgroundColor: colors.verified,
      borderColor: colors.surface,
    },
    studentName: {
      color: colors.textPrimary,
    },
    timeText: {
      color: colors.textMuted,
    },
    collegeText: {
      color: colors.primary,
    },
    lastMsgText: {
      color: colors.textSecondary,
    },
    lastMsgTextUnread: {
      color: colors.textPrimary,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
    },
    unreadText: {
      color: colors.textWhite,
    },
  };

  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable={false} statusBarStyle={isDark ? 'light' : 'dark'}>
        {/* HEADER */}
        <Header
          title="Messages"
          showBack={false}
          rightComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate('Connections')}
              style={styles.connectionsHeaderBtn}
            >
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        {/* CONNECTIONS QUICK BAR */}
        <TouchableOpacity
          style={[styles.connectionsBanner, dynamicStyles.connectionsBanner, shadows.small]}
          onPress={() => navigation.navigate('Connections')}
          activeOpacity={0.85}
        >
          <View style={[styles.bannerIconBox, dynamicStyles.bannerIconBox]}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, dynamicStyles.bannerTitle]}>Manage Flatmate Connections</Text>
            <Text style={[styles.bannerSub, dynamicStyles.bannerSub]}>View pending requests & accepted flatmate connections</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* ERROR BANNER */}
        {errorMsg && (
          <View style={[styles.errorBanner, dynamicStyles.errorBanner]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, dynamicStyles.errorBannerText]}>{errorMsg}</Text>
          </View>
        )}

        {/* CONVERSATIONS FEED */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading conversations...</Text>
          </View>
        ) : visibleConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Conversations Yet</Text>
            <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
              Accept connection requests from student flatmates to start chatting safely.
            </Text>
            <Button
              title="View Connections"
              variant="gradient"
              size="medium"
              onPress={() => navigation.navigate('Connections')}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <FlatList
            data={visibleConversations}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadConversations(true)}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const stu = item.student;

              return (
                <TouchableOpacity
                  style={[styles.chatCard, dynamicStyles.chatCard, shadows.small]}
                  onPress={() => handleOpenChat(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: stu.photo }} style={[styles.avatarImg, dynamicStyles.avatarImg]} />
                    {item.unreadCount > 0 && <View style={[styles.onlineDot, dynamicStyles.onlineDot]} />}
                  </View>

                  <View style={styles.chatInfo}>
                    <View style={styles.nameTimeRow}>
                      <View style={styles.nameBadgeContainer}>
                        <Text style={[styles.studentName, dynamicStyles.studentName]}>{stu.name}</Text>
                        {stu.isVerified && <VerifiedBadge size="small" />}
                      </View>
                      <Text style={[styles.timeText, dynamicStyles.timeText]}>{item.lastMessageTime}</Text>
                    </View>

                    <Text style={[styles.collegeText, dynamicStyles.collegeText]}>🎓 {stu.college}</Text>

                    <View style={styles.msgRow}>
                      <Text
                        style={[
                          styles.lastMsgText,
                          dynamicStyles.lastMsgText,
                          item.unreadCount > 0 && [styles.lastMsgTextUnread, dynamicStyles.lastMsgTextUnread],
                        ]}
                        numberOfLines={1}
                      >
                        {item.lastMessageText || 'Tap to view chat'}
                      </Text>

                      {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, dynamicStyles.unreadBadge]}>
                          <Text style={[styles.unreadText, dynamicStyles.unreadText]}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </Container>

      {/* BOTTOM NAVIGATION */}
      <BottomNavBar activeTab="Messages" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  connectionsHeaderBtn: {
    padding: SPACING.xs,
  },
  connectionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
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
    marginTop: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  chatInfo: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: 4,
  },
  nameBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  timeText: {
    fontSize: 11,
  },
  collegeText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  msgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsgText: {
    fontSize: 13,
    flex: 1,
    marginRight: SPACING.xs,
  },
  lastMsgTextUnread: {
    fontWeight: '700',
  },
  unreadBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: RADIUS.full,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
