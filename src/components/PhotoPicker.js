import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const STUDENT_AVATARS = [
  // Female Student Avatars
  { id: 'av_1', name: 'Ananya', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_2', name: 'Priya', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_3', name: 'Sneha', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_4', name: 'Riya', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_5', name: 'Aanya', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_6', name: 'Meera', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_7', name: 'Tanvi', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_8', name: 'Diya', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80' },

  // Male Student Avatars
  { id: 'av_9', name: 'Rohan', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_10', name: 'Aarav', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_11', name: 'Vikram', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_12', name: 'Kabir', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_13', name: 'Arjun', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_14', name: 'Dev', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_15', name: 'Siddharth', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80' },
  { id: 'av_16', name: 'Aditya', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80' },
];

export const PhotoPicker = ({ selectedPhoto, onSelectPhoto, error = null }) => {
  const { colors, isDark, shadows } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (url) => {
    onSelectPhoto(url);
    setModalVisible(false);
  };

  const pickImageFromGallery = async () => {
    try {
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

  const isLocalPhoto =
    selectedPhoto &&
    (selectedPhoto.startsWith('file://') ||
      selectedPhoto.startsWith('content://') ||
      selectedPhoto.startsWith('ph://'));

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Profile Avatar & Photo *</Text>

      <View style={styles.pickerRow}>
        {/* Large Circular Avatar Preview */}
        <TouchableOpacity
          style={[
            styles.avatarPreview,
            { backgroundColor: colors.surface, borderColor: colors.primary },
            error && { borderColor: colors.error, backgroundColor: colors.errorLight },
            shadows.small,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={styles.avatarImg} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
            <Ionicons name="camera" size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.infoWrapper}>
          <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
            {isLocalPhoto ? 'Custom Photo Selected' : 'Choose Student Avatar'}
          </Text>
          <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>
            {isLocalPhoto
              ? 'Uploaded from device gallery'
              : 'Select a modern student avatar portrait or upload from gallery'}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.changeBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Pick Avatar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.changeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={pickImageFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.changeBtnText, { color: colors.textSecondary }]}>Gallery</Text>
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

      {/* Avatar Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.large,
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Student Avatar</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Pick a portrait avatar or upload from device gallery
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Gallery Pick Option */}
              <TouchableOpacity
                style={[styles.galleryBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}
                onPress={pickImageFromGallery}
                activeOpacity={0.75}
              >
                <View style={[styles.galleryIconCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name="images" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.galleryTextWrap}>
                  <Text style={[styles.galleryBtnTitle, { color: colors.textPrimary }]}>Choose from Device Gallery</Text>
                  <Text style={[styles.galleryBtnSub, { color: colors.textSecondary }]}>Upload your own profile photo</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>Modern Student Avatars</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* 4-Column Avatar Grid */}
              <View style={styles.avatarGridContainer}>
                {STUDENT_AVATARS.map((item) => {
                  const isSelected = selectedPhoto === item.url;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.avatarGridItem,
                        isSelected && [styles.avatarGridItemSelected, { borderColor: colors.primary }],
                      ]}
                      onPress={() => handleSelect(item.url)}
                      activeOpacity={0.75}
                    >
                      <Image source={{ uri: item.url }} style={styles.gridAvatarImg} />
                      {isSelected && (
                        <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
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
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPreview: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  infoWrapper: {
    flex: 1,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickerSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    justifyContent: 'flex-end',
    paddingBottom: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseIcon: {
    padding: 4,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  galleryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  galleryTextWrap: {
    flex: 1,
  },
  galleryBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtnSub: {
    fontSize: 11,
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
    fontWeight: '700',
    marginHorizontal: SPACING.sm,
  },
  avatarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.xs + 2,
    paddingBottom: SPACING.md,
  },
  avatarGridItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  avatarGridItemSelected: {
    borderWidth: 3,
  },
  gridAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.full,
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

