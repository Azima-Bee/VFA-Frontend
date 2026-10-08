import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { getListingCoverImage } from './ListingsScreen';
import { listingService } from '../services/listingService';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 174;

export const MapScreen = ({ navigation }) => {
  const { colors, isDark, shadows } = useTheme();
  const [listings, setListings] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch listings from real API only — no mock fallback
  const fetchListings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);

      const result = await listingService.getListings();

      if (result.success) {
        setListings(result.listings || []);
      } else {
        setListings([]);
        setError(result.error || 'Unable to load rooms. Please try again.');
      }
    } catch (err) {
      console.warn('MapScreen: API fetch failed:', err?.message);
      setListings([]);
      setError('Unable to connect to the server. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings(true);
  }, [fetchListings]);

  // Derive unique cities from the listing data itself
  const cities = useMemo(() => {
    const citySet = new Set();
    listings.forEach((item) => {
      if (item.city) citySet.add(item.city);
    });
    return ['All', ...Array.from(citySet).sort()];
  }, [listings]);

  // Filter listings by the selected city chip
  const filteredListings = useMemo(() => {
    if (selectedCity === 'All') return listings;
    return listings.filter((item) => item.city === selectedCity);
  }, [listings, selectedCity]);

  const totalCities = cities.length - 1;
  const totalRooms = listings.length;

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
    },
    filterLabel: {
      color: colors.textPrimary,
    },
    cityChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    cityChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    cityChipText: {
      color: colors.textSecondary,
    },
    cityChipTextActive: {
      color: colors.textWhite,
    },
    resultsText: {
      color: colors.textSecondary,
    },
    listingCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    locationText: {
      color: colors.textSecondary,
    },
    defaultTag: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    defaultTagText: {
      color: colors.textSecondary,
    },
    amenityChip: {
      backgroundColor: colors.verifiedLight,
    },
    amenityText: {
      color: colors.verified,
    },
    cardFooter: {
      borderTopColor: colors.border,
    },
    availText: {
      color: colors.textMuted,
    },
    viewBtn: {
      backgroundColor: colors.primaryLight,
    },
    viewBtnText: {
      color: colors.primary,
    },
    skeletonCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    skeletonImage: {
      backgroundColor: colors.surfaceAlt,
    },
    skeletonLine: {
      backgroundColor: colors.surfaceAlt,
    },
    emptyTitle: {
      color: colors.textPrimary,
    },
    emptySub: {
      color: colors.textSecondary,
    },
  };

  // ─── Loading Skeleton ──────────────────────────────────────────────
  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeletonCard, dynamicStyles.skeletonCard, shadows.small]}>
          <View style={[styles.skeletonImage, dynamicStyles.skeletonImage]} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, dynamicStyles.skeletonLine, { width: '40%', height: 18 }]} />
            <View style={[styles.skeletonLine, dynamicStyles.skeletonLine, { width: '85%', height: 14, marginTop: 8 }]} />
            <View style={[styles.skeletonLine, dynamicStyles.skeletonLine, { width: '60%', height: 12, marginTop: 6 }]} />
            <View style={styles.skeletonChipRow}>
              <View style={[styles.skeletonChip, dynamicStyles.skeletonLine]} />
              <View style={[styles.skeletonChip, dynamicStyles.skeletonLine]} />
              <View style={[styles.skeletonChip, dynamicStyles.skeletonLine]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // ─── Empty State ───────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="search-outline" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Rooms Found</Text>
      <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
        {selectedCity !== 'All'
          ? `No student housing available in ${selectedCity} right now.\nTry a different city filter.`
          : 'No listings available at the moment.\nPull down to refresh.'}
      </Text>
      {selectedCity !== 'All' && (
        <Button
          title="Show All Cities"
          variant="outline"
          size="medium"
          onPress={() => setSelectedCity('All')}
          icon={<Ionicons name="globe-outline" size={16} color={colors.primary} />}
          style={{ marginTop: SPACING.md }}
        />
      )}
    </View>
  );

  // ─── Error State ───────────────────────────────────────────────────
  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.errorLight }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.error} />
      </View>
      <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>Connection Error</Text>
      <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
        Unable to load listings. Check your connection and try again.
      </Text>
      <Button
        title="Retry"
        variant="gradient"
        size="medium"
        onPress={() => fetchListings()}
        icon={<Ionicons name="refresh" size={16} color={colors.textWhite} />}
        style={{ marginTop: SPACING.md }}
      />
    </View>
  );

  // ─── Listing Card ─────────────────────────────────────────────────
  const renderListingCard = (item, index) => {
    const coverImg = getListingCoverImage(item);
    const amenities = item.amenities || [];
    const topAmenities = amenities.slice(0, 3);

    return (
      <TouchableOpacity
        key={item.id || `listing-${index}`}
        style={[styles.listingCard, dynamicStyles.listingCard, shadows.medium]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ListingDetails', { listing: item })}
      >
        {/* Cover Image */}
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: coverImg }} style={styles.cardImage} />

          {/* Price badge overlay */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              ₹{item.rent ? item.rent.toLocaleString('en-IN') : '—'}
            </Text>
            <Text style={styles.priceUnit}>/mo</Text>
          </View>

          {/* Verified badge overlay */}
          {item.isVerified && (
            <View style={[styles.verifiedOverlay, { backgroundColor: colors.verified }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.textWhite} />
              <Text style={[styles.verifiedOverlayText, { color: colors.textWhite }]}>Verified</Text>
            </View>
          )}

          {/* Room type badge */}
          <View style={styles.roomTypeBadge}>
            <Ionicons
              name={item.roomType === 'Shared' ? 'people-outline' : 'home-outline'}
              size={12}
              color={colors.textWhite}
            />
            <Text style={[styles.roomTypeText, { color: colors.textWhite }]}>{item.roomType || 'Room'}</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Title */}
          <Text style={[styles.cardTitle, dynamicStyles.cardTitle]} numberOfLines={2}>{item.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={1}>
              {item.location || item.city || 'Location'}
            </Text>
          </View>

          {/* Tags: Gender + Flat Type + Furnishing */}
          <View style={styles.tagsRow}>
            {item.genderPreference && item.genderPreference !== 'Any Gender' && (
              <View style={[
                styles.tag,
                {
                  backgroundColor: item.genderPreference === 'Girls Only'
                    ? (isDark ? 'rgba(236,72,153,0.18)' : '#FDF2F8')
                    : (isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF'),
                  borderColor: item.genderPreference === 'Girls Only' ? '#FBCFE8' : '#BFDBFE',
                },
              ]}>
                <Ionicons
                  name={item.genderPreference === 'Girls Only' ? 'female' : 'male'}
                  size={11}
                  color={item.genderPreference === 'Girls Only' ? '#EC4899' : '#3B82F6'}
                />
                <Text style={[styles.tagText, {
                  color: item.genderPreference === 'Girls Only' ? '#EC4899' : '#3B82F6',
                }]}>
                  {item.genderPreference}
                </Text>
              </View>
            )}
            {item.genderPreference === 'Any Gender' && (
              <View style={[styles.tag, {
                backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : '#F0FDF4',
                borderColor: isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0',
              }]}>
                <Ionicons name="people" size={11} color={colors.verified} />
                <Text style={[styles.tagText, { color: colors.verified }]}>Any Gender</Text>
              </View>
            )}
            {item.flatType && (
              <View style={[styles.tag, dynamicStyles.defaultTag]}>
                <Text style={[styles.tagText, dynamicStyles.defaultTagText]}>{item.flatType}</Text>
              </View>
            )}
            {item.furnishing && (
              <View style={[styles.tag, dynamicStyles.defaultTag]}>
                <Text style={[styles.tagText, dynamicStyles.defaultTagText]}>{item.furnishing}</Text>
              </View>
            )}
          </View>

          {/* Amenities */}
          {topAmenities.length > 0 && (
            <View style={styles.amenitiesRow}>
              {topAmenities.map((amenity, idx) => (
                <View key={idx} style={[styles.amenityChip, dynamicStyles.amenityChip]}>
                  <Ionicons name="checkmark-circle" size={11} color={colors.verified} style={{ marginRight: 3 }} />
                  <Text style={[styles.amenityText, dynamicStyles.amenityText]}>{amenity}</Text>
                </View>
              ))}
              {amenities.length > 3 && (
                <View style={[styles.amenityChip, dynamicStyles.amenityChip]}>
                  <Text style={[styles.amenityText, { color: colors.primary, fontWeight: '700' }]}>
                    +{amenities.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Footer: Available date + View Details */}
          <View style={[styles.cardFooter, dynamicStyles.cardFooter]}>
            <View style={styles.availRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.availText, dynamicStyles.availText]}>{item.availableFrom || 'Available'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.viewBtn, dynamicStyles.viewBtn]}
              onPress={() => navigation.navigate('ListingDetails', { listing: item })}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewBtnText, dynamicStyles.viewBtnText]}>View Details</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────
  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable={false} statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Campus Housing Map" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* ── Hero Card ─────────────────────────────────────────── */}
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroLabel}>🎓 Student Housing</Text>
                <Text style={styles.heroTitle}>Explore Verified Rooms</Text>
                <Text style={styles.heroSub}>
                  Near top Indian colleges & universities
                </Text>
              </View>
              <View style={styles.heroIconWrap}>
                <Ionicons name="map" size={54} color="rgba(255,255,255,0.15)" />
              </View>
            </View>

            {/* Quick stats row */}
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatPill}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroStatText}>{totalCities} cities</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Ionicons name="home" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroStatText}>{totalRooms} rooms</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroStatText}>Verified</Text>
              </View>
            </View>

            {/* Safety notice */}
            <View style={styles.safetyBanner}>
              <Ionicons name="shield-checkmark" size={12} color={colors.verified} />
              <Text style={styles.safetyText}>
                All listings are safety-reviewed for student housing
              </Text>
            </View>
          </LinearGradient>

          {/* ── City Filter Chips ─────────────────────────────────── */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, dynamicStyles.filterLabel]}>Filter by City</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {cities.map((city) => {
                const isActive = selectedCity === city;
                const count = city === 'All'
                  ? listings.length
                  : listings.filter((l) => l.city === city).length;

                return (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityChip,
                      dynamicStyles.cityChip,
                      isActive && [styles.cityChipActive, dynamicStyles.cityChipActive],
                    ]}
                    onPress={() => setSelectedCity(city)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={city === 'All' ? 'globe-outline' : 'location'}
                      size={13}
                      color={isActive ? colors.textWhite : colors.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.cityChipText,
                        dynamicStyles.cityChipText,
                        isActive && [styles.cityChipTextActive, dynamicStyles.cityChipTextActive],
                      ]}
                    >
                      {city}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }, isActive && styles.countBadgeActive]}>
                      <Text style={[styles.countText, { color: colors.primary }, isActive && styles.countTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Results Summary ────────────────────────────────────── */}
          {!isLoading && !error && filteredListings.length > 0 && (
            <View style={styles.resultsHeader}>
              <Ionicons name="bed-outline" size={16} color={colors.primary} />
              <Text style={[styles.resultsText, dynamicStyles.resultsText]}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                  {filteredListings.length}
                </Text>
                {' '}room{filteredListings.length !== 1 ? 's' : ''}{' '}
                {selectedCity !== 'All' ? `in ${selectedCity}` : 'across all cities'}
              </Text>
            </View>
          )}

          {/* ── Content Area ──────────────────────────────────────── */}
          {isLoading
            ? renderLoadingSkeleton()
            : error
              ? renderErrorState()
              : filteredListings.length === 0
                ? renderEmptyState()
                : (
                  <View style={styles.listingsContainer}>
                    {filteredListings.map((item, index) => renderListingCard(item, index))}
                  </View>
                )}

          {/* Bottom spacing for overscroll comfort */}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </Container>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -SPACING.lg, // counter Container's paddingHorizontal
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },

  // ── Hero Card ──────────────────────────────────────────────────────
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  heroIconWrap: {
    marginLeft: SPACING.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm + 2,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  heroStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  safetyText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginLeft: 5,
  },

  // ── City Filter ────────────────────────────────────────────────────
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs + 2,
  },
  filterScroll: {
    paddingRight: SPACING.md,
    gap: SPACING.xs,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '25',
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cityChipTextActive: {
    color: COLORS.textWhite,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 5,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  countTextActive: {
    color: COLORS.textWhite,
  },

  // ── Results Header ─────────────────────────────────────────────────
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },

  // ── Listing Cards Container ────────────────────────────────────────
  listingsContainer: {
    gap: SPACING.md,
  },

  // ── Individual Listing Card ────────────────────────────────────────
  listingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImageWrap: {
    position: 'relative',
    height: CARD_IMAGE_HEIGHT,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginLeft: 2,
  },
  verifiedOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verified,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  verifiedOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginLeft: 3,
  },
  roomTypeBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  roomTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textWhite,
    marginLeft: 4,
  },

  // ── Card Body ──────────────────────────────────────────────────────
  cardBody: {
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },

  // ── Tags ───────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 2,
  },

  // ── Amenities ──────────────────────────────────────────────────────
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.verifiedLight,
  },
  amenityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ── Card Footer ────────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.full,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },

  // ── Loading Skeleton ───────────────────────────────────────────────
  skeletonContainer: {
    gap: SPACING.md,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonImage: {
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: COLORS.surfaceAlt,
  },
  skeletonBody: {
    padding: SPACING.md,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
  },
  skeletonChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.sm,
  },
  skeletonChip: {
    width: 64,
    height: 22,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
  },

  // ── Empty / Error State ────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
