import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = null,
  leftIcon = null,
  keyboardType = 'default',
  autoCapitalize = 'none',
  helperText = null,
  editable = true,
  style,
  inputStyle,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          isFocused && {
            borderColor: colors.primary,
            backgroundColor: colors.surface,
            ...(Platform.OS === 'web'
              ? {
                  boxShadow: '0 0 0 3.5px rgba(79, 70, 229, 0.18)',
                }
              : {}),
          },
          error && {
            borderColor: colors.error,
            backgroundColor: colors.errorLight,
            ...(Platform.OS === 'web'
              ? {
                  boxShadow: '0 0 0 3.5px rgba(239, 68, 68, 0.18)',
                }
              : {}),
          },
          !editable && {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            opacity: 0.7,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          style={[styles.textInput, { color: colors.textPrimary }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          underlineColorAndroid="transparent"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconWrapper}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        }
      : {}),
  },
  leftIconWrapper: {
    marginRight: SPACING.sm,
  },
  rightIconWrapper: {
    padding: SPACING.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : {}),
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
  helperText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
