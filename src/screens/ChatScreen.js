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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/Badge';
import { useAuth } from '../hooks/useAuth';
import { messageService } from '../services/messageService';
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

  const flatListRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!student?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setRequiresConnection(false);

    const res = await messageService.getConversation(student.id, currentUserId);

    if (res.success) {
      setMessages(res.messages || []);
    } else if (res.forbidden) {
      setRequiresConnection(true);
      setErrorMsg('Messaging is restricted to accepted flatmate connections.');
    } else {
      setErrorMsg(res.error || 'Failed to load conversation history.');
      setMessages([]);
    }

    setLoading(false);
  }, [student?.id, currentUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isBlocked || isSending || requiresConnection) return;

    setInputText('');
    setIsSending(true);

    const res = await messageService.sendMessage(student.id, textToSend, currentUserId);
    setIsSending(false);

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (res.forbidden) {
      setRequiresConnection(true);
      Alert.alert(
        'Connection Required 🔒',
        'You can only message accepted flatmate connections. Send a connection request first.'
      );
    } else {
      Alert.alert('Send Error', res.error || 'Failed to send message.');
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

  const handleReportUser = () => {
    Alert.alert(
      `Report ${student.name || 'User'}`,
      'Are you sure you want to report this student user for inappropriate behavior?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Safety', {
              reportType: 'Chat',
              reportedUserId: student?.id,
              targetName: student?.name || 'Student',
              openModal: true,
            });
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      `Block ${student.name || 'User'}`,
      'You will no longer receive messages or flatmate requests from this student.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: () => {
            if (blockUser && student) blockUser(student);
            setIsBlocked(true);
            Alert.alert('User Blocked', `${student.name || 'User'} has been blocked.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const showSafetyMenu = () => {
    Alert.alert(
      `Safety Options: ${student.name || 'Student'}`,
      'Select an action below:',
      [
        { text: 'Report User', onPress: handleReportUser },
        { text: 'Block User', style: 'destructive', onPress: handleBlockUser },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
            <Ionicons
              name={item.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={colors.primary}
              style={{ marginLeft: 3 }}
            />
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
            onPress={() => navigation.goBack()}
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

          <TouchableOpacity
            onPress={showSafetyMenu}
            style={styles.safetyMenuBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
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
  connectReqBtnDisabled: {
  },
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
  bubbleTextMe: {
  },
  bubbleTextOther: {
  },
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
});
