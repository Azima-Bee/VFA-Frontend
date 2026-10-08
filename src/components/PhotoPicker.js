import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const PhotoPicker = ({ selectedPhoto, onSelectPhoto, error = null }) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (url) => {
    onSelectPhoto(url);
    setModalVisible(false);
  };

  const pickImageFromGallery = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to choose a profile photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        onSelectPhoto(selectedUri);
        setModalVisible(false);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('Error', 'Could not open the photo gallery. Please try again.');
    }
  };

  // Check if the selected photo is a local file (from gallery)
  const isLocalPhoto = selectedPhoto && (selectedPhoto.startsWith('file://') || selectedPhoto.startsWith('content://') || selectedPhoto.startsWith('ph://'));

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Profile Photo *</Text>

      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={[
            styles.avatarPreview,
            { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            error && { borderColor: colors.error, backgroundColor: colors.errorLight },
            SHADOWS.small,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={styles.avatarImg} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
            <Ionicons name="pencil" size={12} color={colors.textWhite} />
          </View>
        </TouchableOpacity>

        <View style={styles.infoWrapper}>
          <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
            {isLocalPhoto ? 'Gallery Photo Selected' : 'Select Profile Photo'}
          </Text>
          <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>
            {isLocalPhoto
              ? 'Photo picked from your device gallery'
              : 'Tap to choose from gallery or pick an avatar'}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.changeBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.changeBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="people-outline" size={13} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.changeBtnText, { color: colors.accent }]}>Avatars</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Modal for selecting standard student avatars or gallery */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }, SHADOWS.large]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Profile Photo</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Pick from your gallery or select an avatar below:</Text>

            {/* Gallery Picker Button */}
            <TouchableOpacity
              style={[styles.galleryBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}
              onPress={pickImageFromGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.galleryIconCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name="images" size={22} color={colors.textWhite} />
              </View>
              <View style={styles.galleryTextWrap}>
                <Text style={[styles.galleryBtnTitle, { color: colors.textPrimary }]}>Choose from Gallery</Text>
                <Text style={[styles.galleryBtnSub, { color: colors.textSecondary }]}>Select a photo from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or pick an avatar</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.avatarGrid}>
              {DEFAULT_AVATARS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.gridAvatarItem,
                    selectedPhoto === url && { borderColor: colors.primary },
                  ]}
                  onPress={() => handleSelect(url)}
                >
                  <Image source={{ uri: url }} style={styles.gridImg} />
                  {selectedPhoto === url && (
                    <View style={styles.selectedOverlay}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPreview: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  avatarImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  infoWrapper: {
    flex: 1,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerSub: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  galleryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  galleryTextWrap: {
    flex: 1,
  },
  galleryBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  galleryBtnSub: {
    fontSize: 12,
    marginTop: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: SPACING.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  gridAvatarItem: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
