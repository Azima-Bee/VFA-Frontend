import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { BottomNavBar } from '../components/BottomNavBar';
import { MOCK_INDIAN_STUDENTS } from '../data/mockStudents';
import { calculateCompatibility } from '../utils/compatibility';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { favoriteService } from '../services/favoriteService';
import { getListingCoverImage } from './ListingsScreen';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const FavoritesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState('Listings'); // 'Listings' | 'Flatmates'

  const [savedListings, setSavedListings] = useState([]);
  const [savedFlatmates, setSavedFlatmates] = useState(MOCK_INDIAN_STUDENTS.slice(0, 3));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await favoriteService.getFavorites();
    if (res.success && Array.isArray(res.favorites)) {
      setSavedListings(res.favorites);
    } else {
      setSavedListings([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveListing = async (rawId) => {
    const listingIdStr = String(rawId);
    if (!listingIdStr) return;

    const res = await favoriteService.removeFavorite(listingIdStr);
    if (res.success) {
      setSavedListings((prev) =>
        prev.filter((item) => {
          const itemId = String(item.listing_id ?? item.listingId ?? item.id ?? '');
          return itemId !== listingIdStr;
        })
      );
      Alert.alert('Removed', 'Property removed from saved listings.');
    } else {
      Alert.alert('Error', res.error || 'Failed to remove from saved listings.');
    }
  };

  const handleRemoveFlatmate = (id) => {
    setSavedFlatmates((prev) => prev.filter((item) => item.id !== id));
    Alert.alert('Removed', 'Flatmate removed from saved favorites.');
  };

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
    },
    segmentTabBar: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    segmentTabActive: {
      backgroundColor: colors.primaryLight,
    },
    segmentTabText: {
      color: colors.textSecondary,
    },
    segmentTabTextActive: {
      color: colors.primary,
    },
    emptyTitle: {
      color: colors.textPrimary,
    },
    emptySub: {
      color: colors.textSecondary,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    rentText: {
      color: colors.primary,
    },
    roomTypeTag: {
      color: colors.textMuted,
    },
    itemTitle: {
      color: colors.textPrimary,
    },
    locText: {
      color: colors.textSecondary,
    },
    specPill: {
      backgroundColor: colors.surfaceAlt,
    },
    specPillText: {
      color: colors.textSecondary,
    },
    removeBtn: {
      backgroundColor: colors.errorLight,
      borderColor: isDark ? colors.border : 'rgba(239, 68, 68, 0.2)',
    },
    removeBtnText: {
      color: colors.error,
    },
    viewBtn: {
      backgroundColor: colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    viewBtnText: {
      color: colors.primary,
    },
    studentName: {
      color: colors.textPrimary,
    },
    collegeText: {
      color: colors.primary,
    },
    courseText: {
      color: colors.textSecondary,
    },
    compatPill: {
      backgroundColor: colors.primaryLight,
    },
    compatText: {
      color: colors.primary,
    },
    budgetPill: {
      backgroundColor: colors.accentLight,
    },
    budgetText: {
      color: colors.accent,
    },
  };

  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable={false} statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Saved Bookmarks" onBack={() => navigation.goBack()} />

        {/* 2-TAB SEGMENT CONTROL */}
        <View style={[styles.segmentTabBar, dynamicStyles.segmentTabBar]}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'Listings' && [styles.segmentTabActive, dynamicStyles.segmentTabActive]]}
            onPress={() => setActiveTab('Listings')}
          >
            <Ionicons
              name="bed-outline"
              size={16}
              color={activeTab === 'Listings' ? colors.primary : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.segmentTabText, dynamicStyles.segmentTabText, activeTab === 'Listings' && dynamicStyles.segmentTabTextActive]}>
              Saved Listings ({savedListings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'Flatmates' && [styles.segmentTabActive, dynamicStyles.segmentTabActive]]}
            onPress={() => setActiveTab('Flatmates')}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'Flatmates' ? colors.primary : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.segmentTabText, dynamicStyles.segmentTabText, activeTab === 'Flatmates' && dynamicStyles.segmentTabTextActive]}>
              Saved Flatmates ({savedFlatmates.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: SAVED LISTINGS (REAL BACKEND API DATA) */}
        {activeTab === 'Listings' && (
          <View style={styles.tabContent}>
            {loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading saved listings...</Text>
              </View>
            ) : savedListings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="bookmark-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
                <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>Nothing saved yet</Text>
                <Text style={[styles.emptySub, dynamicStyles.emptySub]}>Save your favorite room and flat listings to view them later.</Text>
                <Button
                  title="Explore Rooms & Flats"
                  variant="gradient"
                  size="medium"
                  onPress={() => navigation.navigate('Listings')}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            ) : (
              <FlatList
                data={savedListings}
                keyExtractor={(item) => String(item.listing_id ?? item.listingId ?? item.id ?? Math.random())}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchFavorites(true)}
                    tintColor={colors.primary}
                  />
                }
                renderItem={({ item }) => {
                  const coverImg = getListingCoverImage(item);
                  const listingId = String(item.listing_id ?? item.listingId ?? item.id ?? '');
                  const rentVal = item.rent || item.monthly_rent || 0;
                  const formattedRent = typeof rentVal === 'number'
                    ? `₹${rentVal.toLocaleString('en-IN')}`
                    : `₹${rentVal}`;

                  return (
                    <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                      <View style={styles.imageWrapper}>
                        <Image source={{ uri: coverImg }} style={styles.cardImage} />
                        {item.isVerified && (
                          <View style={styles.imageBadgeOverlay}>
                            <VerifiedBadge label="Verified Listing" size="small" />
                          </View>
                        )}
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.headerRow}>
                          <Text style={[styles.rentText, dynamicStyles.rentText]}>{formattedRent}/mo</Text>
                          <Text style={[styles.roomTypeTag, dynamicStyles.roomTypeTag]}>
                            {item.roomType || item.propertyType || 'Room'} • {item.flatType || 'Flat'}
                          </Text>
                        </View>

                        <Text style={[styles.itemTitle, dynamicStyles.itemTitle]} numberOfLines={1}>{item.title}</Text>
                        <Text style={[styles.locText, dynamicStyles.locText]}>📍 {item.location || item.address || item.city}</Text>

                        {/* Tag row under card content */}
                        <View style={styles.metaPillRow}>
                          <View style={[styles.specPill, dynamicStyles.specPill]}>
                            <Ionicons name="bed-outline" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                            <Text style={[styles.specPillText, dynamicStyles.specPillText]}>{item.roomType || 'Room'}</Text>
                          </View>
                          {item.genderPreference && (
                            <View style={[styles.specPill, dynamicStyles.specPill]}>
                              <Ionicons name="person-outline" size={12} color={colors.accent} style={{ marginRight: 3 }} />
                              <Text style={[styles.specPillText, dynamicStyles.specPillText]}>{item.genderPreference}</Text>
                            </View>
                          )}
                          {item.furnishing && (
                            <View style={[styles.specPill, dynamicStyles.specPill]}>
                              <Ionicons name="cube-outline" size={12} color={colors.verified} style={{ marginRight: 3 }} />
                              <Text style={[styles.specPillText, dynamicStyles.specPillText]}>{item.furnishing}</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.removeBtn, dynamicStyles.removeBtn]}
                            onPress={() => handleRemoveListing(listingId)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                            <Text style={[styles.removeBtnText, dynamicStyles.removeBtnText]}>Remove</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.viewBtn, dynamicStyles.viewBtn]}
                            onPress={() => navigation.navigate('ListingDetails', { listingId, listing: item, isSaved: true })}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.viewBtnText, dynamicStyles.viewBtnText]}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* TAB 2: SAVED FLATMATES */}
        {activeTab === 'Flatmates' && (
          <View style={styles.tabContent}>
            {savedFlatmates.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="heart-dislike-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
                <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>Nothing saved yet</Text>
                <Text style={[styles.emptySub, dynamicStyles.emptySub]}>Bookmark student flatmate profiles to easily find them later.</Text>
                <Button
                  title="Discover Flatmates"
                  variant="gradient"
                  size="medium"
                  onPress={() => navigation.navigate('Discover')}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            ) : (
              <FlatList
                data={savedFlatmates}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const compat = calculateCompatibility(user || {}, item);

                  return (
                    <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                      <View style={styles.flatmateHeaderRow}>
                        <Image source={{ uri: item.photo }} style={styles.avatarImg} />

                        <View style={styles.flatmateInfo}>
                          <Text style={[styles.studentName, dynamicStyles.studentName]} numberOfLines={1}>{item.name}</Text>
                          <Text style={[styles.collegeText, dynamicStyles.collegeText]}>🎓 {item.college}</Text>
                          {item.course && (
                            <Text style={[styles.courseText, dynamicStyles.courseText]}>📚 {item.course} • {item.yearOfStudy || 'Student'}</Text>
                          )}
                          <Text style={[styles.locText, dynamicStyles.locText]}>📍 {item.preferredLocation || item.city}</Text>
                        </View>
                      </View>

                      {/* Verified Student Tag & Compatibility Row Under Profile Card */}
                      <View style={styles.flatmateMetaRow}>
                        {item.isVerified && (
                          <VerifiedBadge label="Verified Student" size="small" />
                        )}
                        <View style={[styles.compatPill, dynamicStyles.compatPill]}>
                          <Ionicons name="sparkles" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                          <Text style={[styles.compatText, dynamicStyles.compatText]}>{compat.score}% Compatible</Text>
                        </View>
                        {item.monthlyBudget && (
                          <View style={[styles.budgetPill, dynamicStyles.budgetPill]}>
                            <Ionicons name="wallet-outline" size={12} color={colors.accent} style={{ marginRight: 3 }} />
                            <Text style={[styles.budgetText, dynamicStyles.budgetText]}>{item.monthlyBudget}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[styles.removeBtn, dynamicStyles.removeBtn]}
                          onPress={() => handleRemoveFlatmate(item.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={[styles.removeBtnText, dynamicStyles.removeBtnText]}>Remove</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.viewBtn, dynamicStyles.viewBtn]}
                          onPress={() => navigation.navigate('StudentProfile', { student: item })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.viewBtnText, dynamicStyles.viewBtnText]}>View Profile</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
      </Container>
      <BottomNavBar activeTab="Saved" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmentTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.full,
  },
  cardBody: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rentText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  roomTypeTag: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  collegeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  courseText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  locText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  flatmateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  flatmateInfo: {
    flex: 1,
    gap: 1,
  },
  flatmateMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
  },
  compatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  compatText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  budgetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  budgetText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 4,
  },
  viewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
});
