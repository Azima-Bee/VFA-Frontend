import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS as FALLBACK_COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const SettingsScreen = ({ navigation }) => {
  const {
    user,
    verificationStatus,
    logout,
    deleteAccount,
    notifPreferences,
    setNotifPreferences,
    privacySettings,
    setPrivacySettings,
    resetPassword,
  } = useContext(AuthContext);

  // Theme from context
  const { isDark, colors, shadows, toggleTheme } = useTheme();

  // Modal States
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyModalTitle, setPolicyModalTitle] = useState('');
  const [policyModalContent, setPolicyModalContent] = useState('');

  // Handle Logout (Requirement #7)
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your FlatMate account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  // Handle Delete Account (Requirement #8)
  const handleDeleteAccountConfirm = async () => {
    setDeleteAccountVisible(false);
    const result = await deleteAccount();
    if (result.success) {
      Alert.alert(
        'Account Deleted',
        'Your profile and local data have been cleared.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            },
          },
        ]
      );
    }
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    await resetPassword(user?.email || 'student@flatmate.demo');
    setChangePasswordVisible(false);
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
  };

  // Toggle Notification Preference
  const toggleNotifPref = (key) => {
    setNotifPreferences({
      ...notifPreferences,
      [key]: !notifPreferences[key],
    });
  };

  // Toggle Privacy Setting
  const togglePrivacy = (key) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: !privacySettings[key],
    });
  };

  const openPolicyModal = (title, content) => {
    setPolicyModalTitle(title);
    setPolicyModalContent(content);
    setPolicyModalVisible(true);
  };

  const dynamicStyles = {
    sectionHeader: {
      color: colors.textMuted,
    },
    cardGroup: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    itemTitle: {
      color: colors.textPrimary,
    },
    itemTitleOnly: {
      color: colors.textPrimary,
    },
    itemSub: {
      color: colors.textSecondary,
    },
    itemDivider: {
      backgroundColor: colors.border,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    modalTitle: {
      color: colors.textPrimary,
    },
    modalLabel: {
      color: colors.textPrimary,
    },
    modalInput: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    policyBodyText: {
      color: colors.textSecondary,
    },
    deleteTitle: {
      color: colors.textPrimary,
    },
    deleteWarningText: {
      color: colors.error,
    },
    deleteSubText: {
      color: colors.textSecondary,
    },
    cancelModalBtn: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    cancelModalText: {
      color: colors.textSecondary,
    },
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Settings & Preferences" onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          {/* SECTION 1: ACCOUNT */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>ACCOUNT</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('ProfileSetup')}
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Edit Profile</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Update bio, habits, budget & preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setChangePasswordVisible(true)}
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="key-outline" size={20} color={colors.warning} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Change Password</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Update login security credentials</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Verification')}
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.verifiedLight }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.verified} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Verification Status</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Current badge: {verificationStatus}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* SECTION 2: NOTIFICATION PREFERENCES */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>NOTIFICATION PREFERENCES</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Connection Requests</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Alerts when students request to connect</Text>
              </View>
              <Switch
                value={notifPreferences.connectionRequests}
                onValueChange={() => toggleNotifPref('connectionRequests')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Chat Messages</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Direct message notifications</Text>
              </View>
              <Switch
                value={notifPreferences.messages}
                onValueChange={() => toggleNotifPref('messages')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Room & Flat Requests</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Updates on sent room requests</Text>
              </View>
              <Switch
                value={notifPreferences.roomRequests}
                onValueChange={() => toggleNotifPref('roomRequests')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>New Matching Listings</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Alerts for new rooms near your campus</Text>
              </View>
              <Switch
                value={notifPreferences.matchingListings}
                onValueChange={() => toggleNotifPref('matchingListings')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Verification Updates</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Badge approval status notifications</Text>
              </View>
              <Switch
                value={notifPreferences.verificationUpdates}
                onValueChange={() => toggleNotifPref('verificationUpdates')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* SECTION 3: PRIVACY CONTROLS */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>PRIVACY CONTROLS</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Public Profile Visibility</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Allow profile to appear in Discovery feed</Text>
              </View>
              <Switch
                value={privacySettings.profileVisibility}
                onValueChange={() => togglePrivacy('profileVisibility')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Show College Name</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Display your university on public profile</Text>
              </View>
              <Switch
                value={privacySettings.showCollege}
                onValueChange={() => togglePrivacy('showCollege')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Show Approximate Location</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Show campus city without exact address</Text>
              </View>
              <Switch
                value={privacySettings.showApproxLocation}
                onValueChange={() => togglePrivacy('showApproxLocation')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Allow Connection Requests</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Let other students send flatmate requests</Text>
              </View>
              <Switch
                value={privacySettings.allowConnectionRequests}
                onValueChange={() => togglePrivacy('allowConnectionRequests')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* SECTION 4: APP THEME */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>PREFERENCES & THEME</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Dark Theme Mode</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>
                  {isDark ? 'Dark theme active' : 'Switch to dark interface'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* SECTION 5: SAFETY */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>SAFETY & TRUST</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Safety')}
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.verifiedLight }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Safety Center</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Safe meetup tips, rules & emergency info</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Safety')}
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="ban-outline" size={20} color={colors.error} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Blocked Users</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Manage blocked accounts list</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                openPolicyModal(
                  'Community Guidelines',
                  '1. Be Respectful: Discrimination based on major, gender, or origin is strictly prohibited.\n2. Verified Profiles: Use real student credentials.\n3. Zero Financial Fraud: Never demand money before in-person or live video property verification.'
                )
              }
            >
              <View style={[styles.itemIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="journal-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, dynamicStyles.itemTitle]}>Community Guidelines</Text>
                <Text style={[styles.itemSub, dynamicStyles.itemSub]}>Read campus behavior standards</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* SECTION 6: SUPPORT & LEGAL */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>SUPPORT & LEGAL</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert('Help & Support', 'For support, email us at support@flatmate.demo or call our campus hotline.')
              }
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, dynamicStyles.itemTitleOnly]}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert('Contact Us', 'FlatMate Inc.\nCampus Hub - Student Support Desk\nEmail: contact@flatmate.demo')
              }
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, dynamicStyles.itemTitleOnly]}>Contact Us</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                openPolicyModal(
                  'Terms & Conditions',
                  'By using FlatMate, you agree to connect strictly with verified students for housing purposes. Commercial spam or unauthorized property listings will result in immediate account suspension.'
                )
              }
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, dynamicStyles.itemTitleOnly]}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                openPolicyModal(
                  'Privacy Policy',
                  'Your privacy matters to us. We never sell student data or expose your sensitive passwords, OTPs, student ID images, or exact residential address details.'
                )
              }
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, dynamicStyles.itemTitleOnly]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* SECTION 7: ACCOUNT ACTIONS (Logout & Delete) */}
          <Text style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>ACCOUNT ACTIONS</Text>
          <View style={[styles.cardGroup, dynamicStyles.cardGroup, shadows.small, { marginBottom: SPACING.xl }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.primary} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, { color: colors.primary, fontWeight: '700' }]}>
                Log Out
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, dynamicStyles.itemDivider]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setDeleteAccountVisible(true)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} style={styles.leadIcon} />
              <Text style={[styles.itemTitleOnly, { color: colors.error, fontWeight: '700' }]}>
                Delete Account
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Container>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={changePasswordVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Change Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, dynamicStyles.modalLabel]}>New Password:</Text>
            <TextInput
              style={[styles.modalInput, dynamicStyles.modalInput]}
              secureTextEntry={true}
              placeholder="Enter at least 6 characters..."
              placeholderTextColor={colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={[styles.modalLabel, dynamicStyles.modalLabel]}>Confirm New Password:</Text>
            <TextInput
              style={[styles.modalInput, dynamicStyles.modalInput]}
              secureTextEntry={true}
              placeholder="Re-enter new password..."
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title="Update Password"
              variant="gradient"
              size="large"
              onPress={handleChangePassword}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL (Requirement #8) */}
      <Modal
        visible={deleteAccountVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteAccountVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={styles.deleteHeaderRow}>
              <Ionicons name="warning" size={32} color={colors.error} />
              <Text style={[styles.deleteTitle, dynamicStyles.deleteTitle]}>Delete Account?</Text>
            </View>

            <Text style={[styles.deleteWarningText, dynamicStyles.deleteWarningText]}>
              "Deleting your account will remove your profile and local app data."
            </Text>
            <Text style={[styles.deleteSubText, dynamicStyles.deleteSubText]}>
              This action cannot be undone. Are you sure you wish to proceed with deleting your FlatMate profile?
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelModalBtn, dynamicStyles.cancelModalBtn]}
                onPress={() => setDeleteAccountVisible(false)}
              >
                <Text style={[styles.cancelModalText, dynamicStyles.cancelModalText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteAccountConfirm}
              >
                <Text style={styles.confirmDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GENERIC POLICY MODAL */}
      <Modal
        visible={policyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>{policyModalTitle}</Text>
              <TouchableOpacity onPress={() => setPolicyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <Text style={[styles.policyBodyText, dynamicStyles.policyBodyText]}>{policyModalContent}</Text>
            </ScrollView>

            <Button
              title="Close"
              variant="outline"
              size="medium"
              onPress={() => setPolicyModalVisible(false)}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  itemDivider: {
    height: 1,
    marginLeft: SPACING.md,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  leadIcon: {
    marginRight: SPACING.sm + 2,
  },
  itemTextContainer: {
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemTitleOnly: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
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
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  policyBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Delete Modal
  deleteHeaderRow: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.xs,
  },
  deleteWarningText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  deleteSubText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

