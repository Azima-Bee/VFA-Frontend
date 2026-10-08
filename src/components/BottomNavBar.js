import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home', outlineIcon: 'home-outline' },
  { key: 'Discover', label: 'Discover', icon: 'compass', outlineIcon: 'compass-outline' },
  { key: 'Listings', label: 'Listings', icon: 'bed', outlineIcon: 'bed-outline' },
  { key: 'Messages', label: 'Messages', icon: 'chatbubbles', outlineIcon: 'chatbubbles-outline' },
  { key: 'Profile', label: 'Profile', icon: 'person', outlineIcon: 'person-outline' },
];

export const BottomNavBar = ({ activeTab = 'Home', navigation }) => {
  const { colors, shadows } = useTheme();

  const handleTabPress = (tabKey) => {
    if (tabKey === activeTab) return;
    navigation.navigate(tabKey);
  };

  return (
    <View style={[styles.container, shadows.medium, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.content}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isActive ? tab.icon : tab.outlineIcon}
                  size={22}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                {tab.badge && (
                  <View style={[styles.badgePill, { backgroundColor: colors.accent }]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: colors.textMuted },
                  isActive && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: RADIUS.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
