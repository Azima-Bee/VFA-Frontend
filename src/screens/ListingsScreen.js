import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { SelectOptionGroup } from '../components/SelectOptionGroup';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { listingService } from '../services/listingService';
import { favoriteService } from '../services/favoriteService';
import {
  DEFAULT_LISTING_IMAGE,
  STUDENT_ROOM_IMAGES,
  getListingCoverImage,
  ListingCardImage,
} from '../utils/imageUtils';
import { COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export { DEFAULT_LISTING_IMAGE, STUDENT_ROOM_IMAGES, getListingCoverImage, ListingCardImage };

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended', icon: 'sparkles' },
  { label: 'Lowest Rent', value: 'lowestRent', icon: 'arrow-down-outline' },
  { label: 'Highest Rent', value: 'highestRent', icon: 'arrow-up-outline' },
  { label: 'Newest', value: 'newest', icon: 'time-outline' },
];

export const ListingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [filterRoomType, setFilterRoomType] = useState('All');
  const [filterFlatType, setFilterFlatType] = useState('All');
  const [filterFurnishing, setFilterFurnishing] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [maxRent, setMaxRent] = useState('');

  // Create Listing Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('flat');
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newRent, setNewRent] = useState('');
  const [newDeposit, setNewDeposit] = useState('');
  const [newGenderPref, setNewGenderPref] = useState('any');
  const [newFurnished, setNewFurnished] = useState('unfurnished');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Edit Listing Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPropertyType, setEditPropertyType] = useState('flat');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRent, setEditRent] = useState('');
  const [editDeposit, setEditDeposit] = useState('');
  const [editGenderPref, setEditGenderPref] = useState('any');
  const [editFurnished, setEditFurnished] = useState('unfurnished');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const checkIsOwner = useCallback((item) => {
    const currentUserId = String(
      user?.userId ?? user?.user_id ?? user?.id ?? ''
    );

    const listingOwnerId = String(
      item?.owner_id ?? item?.ownerId ?? item?.userId ?? item?.user_id ?? ''
    );

    return Boolean(
      currentUserId &&
      listingOwnerId &&
      currentUserId === listingOwnerId
    );
  }, [user]);

  const loadFavorites = useCallback(async () => {
    try {
      const favRes = await favoriteService.getFavorites();
      if (favRes.success && Array.isArray(favRes.favorites)) {
        const ids = favRes.favorites
          .map((f) => String(f.listing_id ?? f.listingId ?? f.id ?? ''))
          .filter(Boolean);
        setSavedIds(ids);
      }
    } catch (err) {
      console.warn('Error fetching favorites:', err);
    }
  }, []);

  const loadListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setApiError(null);

    const filters = {};
    if (searchQuery.trim()) filters.city = searchQuery.trim();
    if (filterRoomType !== 'All') filters.property_type = filterRoomType;
    if (filterFurnishing !== 'All') filters.furnished = filterFurnishing;
    if (filterGender !== 'All') filters.gender_preference = filterGender;
    if (maxRent && !isNaN(maxRent)) filters.max_rent = maxRent;

    const [res] = await Promise.all([
      listingService.getListings(filters),
      loadFavorites(),
    ]);

    if (res.success && res.listings && res.listings.length > 0) {
      setListings(res.listings);
    } else {
      // Gracefully filter local MOCK_INDIAN_LISTINGS if backend is offline/empty
      let filtered = [...MOCK_INDIAN_LISTINGS];
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.city.toLowerCase().includes(q) ||
            (l.location && l.location.toLowerCase().includes(q)) ||
            l.title.toLowerCase().includes(q) ||
            (l.college && l.college.toLowerCase().includes(q))
        );
      }
      if (filterRoomType !== 'All') {
        filtered = filtered.filter(
          (l) =>
            (l.roomType && l.roomType.toLowerCase() === filterRoomType.toLowerCase()) ||
            (l.flatType && l.flatType.toLowerCase().includes(filterRoomType.toLowerCase()))
        );
      }
      if (filterFurnishing !== 'All') {
        filtered = filtered.filter(
          (l) => l.furnishing && l.furnishing.toLowerCase() === filterFurnishing.toLowerCase()
        );
      }
      if (filterGender !== 'All') {
        filtered = filtered.filter(
          (l) =>
            (l.genderPreference && l.genderPreference.toLowerCase() === filterGender.toLowerCase()) ||
            l.genderPreference === 'Any Gender'
        );
      }
      if (maxRent && !isNaN(maxRent)) {
        filtered = filtered.filter((l) => l.rent <= Number(maxRent));
      }
      setListings(filtered);
    }

    setLoading(false);
    setRefreshing(false);
  }, [searchQuery, filterRoomType, filterFurnishing, filterGender, maxRent, loadFavorites]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Save / Bookmark Toggle with Persistent Backend API
  const toggleSave = async (id) => {
    const idStr = String(id);
    const isCurrentlySaved = savedIds.some((sId) => String(sId) === idStr);

    if (isCurrentlySaved) {
      const res = await favoriteService.removeFavorite(id);
      if (res.success) {
        setSavedIds((prev) => prev.filter((sId) => String(sId) !== idStr));
        Alert.alert('Removed', 'Listing removed from bookmarks.');
      } else {
        Alert.alert('Error', res.error || 'Failed to remove from bookmarks.');
      }
    } else {
      const res = await favoriteService.addFavorite(id);
      if (res.success) {
        setSavedIds((prev) => [...prev, idStr]);
        Alert.alert('Saved! ❤️', 'Listing added to your bookmarks.');
      } else {
        Alert.alert('Error', res.error || 'Failed to add to bookmarks.');
      }
    }
  };

  // Reset Filters & Feeds
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRoomType('All');
    setFilterFlatType('All');
    setFilterFurnishing('All');
    setFilterGender('All');
    setMaxRent('');
    setSortBy('recommended');
  };

  // Handle New Listing Submission
  const handleCreateListing = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a listing title.');
      return;
    }
    if (!newCity.trim()) {
      Alert.alert('Validation Error', 'Please enter a city.');
      return;
    }
    if (!newRent || isNaN(newRent) || Number(newRent) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rent amount.');
      return;
    }

    setIsSubmittingListing(true);

    const payload = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      property_type: newPropertyType,
      city: newCity.trim(),
      address: newAddress.trim(),
      monthly_rent: Number(newRent),
      security_deposit: newDeposit ? Number(newDeposit) : 0,
      gender_preference: newGenderPref,
      furnished: newFurnished,
      image_url: newImageUrl.trim(),
    };

    const res = await listingService.createListing(payload);

    setIsSubmittingListing(false);

    if (res.success) {
      Alert.alert('Listing Created! 🎉', 'Your room listing has been posted successfully.');
      setCreateModalVisible(false);
      // Reset form
      setNewTitle('');
      setNewCity('');
      setNewAddress('');
      setNewRent('');
      setNewDeposit('');
      setNewDescription('');
      setNewImageUrl('');
      // Reload feed
      loadListings();
    } else {
      Alert.alert('Error Creating Listing', res.error || 'Failed to post listing. Please try again.');
    }
  };

  // Open Edit Modal for Owner
  const handleOpenEdit = (item) => {
    setEditingListing(item);
    setEditTitle(item.title || '');
    setEditPropertyType(item.propertyType || item.property_type || 'flat');
    setEditCity(item.city || '');
    setEditAddress(item.address || item.location || '');
    setEditRent(String(item.rent || item.monthly_rent || ''));
    setEditDeposit(String(item.deposit || item.security_deposit || ''));
    setEditGenderPref(item.gender_preference || item.genderPreference || 'any');
    setEditFurnished(item.furnished || item.furnishing || 'unfurnished');
    setEditDescription(item.description || '');
    setEditImageUrl(item.image_url || item.image || '');
    setEditModalVisible(true);
  };

  // Submit Update Listing
  const handleSaveEdit = async () => {
    if (!editingListing) return;
    if (!editTitle.trim()) {
      Alert.alert('Validation Error', 'Listing title is required.');
      return;
    }
    if (!editCity.trim()) {
      Alert.alert('Validation Error', 'City is required.');
      return;
    }

    setIsSubmittingEdit(true);

    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      property_type: editPropertyType,
      city: editCity.trim(),
      address: editAddress.trim(),
      monthly_rent: editRent ? Number(editRent) : undefined,
      security_deposit: editDeposit ? Number(editDeposit) : undefined,
      gender_preference: editGenderPref,
      furnished: editFurnished,
      image_url: editImageUrl.trim(),
    };

    const res = await listingService.updateListing(editingListing.id, payload);
    setIsSubmittingEdit(false);

    if (res.success) {
      Alert.alert('Listing Updated ✨', 'Your listing details have been saved.');
      setEditModalVisible(false);
      setEditingListing(null);
      loadListings();
    } else {
      Alert.alert('Update Error', res.error || 'Failed to update listing.');
    }
  };

  // Delete Listing for Owner
  const handleDeleteListing = (item) => {
    Alert.alert(
      'Delete Listing 🗑️',
      `Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await listingService.deleteListing(item.id);
            if (res.success) {
              Alert.alert('Listing Deleted', 'Your listing has been removed.');
              loadListings(true);
            } else {
              Alert.alert('Delete Error', res.error || 'Failed to delete listing.');
            }
          },
        },
      ]
    );
  };

  // Processed Listings with Sorting
  const processedListings = useMemo(() => {
    let list = [...listings];

    if (sortBy === 'lowestRent') {
      list.sort((a, b) => (a.rent || 0) - (b.rent || 0));
    } else if (sortBy === 'highestRent') {
      list.sort((a, b) => (b.rent || 0) - (a.rent || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [listings, sortBy]);

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
    },
    headerIconButton: {
      padding: SPACING.xs,
    },
    searchBarWrapper: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    searchInput: {
      color: colors.textPrimary,
    },
    filterBtn: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    sortLabel: {
      color: colors.textMuted,
    },
    sortChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    sortChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    sortChipText: {
      color: colors.textSecondary,
    },
    sortChipTextActive: {
      color: colors.primary,
    },
    errorBanner: {
      backgroundColor: colors.errorLight,
      borderColor: isDark ? colors.border : 'rgba(239, 68, 68, 0.3)',
    },
    errorBannerText: {
      color: colors.error,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    emptyTitle: {
      color: colors.textPrimary,
    },
    emptySub: {
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    ownerPill: {
      backgroundColor: colors.primary,
    },
    ownerPillText: {
      color: colors.textWhite,
    },
    rentBadgePill: {
      backgroundColor: colors.primary,
    },
    rentBadgeText: {
      color: colors.textWhite,
    },
    listingTitle: {
      color: colors.textPrimary,
    },
    locationText: {
      color: colors.textSecondary,
    },
    verificationRow: {
      backgroundColor: colors.verifiedLight,
      borderColor: colors.verified + '4D',
    },
    verificationText: {
      color: colors.verified,
    },
    specChip: {
      backgroundColor: colors.surfaceAlt,
    },
    specChipText: {
      color: colors.textSecondary,
    },
    descriptionPreview: {
      color: colors.textMuted,
    },
    saveActionBtn: {
      backgroundColor: colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    savedActionBtn: {
      backgroundColor: colors.primary,
    },
    ownerActionsRow: {
      borderTopColor: colors.border,
    },
    ownerEditBtn: {
      backgroundColor: colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.25)',
    },
    ownerEditBtnText: {
      color: colors.primary,
    },
    ownerDeleteBtn: {
      backgroundColor: colors.errorLight,
      borderColor: isDark ? colors.border : 'rgba(239, 68, 68, 0.25)',
    },
    ownerDeleteBtnText: {
      color: colors.error,
    },
    ownerViewBtn: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    ownerViewBtnText: {
      color: colors.textSecondary,
    },
    modalContent: {
      backgroundColor: colors.surface,
    },
    createModalContent: {
      backgroundColor: colors.surface,
    },
    modalTitle: {
      color: colors.textPrimary,
    },
    modalSubtitle: {
      color: colors.textSecondary,
    },
    inputLabel: {
      color: colors.textPrimary,
    },
    filterLabel: {
      color: colors.textPrimary,
    },
    modalInput: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
  };

  return (
    <View style={[styles.screenWrapper, dynamicStyles.screenWrapper]}>
      <Container scrollable={false} statusBarStyle={isDark ? 'light' : 'dark'}>
        {/* HEADER */}
        <Header
          title="Rooms & Flatmates"
          showBack={false}
          style={styles.headerContainer}
          rightComponent={
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={styles.headerIconButton}
              accessibilityLabel="Post a room"
            >
              <Ionicons name="add-circle" size={26} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        {/* SEARCH & FILTER TOOLBAR */}
        <View style={styles.toolbar}>
          <View style={[styles.searchBarWrapper, dynamicStyles.searchBarWrapper]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, dynamicStyles.searchInput]}
              placeholder="Search by area, college, or city..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, dynamicStyles.filterBtn]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="filter" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* SORTING CHIPS ROW */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, dynamicStyles.sortLabel]}>Sort:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sortChip,
                    dynamicStyles.sortChip,
                    isSelected && [styles.sortChipActive, dynamicStyles.sortChipActive],
                  ]}
                  onPress={() => setSortBy(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={13}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.sortChipText,
                      dynamicStyles.sortChipText,
                      isSelected && [styles.sortChipTextActive, dynamicStyles.sortChipTextActive],
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* GLOBAL ERROR BANNER */}
        {apiError && (
          <View style={[styles.errorBanner, dynamicStyles.errorBanner]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, dynamicStyles.errorBannerText]}>{apiError}</Text>
          </View>
        )}

        {/* MAIN LISTINGS FEED */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading verified student rooms...</Text>
          </View>
        ) : processedListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Rooms Match Your Criteria</Text>
            <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
              We couldn't find any listings matching your search. Adjust your filters or be the first to post a room!
            </Text>
            <View style={styles.emptyActionsRow}>
              <Button
                title="Reset Filters"
                variant="outline"
                size="medium"
                onPress={handleResetFilters}
              />
              <Button
                title="Post a Room"
                variant="gradient"
                size="medium"
                onPress={() => setCreateModalVisible(true)}
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={processedListings}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadListings(true)}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const coverImg = getListingCoverImage(item);
              const isSaved = savedIds.includes(item.id);
              const isOwner = checkIsOwner(item);
              const rentAmount = item.rent || item.monthly_rent || 0;
              const formattedRent = typeof rentAmount === 'number'
                ? `₹${rentAmount.toLocaleString('en-IN')}`
                : `₹${rentAmount}`;

              return (
                <View style={[styles.card, dynamicStyles.card, shadows.small]}>
                  {/* Property Image & Top Corner Badges */}
                  <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => navigation.navigate('ListingDetails', { listingId: item.id, listing: item, isSaved })}
                    activeOpacity={0.92}
                  >
                    <ListingCardImage sourceUri={coverImg} style={styles.cardImage} />

                    {/* Top Badges Bar inside image container */}
                    <View style={styles.imageTopOverlayBar}>
                      <View style={styles.imageBadgesLeft}>
                        {isOwner ? (
                          <View style={[styles.ownerPill, dynamicStyles.ownerPill]}>
                            <Ionicons name="person" size={11} color={colors.textWhite} style={{ marginRight: 4 }} />
                            <Text style={[styles.ownerPillText, dynamicStyles.ownerPillText]}>Your Listing</Text>
                          </View>
                        ) : (
                          <View style={styles.propertyTypePill}>
                            <Text style={styles.propertyTypePillText}>
                              {item.roomType || item.propertyType || 'Room'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.bookmarkIconBtn}
                        onPress={() => toggleSave(item.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSaved ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={isSaved ? colors.primary : '#FFFFFF'}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Rent Badge Pill at bottom corner of image */}
                    <View style={[styles.rentBadgePill, dynamicStyles.rentBadgePill, shadows.small]}>
                      <Text style={[styles.rentBadgeText, dynamicStyles.rentBadgeText]}>
                        {formattedRent}
                        <Text style={styles.rentBadgePeriod}> / mo</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    {/* Title & Location */}
                    <Text style={[styles.listingTitle, dynamicStyles.listingTitle]} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={styles.locationRow}>
                      <Ionicons name="location-sharp" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={1}>
                        {item.location || item.address || item.city}
                      </Text>
                    </View>

                    {/* Natural In-Card Verification Row */}
                    {item.isVerified && (
                      <View style={[styles.verificationRow, dynamicStyles.verificationRow]}>
                        <Ionicons name="shield-checkmark" size={13} color={colors.verified} style={{ marginRight: 4 }} />
                        <Text style={[styles.verificationText, dynamicStyles.verificationText]}>Verified Student Listing</Text>
                      </View>
                    )}

                    {/* Spec Chips */}
                    <View style={styles.specsRow}>
                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="bed-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.roomType || 'Private'}</Text>
                      </View>

                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="home-outline" size={12} color={colors.accent} style={{ marginRight: 4 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.flatType || 'Flat'}</Text>
                      </View>

                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="cube-outline" size={12} color={colors.verified} style={{ marginRight: 4 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.furnishing || 'Furnished'}</Text>
                      </View>

                      {item.genderPreference && (
                        <View style={[styles.specChip, dynamicStyles.specChip]}>
                          <Ionicons name="people-outline" size={12} color={colors.warning} style={{ marginRight: 4 }} />
                          <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.genderPreference}</Text>
                        </View>
                      )}
                    </View>

                    {/* Description preview */}
                    {item.description ? (
                      <Text style={[styles.descriptionPreview, dynamicStyles.descriptionPreview]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    {/* Card Actions Footer */}
                    {isOwner ? (
                      <View style={[styles.ownerActionsRow, dynamicStyles.ownerActionsRow]}>
                        <TouchableOpacity
                          style={[styles.ownerEditBtn, dynamicStyles.ownerEditBtn]}
                          onPress={() => handleOpenEdit(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="create-outline" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.ownerEditBtnText, dynamicStyles.ownerEditBtnText]}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.ownerDeleteBtn, dynamicStyles.ownerDeleteBtn]}
                          onPress={() => handleDeleteListing(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.error} style={{ marginRight: 4 }} />
                          <Text style={[styles.ownerDeleteBtnText, dynamicStyles.ownerDeleteBtnText]}>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.ownerViewBtn, dynamicStyles.ownerViewBtn]}
                          onPress={() => navigation.navigate('ListingDetails', { listingId: item.id, listing: item, isSaved })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.ownerViewBtnText, dynamicStyles.ownerViewBtnText]}>Details</Text>
                          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.cardActionsRow}>
                        <Button
                          title="View Room Details"
                          variant="gradient"
                          size="medium"
                          onPress={() => navigation.navigate('ListingDetails', { listingId: item.id, listing: item, isSaved })}
                          style={{ flex: 1, marginRight: SPACING.xs }}
                        />

                        <TouchableOpacity
                          style={[
                            styles.saveActionBtn,
                            dynamicStyles.saveActionBtn,
                            isSaved && [styles.savedActionBtn, dynamicStyles.savedActionBtn],
                          ]}
                          onPress={() => toggleSave(item.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSaved ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={isSaved ? colors.textWhite : colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </Container>

      {/* CREATE LISTING MODAL */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.createModalContent, dynamicStyles.createModalContent, shadows.large]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Post Room / Flat Listing</Text>
                <Text style={[styles.modalSubtitle, dynamicStyles.modalSubtitle]}>Share your place with verified students</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Title *</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="e.g. Spacious 2 BHK Private Room near Campus"
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Property Type *</Text>
              <SelectOptionGroup
                options={['flat', 'room', 'hostel']}
                selectedValue={newPropertyType}
                onSelect={setNewPropertyType}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>City *</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="e.g. Indore, Bangalore, New Delhi"
                placeholderTextColor={colors.textMuted}
                value={newCity}
                onChangeText={setNewCity}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Address / Area</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="e.g. Near Main Gate / University Campus"
                placeholderTextColor={colors.textMuted}
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Monthly Rent (₹) *</Text>
                  <TextInput
                    style={[styles.modalInput, dynamicStyles.modalInput]}
                    placeholder="e.g. 7500"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={newRent}
                    onChangeText={setNewRent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Deposit (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, dynamicStyles.modalInput]}
                    placeholder="e.g. 15000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={newDeposit}
                    onChangeText={setNewDeposit}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Gender Preference</Text>
              <SelectOptionGroup
                options={['any', 'female', 'male']}
                selectedValue={newGenderPref}
                onSelect={setNewGenderPref}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Furnishing Status</Text>
              <SelectOptionGroup
                options={['unfurnished', 'semi', 'fully']}
                selectedValue={newFurnished}
                onSelect={setNewFurnished}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Description</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput, styles.multilineInput]}
                placeholder="Describe room amenities, flatmate preferences, bills included..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Property Image URL (Optional)</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.textMuted}
                value={newImageUrl}
                onChangeText={setNewImageUrl}
              />

              <Button
                title={isSubmittingListing ? "Posting Listing..." : "Publish Room Listing"}
                variant="gradient"
                size="large"
                onPress={handleCreateListing}
                loading={isSubmittingListing}
                disabled={isSubmittingListing}
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT LISTING MODAL (For Owner) */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.createModalContent, dynamicStyles.createModalContent, shadows.large]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Edit Room Listing</Text>
                <Text style={[styles.modalSubtitle, dynamicStyles.modalSubtitle]}>Update your listing details and rent</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Title *</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Property Type *</Text>
              <SelectOptionGroup
                options={['flat', 'room', 'hostel']}
                selectedValue={editPropertyType}
                onSelect={setEditPropertyType}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>City *</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                value={editCity}
                onChangeText={setEditCity}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Address / Area</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                value={editAddress}
                onChangeText={setEditAddress}
              />

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Monthly Rent (₹) *</Text>
                  <TextInput
                    style={[styles.modalInput, dynamicStyles.modalInput]}
                    keyboardType="number-pad"
                    value={editRent}
                    onChangeText={setEditRent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Deposit (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, dynamicStyles.modalInput]}
                    keyboardType="number-pad"
                    value={editDeposit}
                    onChangeText={setEditDeposit}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Gender Preference</Text>
              <SelectOptionGroup
                options={['any', 'female', 'male']}
                selectedValue={editGenderPref}
                onSelect={setEditGenderPref}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Furnishing Status</Text>
              <SelectOptionGroup
                options={['unfurnished', 'semi', 'fully']}
                selectedValue={editFurnished}
                onSelect={setEditFurnished}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Description</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput, styles.multilineInput]}
                multiline
                value={editDescription}
                onChangeText={setEditDescription}
              />

              <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Image URL</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                value={editImageUrl}
                onChangeText={setEditImageUrl}
              />

              <Button
                title={isSubmittingEdit ? "Saving Changes..." : "Save Changes"}
                variant="gradient"
                size="large"
                onPress={handleSaveEdit}
                loading={isSubmittingEdit}
                disabled={isSubmittingEdit}
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent, shadows.large]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Filter Rooms & Flats</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Room Type */}
            <SelectOptionGroup
              label="Room Type"
              options={['All', 'Private', 'Shared']}
              selectedValue={filterRoomType}
              onSelect={setFilterRoomType}
            />

            {/* Flat Type */}
            <SelectOptionGroup
              label="Flat Layout"
              options={['All', '1 BHK', '2 BHK', '3 BHK', 'Hostel']}
              selectedValue={filterFlatType}
              onSelect={setFilterFlatType}
            />

            {/* Furnishing */}
            <SelectOptionGroup
              label="Furnishing Status"
              options={['All', 'Furnished', 'Semi-Furnished', 'Unfurnished']}
              selectedValue={filterFurnishing}
              onSelect={setFilterFurnishing}
            />

            {/* Gender Preference */}
            <SelectOptionGroup
              label="Gender Preference"
              options={['All', 'Girls Only', 'Boys Only', 'Any Gender']}
              selectedValue={filterGender}
              onSelect={setFilterGender}
            />

            {/* Max Rent Filter */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={[styles.filterLabel, dynamicStyles.filterLabel]}>Max Monthly Rent (₹)</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="e.g. 12000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={maxRent}
                onChangeText={setMaxRent}
              />
            </View>

            <View style={styles.modalActionsRow}>
              <Button
                title="Clear All"
                variant="outline"
                onPress={() => {
                  setFilterRoomType('All');
                  setFilterFlatType('All');
                  setFilterFurnishing('All');
                  setFilterGender('All');
                  setMaxRent('');
                  setSearchQuery('');
                }}
                style={{ flex: 1, marginRight: SPACING.xs }}
              />

              <Button
                title="Apply Filters"
                variant="gradient"
                onPress={() => setFilterModalVisible(false)}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <BottomNavBar activeTab="Listings" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    marginBottom: 16,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    padding: SPACING.xs,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginRight: 6,
  },
  sortScroll: {
    gap: 6,
    paddingRight: SPACING.md,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  sortChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceAlt,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageTopOverlayBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageBadgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '80%',
  },
  ownerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  ownerPillText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  propertyTypePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  propertyTypePillText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  bookmarkIconBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentBadgePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  rentBadgeText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  rentBadgePeriod: {
    fontWeight: '500',
    fontSize: 11,
    color: '#E0E7FF',
  },
  cardBody: {
    padding: SPACING.md,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verifiedLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.verified,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  descriptionPreview: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveActionBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedActionBtn: {
    backgroundColor: COLORS.primary,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  ownerEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.25)',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  ownerEditBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  ownerDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  ownerDeleteBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  ownerViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  ownerViewBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  createModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    height: 75,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
