import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const VerifiedBadge = ({ label = 'Verified Student', size = 'medium', style }) => {
  const { colors } = useTheme();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.verifiedLight,
          borderColor: colors.verified + '4D', // 30% opacity
        },
        isSmall ? styles.smallBadge : styles.mediumBadge,
        style,
      ]}
    >
      <Ionicons
        name="shield-checkmark"
        size={isSmall ? 12 : 15}
        color={colors.verified}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          styles.text,
          { color: colors.verified },
          isSmall ? styles.smallText : styles.mediumText,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export const StatusBadge = ({ status = 'Not Verified', style }) => {
  const { colors } = useTheme();

  let bgColor = colors.surfaceAlt;
  let borderColor = colors.border;
  let textColor = colors.textSecondary;
  let iconName = 'help-circle-outline';
  let labelText = status;

  if (status === 'Verified') {
    bgColor = colors.verifiedLight;
    borderColor = colors.verified + '4D';
    textColor = colors.verified;
    iconName = 'shield-checkmark';
    labelText = 'Verified Student';
  } else if (status === 'Pending') {
    bgColor = colors.warningLight;
    borderColor = colors.warning + '4D';
    textColor = colors.warning;
    iconName = 'time-outline';
    labelText = 'Verification Pending';
  } else if (status === 'Rejected') {
    bgColor = colors.errorLight;
    borderColor = colors.error + '4D';
    textColor = colors.error;
    iconName = 'close-circle-outline';
    labelText = 'Verification Rejected';
  } else {
    // Not Verified
    bgColor = colors.surfaceAlt;
    borderColor = colors.border;
    textColor = colors.textSecondary;
    iconName = 'alert-circle-outline';
    labelText = 'Not Verified';
  }

  return (
    <View
      style={[
        styles.statusBadgeContainer,
        { backgroundColor: bgColor, borderColor },
        style,
      ]}
    >
      <Ionicons name={iconName} size={14} color={textColor} style={{ marginRight: 4 }} />
      <Text style={[styles.statusText, { color: textColor }]} numberOfLines={1}>
        {labelText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
  },
  mediumBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  smallBadge: {
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
  },
  text: {
    fontWeight: '700',
    flexShrink: 1,
  },
  mediumText: {
    fontSize: 12,
  },
  smallText: {
    fontSize: 11,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});
