import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/Badge';
import { useAuth } from '../hooks/useAuth';
import { messageService, normalizeMessage, mergeMessages } from '../services/messageService';
import {
  joinConversationRoom,
  leaveConversationRoom,
  subscribeToNewMessage,
} from '../services/socketService';
import { connectionService } from '../services/connectionService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const ChatScreen = ({ route, navigation }) => {
  const { user, blockUser } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const student = route.params?.student || {};

  // Resolve authenticated user ID consistently across profile merge states
  const currentUserId = String(
    user?.userId ?? user?.user_id ?? user?.id ?? ''
  );

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [requiresConnection, setRequiresConnection] = useState(false);
  const [connectionRequested, setConnectionRequested] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals for Bug 2 (Three-dot safety menu & actions)
  const [safetyMenuVisible, setSafetyMenuVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const flatListRef = useRef(null);

  // 1. Initial Load & Background Poller
  const loadMessages = useCallback(async (isSilent = false) => {
    if (!student?.id) {
      if (!isSilent) setLoading(false);
      return;
    }

    if (!isSilent) {
      setLoading(true);
      setErrorMsg(null);
      setRequiresConnection(false);
    }

    const res = await messageService.getConversation(student.id, currentUserId);

    if (res.success) {
      setMessages((prev) => mergeMessages(prev, res.messages || []));
    } else if (res.forbidden) {
      setRequiresConnection(true);
      setErrorMsg('Messaging is restricted to accepted flatmate connections.');
    } else if (!isSilent) {
      setErrorMsg(res.error || 'Failed to load conversation history.');
      setMessages([]);
    }

    if (!isSilent) {
      setLoading(false);
    }
  }, [student?.id, currentUserId]);

  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  // 2. Real-time Socket.IO Connection & Event Subscription
  useEffect(() => {
    if (!student?.id) return;

    // Join room for this conversation
    joinConversationRoom(student.id);

    // Subscribe to incoming messages
    const unsubscribe = subscribeToNewMessage((rawMsg) => {
      const msgSenderId = String(rawMsg?.sender_id ?? rawMsg?.senderId ?? '');
      const msgReceiverId = String(rawMsg?.receiver_id ?? rawMsg?.receiverId ?? '');
      const studentId = String(student.id);

      // Verify message belongs to this specific pair
      const isRelevant =
        (msgSenderId === studentId && msgReceiverId === currentUserId) ||
        (msgSenderId === currentUserId && msgReceiverId === studentId);

      if (isRelevant) {
        const normalized = normalizeMessage(rawMsg, currentUserId);
        if (normalized) {
          setMessages((prev) => mergeMessages(prev, [normalized]));

          // If received from partner, mark as read
          if (normalized.sender === 'other' && normalized.id && !normalized.id.startsWith('temp-')) {
            messageService.markAsRead(normalized.id);
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      }
    });

    return () => {
      leaveConversationRoom(student.id);
      unsubscribe();
    };
  }, [student?.id, currentUserId]);

  // 3. Reliable Silent Background Polling (Every 3s fallback)
  useEffect(() => {
    if (!student?.id || requiresConnection || isBlocked) return;

    const interval = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [student?.id, requiresConnection, isBlocked, loadMessages]);

  // 4. Android Hardware Back Button Handling inside Chat
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBack = () => {
      if (safetyMenuVisible) {
        setSafetyMenuVisible(false);
        return true;
      }
      if (blockModalVisible) {
        setBlockModalVisible(false);
        return true;
      }
      if (reportModalVisible) {
        setReportModalVisible(false);
        return true;
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      navigation.navigate('Messages');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [safetyMenuVisible, blockModalVisible, reportModalVisible, navigation]);

  // Scroll to end when keyboard opens so the last message stays visible
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => sub.remove();
  }, []);

  const handleBack = () => {
    if (safetyMenuVisible) {
      setSafetyMenuVisible(false);
      return;
    }
    if (blockModalVisible) {
      setBlockModalVisible(false);
      return;
    }
    if (reportModalVisible) {
      setReportModalVisible(false);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Messages');
    }
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isBlocked || isSending || requiresConnection) return;

    // Create optimistic temporary message so UI updates instantly
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: student.id,
      sender: 'me',
      text: textToSend,
      isRead: false,
      status: 'sending',
      time: 'Sending...',
      rawTime: new Date().toISOString(),
    };

    // Optimistically append to message list
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setIsSending(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    const res = await messageService.sendMessage(student.id, textToSend, currentUserId);
    setIsSending(false);

    if (res.success && res.message) {
      // Smoothly replace optimistic temporary message with confirmed database record
      setMessages((prev) =>
        mergeMessages(prev, [{ ...res.message, status: 'sent' }])
      );
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    } else {
      // Revert temporary optimistic message and restore input text so user doesn't lose text
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(textToSend);

      if (res.forbidden) {
        setRequiresConnection(true);
        Alert.alert(
          'Connection Required 🔒',
          'You can only message accepted flatmate connections. Send a connection request first.'
        );
      } else {
        Alert.alert('Send Error', res.error || 'Failed to send message. Please try again.');
      }
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!student?.id) return;
    const res = await connectionService.sendConnectionRequest(student.id);
    if (res.success) {
      setConnectionRequested(true);
      Alert.alert(
        'Request Sent 🎉',
        `Connection request sent to ${student.name || 'this student'}. Once accepted, you can start chatting.`
      );
    } else if (res.conflict) {
      setConnectionRequested(true);
      Alert.alert(
        'Request Pending',
        'A connection request between you and this student is already pending or active.'
      );
    } else {
      Alert.alert('Request Error', res.error || 'Failed to send connection request.');
    }
  };

  const confirmBlockUser = () => {
    setBlockModalVisible(false);
    if (blockUser && student) blockUser(student);
    setIsBlocked(true);
    Alert.alert('User Blocked', `${student.name || 'User'} has been blocked.`);
    handleBack();
  };

  const dynamicStyles = {
    safeArea: {
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      backgroundColor: colors.background,
    },
    chatHeader: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerAvatar: {
      borderColor: colors.primary,
    },
    headerName: {
      color: colors.textPrimary,
    },
    headerSub: {
      color: colors.textSecondary,
    },
    connectionNoticeBanner: {
      backgroundColor: colors.primaryLight,
      borderBottomColor: colors.border,
    },
    connectionNoticeTitle: {
      color: colors.primary,
    },
    connectionNoticeSub: {
      color: colors.textSecondary,
    },
    connectReqBtn: {
      backgroundColor: colors.primary,
    },
    connectReqBtnDisabled: {
      backgroundColor: colors.textMuted,
    },
    connectReqBtnText: {
      color: colors.textWhite,
    },
    chatBody: {
      backgroundColor: colors.background,
    },
    emptyIconCircle: {
      backgroundColor: colors.primaryLight,
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
    bubbleMe: {
      backgroundColor: colors.primary,
    },
    bubbleOther: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    bubbleTextMe: {
      color: colors.textWhite,
    },
    bubbleTextOther: {
      color: colors.textPrimary,
    },
    timeStampText: {
      color: colors.textMuted,
    },
    composerContainer: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    },
    composerInputWrapper: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    chatInput: {
      color: colors.textPrimary,
    },
    sendBtn: {
      backgroundColor: colors.primary,
    },
    sendBtnDisabled: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
  };

  const renderMessageItem = ({ item }) => {
    const messageSenderId = String(
      item?.sender_id ?? item?.senderId ?? item?.raw?.sender_id ?? ''
    );
    const isMe =
      (Boolean(currentUserId) && messageSenderId === currentUserId) ||
      item?.sender === 'me';

    const isSendingMsg = item.status === 'sending';
    const isErrorMsg = item.status === 'error';

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? [styles.bubbleMe, dynamicStyles.bubbleMe] : [styles.bubbleOther, dynamicStyles.bubbleOther],
            shadows.small,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isMe ? [styles.bubbleTextMe, dynamicStyles.bubbleTextMe] : [styles.bubbleTextOther, dynamicStyles.bubbleTextOther],
            ]}
          >
            {item.text}
          </Text>
        </View>
        <View
          style={[
            styles.timestampRow,
            isMe ? styles.timestampRowMe : styles.timestampRowOther,
          ]}
        >
          <Text style={[styles.timeStampText, dynamicStyles.timeStampText]}>{item.time}</Text>
          {isMe && (
            <View style={{ marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
              {isSendingMsg ? (
                <ActivityIndicator size={10} color={colors.primary} />
              ) : isErrorMsg ? (
                <Ionicons name="alert-circle" size={13} color={colors.error || '#EF4444'} />
              ) : (
                <Ionicons
                  name={item.isRead ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={colors.primary}
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const isSendDisabled =
    !inputText.trim() || isBlocked || isSending || requiresConnection;

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        style={[styles.keyboardContainer, dynamicStyles.keyboardContainer]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* CHAT HEADER */}
        <View style={[styles.chatHeader, dynamicStyles.chatHeader, shadows.small]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfileRow}
            onPress={() => {
              if (student?.id) navigation.navigate('StudentProfile', { student });
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri:
                  student?.photo ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              }}
              style={[styles.headerAvatar, dynamicStyles.headerAvatar]}
            />
            <View style={styles.headerTextWrapper}>
              <View style={styles.headerNameRow}>
                <Text style={[styles.headerName, dynamicStyles.headerName]} numberOfLines={1}>
                  {student?.name || 'Student'}
                </Text>
                {student?.isVerified && <VerifiedBadge size="small" />}
              </View>
              <Text style={[styles.headerSub, dynamicStyles.headerSub]} numberOfLines={1}>
                🎓 {student?.college || 'Verified Student'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* THREE-DOT MENU BUTTON (BUG 2 FIX) */}
          <TouchableOpacity
            onPress={() => setSafetyMenuVisible(true)}
            style={styles.safetyMenuBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* CONNECTION NEEDED BANNER */}
        {requiresConnection && (
          <View style={[styles.connectionNoticeBanner, dynamicStyles.connectionNoticeBanner]}>
            <Ionicons
              name="shield-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.connectionNoticeTitle, dynamicStyles.connectionNoticeTitle]}>Accepted Connection Required</Text>
              <Text style={[styles.connectionNoticeSub, dynamicStyles.connectionNoticeSub]}>
                Messaging is allowed between accepted student flatmates for campus safety.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.connectReqBtn,
                dynamicStyles.connectReqBtn,
                connectionRequested && [styles.connectReqBtnDisabled, dynamicStyles.connectReqBtnDisabled],
              ]}
              onPress={handleSendConnectionRequest}
              disabled={connectionRequested}
              activeOpacity={0.8}
            >
              <Text style={[styles.connectReqBtnText, dynamicStyles.connectReqBtnText]}>
                {connectionRequested ? 'Sent ✔' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MESSAGES FEED */}
        <View style={[styles.chatBody, dynamicStyles.chatBody]}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading chat history...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={[styles.emptyIconCircle, dynamicStyles.emptyIconCircle]}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No messages yet</Text>
              <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
                {requiresConnection
                  ? 'Send a connection request to start chatting.'
                  : 'Start the conversation'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => String(item?.id ?? index)}
              contentContainerStyle={styles.messagesListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              renderItem={renderMessageItem}
            />
          )}
        </View>

        {/* BOTTOM MESSAGE COMPOSER */}
        <View style={[styles.composerContainer, dynamicStyles.composerContainer, { paddingBottom: Math.max(SPACING.sm, insets.bottom) }]}>
          <View style={[styles.composerInputWrapper, dynamicStyles.composerInputWrapper]}>
            <TextInput
              style={[styles.chatInput, dynamicStyles.chatInput]}
              placeholder={
                isBlocked
                  ? 'User is blocked'
                  : requiresConnection
                  ? 'Connect to unlock chat...'
                  : 'Type a message...'
              }
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              editable={!isBlocked && !requiresConnection}
              multiline
              textAlignVertical="center"
              underlineColorAndroid="transparent"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              dynamicStyles.sendBtn,
              isSendDisabled && [styles.sendBtnDisabled, dynamicStyles.sendBtnDisabled],
            ]}
            onPress={handleSendMessage}
            disabled={isSendDisabled}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : (
              <Ionicons
                name="send"
                size={17}
                color={isSendDisabled ? colors.textMuted : colors.textWhite}
                style={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* THREE-DOT SAFETY / OPTIONS MODAL MENU (BUG 2 FIX) */}
        <Modal
          visible={safetyMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSafetyMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setSafetyMenuVisible(false)}
          >
            <View
              style={[
                styles.menuCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                shadows.medium,
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.menuHeader}>
                <Text style={[styles.menuHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {student?.name || 'Chat Options'}
                </Text>
                <TouchableOpacity
                  onPress={() => setSafetyMenuVisible(false)}
                  style={styles.menuCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.menuOptionItem}
                onPress={() => {
                  setSafetyMenuVisible(false);
                  if (student?.id) {
                    navigation.navigate('StudentProfile', { student });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIconBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.menuOptionTextWrapper}>
                  <Text style={[styles.menuOptionTitle, { color: colors.textPrimary }]}>View Profile</Text>
                  <Text style={[styles.menuOptionSub, { color: colors.textSecondary }]}>View verified student details</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOptionItem}
                onPress={() => {
                  setSafetyMenuVisible(false);
                  setReportModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIconBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="flag-outline" size={18} color={colors.warning || '#F59E0B'} />
                </View>
                <View style={styles.menuOptionTextWrapper}>
                  <Text style={[styles.menuOptionTitle, { color: colors.textPrimary }]}>Report Student</Text>
                  <Text style={[styles.menuOptionSub, { color: colors.textSecondary }]}>Report inappropriate conduct</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuOptionItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setSafetyMenuVisible(false);
                  setBlockModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIconBox, { backgroundColor: colors.errorLight || '#FEE2E2' }]}>
                  <Ionicons name="shield-outline" size={18} color={colors.error || '#EF4444'} />
                </View>
                <View style={styles.menuOptionTextWrapper}>
                  <Text style={[styles.menuOptionTitle, { color: colors.error || '#EF4444' }]}>Block User</Text>
                  <Text style={[styles.menuOptionSub, { color: colors.textSecondary }]}>Stop receiving future messages</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* BLOCK USER CONFIRMATION MODAL (CROSS-PLATFORM SAFE) */}
        <Modal
          visible={blockModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setBlockModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.large]}>
              <View style={[styles.confirmIconCircle, { backgroundColor: colors.errorLight || '#FEE2E2' }]}>
                <Ionicons name="ban" size={28} color={colors.error || '#EF4444'} />
              </View>
              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                Block {student?.name || 'this student'}?
              </Text>
              <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
                You will no longer receive messages or connection requests from this student. You can manage blocked users in Settings.
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={[styles.confirmCancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setBlockModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmActionBtn, { backgroundColor: colors.error || '#EF4444' }]}
                  onPress={confirmBlockUser}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmActionText}>Block User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* REPORT USER CONFIRMATION MODAL (CROSS-PLATFORM SAFE) */}
        <Modal
          visible={reportModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.large]}>
              <View style={[styles.confirmIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="flag" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                Report {student?.name || 'Student'}
              </Text>
              <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
                Are you sure you want to report this student user for safety review or inappropriate conduct?
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={[styles.confirmCancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setReportModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setReportModalVisible(false);
                    navigation.navigate('Safety', {
                      reportType: 'Chat',
                      reportedUserId: student?.id,
                      targetName: student?.name || 'Student',
                      openModal: true,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmActionText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backBtn: {
    paddingRight: SPACING.sm,
  },
  headerProfileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: SPACING.sm,
    borderWidth: 1.5,
  },
  headerTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  safetyMenuBtn: {
    padding: SPACING.xs,
  },
  connectionNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  connectionNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectionNoticeSub: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  connectReqBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginLeft: 8,
  },
  connectReqBtnDisabled: {},
  connectReqBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatBody: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  messagesListContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: 12,
  },
  messageRow: {
    marginVertical: 2,
    maxWidth: '82%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  bubbleTextMe: {},
  bubbleTextOther: {},
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  timestampRowMe: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  timestampRowOther: {
    justifyContent: 'flex-start',
    marginLeft: 4,
  },
  timeStampText: {
    fontSize: 10.5,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  composerInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 40,
    maxHeight: 110,
    justifyContent: 'center',
  },
  chatInput: {
    fontSize: 14.5,
    lineHeight: 20,
    padding: 0,
    margin: 0,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : {}),
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },

  /* MODAL / MENU STYLES (BUG 2) */
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 56 : 60,
    paddingRight: SPACING.md,
  },
  menuCard: {
    width: 250,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: SPACING.xs,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  menuHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  menuCloseBtn: {
    padding: 2,
  },
  menuDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  menuOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  menuOptionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuOptionTextWrapper: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  menuOptionSub: {
    fontSize: 10.5,
    marginTop: 1,
  },

  /* CONFIRMATION MODALS (WEB & ANDROID ACCESSIBLE) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  confirmDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  confirmBtnRow: {
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
    fontSize: 14,
    fontWeight: '600',
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
