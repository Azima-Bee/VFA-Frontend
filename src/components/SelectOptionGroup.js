import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const SelectOptionGroup = ({
  label,
  options = [], // Can be array of strings or objects { label, value, icon }
  selectedValue,
  onSelect,
  error = null,
  helperText = null,
  style,
  columns = 2,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}

      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isObj = typeof opt === 'object';
          const val = isObj ? opt.value : opt;
          const optLabel = isObj ? opt.label : opt;
          const icon = isObj ? opt.icon : null;
          const isSelected = selectedValue === val;

          return (
            <TouchableOpacity
              key={val}
              style={[
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                error && !selectedValue && { borderColor: colors.error, backgroundColor: colors.errorLight },
              ]}
              onPress={() => onSelect(val)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                {icon && (
                  <Ionicons
                    name={icon}
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    style={styles.iconMargin}
                  />
                )}
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {optLabel}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color={colors.textWhite} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    minWidth: '28%',
    flexGrow: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
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
