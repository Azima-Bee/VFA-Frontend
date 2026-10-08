import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { VerifiedBadge, StatusBadge } from '../components/Badge';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../hooks/useAuth';
import { listingService } from '../services/listingService';
import { getListingCoverImage } from './ListingsScreen';
import { MOCK_RECOMMENDED_FLATMATES, MOCK_RECENT_ROOMS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.72, 280);

export const HomeScreen = ({ navigation }) => {
  const { user, verificationStatus, unreadNotifCount } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const [flatmates, setFlatmates] = useState(MOCK_RECOMMENDED_FLATMATES);
  const [rooms, setRooms] = useState(MOCK_RECENT_ROOMS);
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    const fetchRecentListings = async () => {
      const res = await listingService.getListings({ status: 'active' });
      if (res.success && res.listings && res.listings.length > 0) {
        setRooms(res.listings);
      }
    };
    fetchRecentListings();
  }, []);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 7;
    if (user?.fullName) completed++;
    if (user?.university) completed++;
    if (user?.course || user?.major) completed++;
    if (user?.photo) completed++;
    if (user?.city) completed++;
    if (user?.aboutMe) completed++;
    if (user?.monthlyBudget) completed++;
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  const toggleSave = (id) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter((item) => item !== id));
      Alert.alert('Bookmark Removed', 'Item removed from your favorites.');
    } else {
      setSavedIds([...savedIds, id]);
      Alert.alert('Saved! ❤️', 'Item saved to your bookmarks.');
    }
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Student';

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
    },
    topHeader: {
      backgroundColor: colors.background,
    },
    greetingText: {
      color: colors.textPrimary,
    },
    greetingSub: {
      color: colors.textSecondary,
    },
    notifHeaderBtn: {
      backgroundColor: colors.surfaceAlt,
    },
    avatarHeaderCircle: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    avatarHeaderText: {
      color: colors.primary,
    },
    cardContainer: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    completionPercentText: {
      color: colors.primary,
    },
    progressBarTrack: {
      backgroundColor: colors.surfaceAlt,
    },
    progressBarFill: {
      backgroundColor: colors.primary,
    },
    cardDescText: {
      color: colors.textSecondary,
    },
    verifyActionBtn: {
      backgroundColor: colors.primary,
    },
    verifyActionBtnText: {
      color: colors.textWhite,
    },
    completeProfileBtn: {
      backgroundColor: colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    completeProfileBtnText: {
      color: colors.primary,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    viewAllText: {
      color: colors.primary,
    },
    quickActionItem: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    quickActionLabel: {
      color: colors.textPrimary,
    },
    flatmateCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    flatmateName: {
      color: colors.textPrimary,
    },
    flatmateCollege: {
      color: colors.primary,
    },
    flatmateLoc: {
      color: colors.textSecondary,
    },
    tagChip: {
      backgroundColor: colors.surfaceAlt,
    },
    tagChipText: {
      color: colors.textSecondary,
    },
    roomCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    roomRent: {
      color: colors.primary,
    },
    roomPeriod: {
      color: colors.textSecondary,
    },
    roomTitle: {
      color: colors.textPrimary,
    },
    roomLoc: {
      color: colors.textSecondary,
    },
    metaText: {
      color: colors.textSecondary,
    },
  };

  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
        {/* TOP DASHBOARD HEADER */}
        <View style={[styles.topHeader, dynamicStyles.topHeader]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingText, dynamicStyles.greetingText]}>Hi, {firstName} 👋</Text>
            <Text style={[styles.greetingSub, dynamicStyles.greetingSub]}>Find your perfect flatmate and place.</Text>
          </View>

          <View style={styles.headerRightRow}>
            {/* Notifications Icon Button */}
            <TouchableOpacity
              style={[styles.notifHeaderBtn, dynamicStyles.notifHeaderBtn]}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              {unreadNotifCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarHeaderBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={[styles.avatarHeaderImg, { borderColor: colors.primary }]} />
              ) : (
                <View style={[styles.avatarHeaderCircle, dynamicStyles.avatarHeaderCircle]}>
                  <Text style={[styles.avatarHeaderText, dynamicStyles.avatarHeaderText]}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* REQUIREMENT #3: VERIFICATION STATUS CARD */}
          <View style={[styles.cardContainer, dynamicStyles.cardContainer, shadows.small]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrapper}>
                <Ionicons name="shield-checkmark" size={18} color={colors.verified} style={{ marginRight: 6 }} />
                <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Verification Status</Text>
              </View>
              <StatusBadge status={verificationStatus} />
            </View>

            <Text style={[styles.cardDescText, dynamicStyles.cardDescText]}>
              {verificationStatus === 'Verified'
                ? 'Your student account is 100% verified. You have full access to campus matching.'
                : verificationStatus === 'Pending'
                ? 'Your student ID documents are currently under review by our moderation team.'
                : verificationStatus === 'Rejected'
                ? 'Your verification documents were rejected. Tap below to re-verify.'
                : 'Verify your college email & student ID card to earn the Verified Student Badge.'}
            </Text>

            {verificationStatus !== 'Verified' && (
              <TouchableOpacity
                style={[styles.verifyActionBtn, dynamicStyles.verifyActionBtn]}
                onPress={() => navigation.navigate('Verification')}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.textWhite} />
                <Text style={[styles.verifyActionBtnText, dynamicStyles.verifyActionBtnText]}>
                  {verificationStatus === 'Pending' ? 'View Verification Status' : 'Verify Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* REQUIREMENT #4: PROFILE COMPLETION CARD */}
          <View style={[styles.cardContainer, dynamicStyles.cardContainer, shadows.small]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrapper}>
                <Ionicons name="sparkles" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Profile Completion</Text>
              </View>
              <Text style={[styles.completionPercentText, dynamicStyles.completionPercentText]}>{completionPercentage}%</Text>
            </View>

            <View style={[styles.progressBarTrack, dynamicStyles.progressBarTrack]}>
              <View
                style={[
                  styles.progressBarFill,
                  dynamicStyles.progressBarFill,
                  { width: `${Math.min(completionPercentage, 100)}%` },
                ]}
              />
            </View>

            <Text style={[styles.cardDescText, dynamicStyles.cardDescText]}>
              Your profile is {completionPercentage}% complete. A complete profile gets 3x more flatmate responses!
            </Text>

            <TouchableOpacity
              style={[styles.completeProfileBtn, dynamicStyles.completeProfileBtn]}
              onPress={() => navigation.navigate('ProfileSetup')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.completeProfileBtnText, dynamicStyles.completeProfileBtnText]}>Complete Profile</Text>
            </TouchableOpacity>
          </View>

          {/* QUICK ACTIONS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Quick Actions & Tools</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            {/* Map Shortcut */}
            <TouchableOpacity
              style={[styles.quickActionItem, dynamicStyles.quickActionItem, shadows.small]}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' }]}>
                <Ionicons name="map" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.quickActionLabel, dynamicStyles.quickActionLabel]} numberOfLines={1}>Campus Map</Text>
            </TouchableOpacity>

            {/* Saved Bookmarks Shortcut */}
            <TouchableOpacity
              style={[styles.quickActionItem, dynamicStyles.quickActionItem, shadows.small]}
              onPress={() => navigation.navigate('Favorites')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB' }]}>
                <Ionicons name="bookmark" size={22} color={colors.warning} />
              </View>
              <Text style={[styles.quickActionLabel, dynamicStyles.quickActionLabel]} numberOfLines={1}>Saved Items</Text>
            </TouchableOpacity>

            {/* Rent Split Calculator Shortcut */}
            <TouchableOpacity
              style={[styles.quickActionItem, dynamicStyles.quickActionItem, shadows.small]}
              onPress={() => navigation.navigate('RentCalculator')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                <Ionicons name="calculator" size={22} color={colors.verified} />
              </View>
              <Text style={[styles.quickActionLabel, dynamicStyles.quickActionLabel]} numberOfLines={1}>Rent Split</Text>
            </TouchableOpacity>

            {/* Messages / Connections Shortcut */}
            <TouchableOpacity
              style={[styles.quickActionItem, dynamicStyles.quickActionItem, shadows.small]}
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF' }]}>
                <Ionicons name="chatbubbles" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.quickActionLabel, dynamicStyles.quickActionLabel]} numberOfLines={1}>Messages</Text>
            </TouchableOpacity>
          </View>

          {/* RECOMMENDED FLATMATES HORIZONTAL SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recommended Flatmates</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
              <Text style={[styles.viewAllText, dynamicStyles.viewAllText]}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {flatmates.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.flatmateCard, dynamicStyles.flatmateCard, { width: CARD_WIDTH }, shadows.small]}
                onPress={() => navigation.navigate('StudentProfile', { student: item })}
                activeOpacity={0.85}
              >
                <View style={styles.flatmateImageWrapper}>
                  <Image source={{ uri: item.photo }} style={styles.flatmatePhoto} />
                  <View style={[styles.matchBadgePill, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.matchBadgeText, { color: colors.textWhite }]}>{item.matchPercentage || 94}% Match</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookmarkIconBtn}
                    onPress={() => toggleSave(item.id)}
                  >
                    <Ionicons
                      name={savedIds.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={savedIds.includes(item.id) ? colors.primary : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.flatmateCardBody}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.flatmateName, dynamicStyles.flatmateName]} numberOfLines={1}>{item.name}</Text>
                  </View>
                  {item.isVerified && (
                    <View style={styles.badgeWrapper}>
                      <VerifiedBadge label="Verified Student" size="small" />
                    </View>
                  )}

                  <Text style={[styles.flatmateCollege, dynamicStyles.flatmateCollege]} numberOfLines={1}>🎓 {item.college}</Text>
                  <Text style={[styles.flatmateLoc, dynamicStyles.flatmateLoc]} numberOfLines={1}>📍 {item.location}</Text>

                  <View style={styles.tagsRow}>
                    <View style={[styles.tagChip, dynamicStyles.tagChip]}>
                      <Text style={[styles.tagChipText, dynamicStyles.tagChipText]}>{item.roomType}</Text>
                    </View>
                    <View style={[styles.tagChip, dynamicStyles.tagChip]}>
                      <Text style={[styles.tagChipText, dynamicStyles.tagChipText]}>{item.budget}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* RECENT ROOMS & FLATS SECTION */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Rooms & Flats</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Listings')}>
              <Text style={[styles.viewAllText, dynamicStyles.viewAllText]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roomsList}>
            {rooms.map((room) => {
              const displayRent = typeof room.rent === 'number'
                ? `₹${room.rent.toLocaleString('en-IN')}`
                : (room.rent || `₹${room.monthly_rent || 0}`);
              const coverImg = getListingCoverImage(room);
              const displayLoc = room.location || room.city || 'Campus Area';

              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, dynamicStyles.roomCard, shadows.small]}
                  onPress={() => navigation.navigate('ListingDetails', { listingId: room.id, listing: room })}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: coverImg }} style={styles.roomImage} />
                  <View style={styles.roomCardBody}>
                    <View style={styles.roomPriceRow}>
                      <Text style={[styles.roomRent, dynamicStyles.roomRent]}>
                        {displayRent}
                        <Text style={[styles.roomPeriod, dynamicStyles.roomPeriod]}>{room.period || ' / month'}</Text>
                      </Text>
                      {room.isVerified && <VerifiedBadge label="Verified Listing" size="small" />}
                    </View>

                    <Text style={[styles.roomTitle, dynamicStyles.roomTitle]} numberOfLines={1}>{room.title}</Text>
                    <Text style={[styles.roomLoc, dynamicStyles.roomLoc]}>📍 {displayLoc}</Text>

                    <View style={styles.roomMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="bed-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, dynamicStyles.metaText]}>{room.roomType || room.propertyType || 'Room'}</Text>
                      </View>

                      <View style={styles.metaItem}>
                        <Ionicons name="home-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, dynamicStyles.metaText]}>{room.flatType || room.property_type || 'Flat'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Container>

      {/* BOTTOM NAVIGATION BAR */}
      <BottomNavBar activeTab="Home" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 13,
    marginTop: 2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  avatarHeaderBtn: {
    marginLeft: SPACING.sm + 2,
  },
  avatarHeaderImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  avatarHeaderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarHeaderText: {
    fontSize: 18,
    fontWeight: '800',
  },
  mainContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  cardContainer: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  cardTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: SPACING.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  completionPercentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  verifyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
  },
  completeProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  quickActionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  quickActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs + 2,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  horizontalScrollContent: {
    gap: SPACING.md,
    paddingRight: SPACING.md,
  },
  flatmateCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  flatmateImageWrapper: {
    position: 'relative',
  },
  flatmatePhoto: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  matchBadgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bookmarkIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatmateCardBody: {
    padding: SPACING.sm + 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  flatmateName: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeWrapper: {
    marginVertical: 3,
    alignSelf: 'flex-start',
  },
  flatmateCollege: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  flatmateLoc: {
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tagChip: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roomsList: {
    gap: SPACING.md,
  },
  roomCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  roomImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  roomCardBody: {
    padding: SPACING.md,
  },
  roomPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomRent: {
    fontSize: 18,
    fontWeight: '800',
  },
  roomPeriod: {
    fontSize: 12,
    fontWeight: '400',
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  roomLoc: {
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  roomMetaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
