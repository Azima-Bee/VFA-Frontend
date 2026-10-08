import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'gradient' | 'ghost'
  size = 'medium',     // 'small' | 'medium' | 'large'
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const { colors, shadows } = useTheme();
  const isGradient = variant === 'gradient' || variant === 'primary';

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, { backgroundColor: colors.primaryLight }];
      case 'outline':
        return [styles.button, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border }];
      case 'ghost':
        return [styles.button, { backgroundColor: 'transparent' }];
      default:
        return [styles.button, { backgroundColor: colors.primary }];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.primary;
      case 'outline':
        return colors.textPrimary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textWhite;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  const content = (
    <View style={styles.innerContent}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textWhite}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.baseText, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  if (isGradient && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.gradientWrapper, shadows.medium, style]}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, getSizeStyle()]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        ...getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabledButton,
        variant === 'primary' && shadows.medium,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  button: {
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediumButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  smallButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  largeButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  disabledButton: {
    opacity: 0.5,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  baseText: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
