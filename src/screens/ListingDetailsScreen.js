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
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { SectionCard } from '../components/SectionCard';
import { SelectOptionGroup } from '../components/SelectOptionGroup';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { listingService } from '../services/listingService';
import { favoriteService } from '../services/favoriteService';
import { DEFAULT_LISTING_IMAGE, getListingCoverImage } from './ListingsScreen';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export const ListingDetailsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { colors, isDark, shadows } = useTheme();
  const initialListing = route.params?.listing || {};
  const listingIdParam = route.params?.listingId || initialListing.id;

  const [listing, setListing] = useState(initialListing);
  const [loading, setLoading] = useState(!!listingIdParam && !initialListing.title);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isSaved, setIsSaved] = useState(route.params?.isSaved || false);
  const [isRequested, setIsRequested] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Edit Listing State (for Owner)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const populateEditForm = (item) => {
    if (!item) return;
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
  };

  useEffect(() => {
    const fetchListingDetail = async () => {
      const parsedId = parseInt(listingIdParam, 10);
      if (isNaN(parsedId) || parsedId <= 0) {
        if (!initialListing.title) setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      const res = await listingService.getListingById(parsedId);

      if (res.success && res.listing) {
        setListing(res.listing);
        populateEditForm(res.listing);
      } else if (res.notFound) {
        setNotFound(true);
      } else {
        setErrorMsg(res.error || 'Failed to fetch listing details.');
        if (initialListing.title) {
          populateEditForm(initialListing);
        }
      }
      setLoading(false);
    };

    fetchListingDetail();
  }, [listingIdParam]);

  // Fetch persistent favorite status from backend
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      const currentListingId = String(listingIdParam ?? initialListing?.id ?? '');
      if (!currentListingId) return;

      const favRes = await favoriteService.getFavorites();
      if (favRes.success && Array.isArray(favRes.favorites)) {
        const isFav = favRes.favorites.some(
          (f) => String(f.listing_id ?? f.listingId ?? f.id ?? '') === currentListingId
        );
        setIsSaved(isFav);
      }
    };

    fetchFavoriteStatus();
  }, [listingIdParam, initialListing?.id]);

  // Comprehensive Owner Check
  const currentUserId = String(
    user?.userId ?? user?.user_id ?? user?.id ?? ''
  );

  const listingOwnerId = String(
    listing?.owner_id ?? listing?.ownerId ?? listing?.userId ?? listing?.user_id ?? ''
  );

  const isOwner = Boolean(
    currentUserId &&
    listingOwnerId &&
    currentUserId === listingOwnerId
  );

  const handleDeleteListing = () => {
    Alert.alert(
      'Delete Listing 🗑️',
      'Are you sure you want to permanently delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Listing',
          style: 'destructive',
          onPress: async () => {
            const res = await listingService.deleteListing(listing.id);
            if (res.success) {
              Alert.alert('Listing Deleted', 'Your listing has been deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else if (res.forbidden) {
              Alert.alert('Permission Error', 'You are not authorized to delete this listing.');
            } else {
              Alert.alert('Delete Error', res.error || 'Failed to delete listing.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateListing = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }
    if (!editCity.trim()) {
      Alert.alert('Validation Error', 'City is required.');
      return;
    }

    setIsUpdating(true);
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

    const res = await listingService.updateListing(listing.id, payload);
    setIsUpdating(false);

    if (res.success && res.listing) {
      setListing(res.listing);
      setEditModalVisible(false);
      Alert.alert('Listing Updated ✨', 'Your room listing has been updated.');
    } else if (res.forbidden) {
      Alert.alert('Permission Error', 'You are not authorized to modify this listing.');
    } else {
      Alert.alert('Update Error', res.error || 'Failed to update listing.');
    }
  };

  // Deterministic photo list
  const photos = listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0
    ? listing.photos
    : [getListingCoverImage(listing)];

  const handleToggleSave = async () => {
    const currentListingId = String(listing?.id ?? listingIdParam ?? initialListing?.id ?? '');
    if (!currentListingId) return;

    if (isSaved) {
      const res = await favoriteService.removeFavorite(currentListingId);
      if (res.success) {
        setIsSaved(false);
        Alert.alert('Removed from Bookmarks', `${listing.title || 'Listing'} removed from your bookmarks.`);
      } else {
        Alert.alert('Error', res.error || 'Failed to remove from bookmarks.');
      }
    } else {
      const res = await favoriteService.addFavorite(currentListingId);
      if (res.success) {
        setIsSaved(true);
        Alert.alert('Saved to Bookmarks ❤️', `${listing.title || 'Listing'} added to your bookmarks!`);
      } else {
        Alert.alert('Error', res.error || 'Failed to add to bookmarks.');
      }
    }
  };

  const handleRequestRoom = () => {
    if (isRequested) return;

    const rentVal = (listing.rent || listing.monthly_rent || 0).toLocaleString('en-IN');
    const locVal = listing.location || listing.city || 'Campus Area';

    Alert.alert(
      'Confirm Room Request 🏡',
      `Would you like to send a room booking inquiry for ₹${rentVal}/mo at ${locVal}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: () => {
            setIsRequested(true);
            Alert.alert(
              'Room Request Sent! 🎉',
              'Your inquiry has been sent to the host. They will review your profile and respond shortly.'
            );
          },
        },
      ]
    );
  };

  const handleContactOwner = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to contact room owners.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (isOwner) {
      Alert.alert('Your Listing', 'You are the owner of this listing.');
      return;
    }

    const ownerId = listing.ownerId || listing.owner_id || `host_${listing.id}`;
    const ownerStudent = {
      id: ownerId,
      name: listing.owner_name || listing.ownerName || 'Property Host',
      email: listing.owner_email || listing.ownerEmail || '',
      college: listing.college || listing.city || 'Campus Area',
      photo: listing.owner_photo || listing.ownerPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      isVerified: true,
    };

    navigation.navigate('Chat', {
      student: ownerStudent,
      listingId: listing.id,
    });
  };

  const handleReportListing = () => {
    Alert.alert(
      'Report Listing',
      'Are you sure you want to report this property listing to FlatMate moderation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Safety', {
              reportType: 'Listing',
              listingId: listing.id,
              targetName: listing.title || `Listing #${listing.id}`,
              openModal: true,
            });
          },
        },
      ]
    );
  };

  const dynamicStyles = {
    centerContainer: {
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    notFoundTitle: {
      color: colors.textPrimary,
    },
    notFoundSub: {
      color: colors.textSecondary,
    },
    ownerBanner: {
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.25)',
      borderLeftColor: colors.primary,
    },
    ownerTitle: {
      color: colors.primary,
    },
    statusPill: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : colors.primaryLight,
    },
    statusPillText: {
      color: colors.primary,
    },
    ownerSub: {
      color: colors.textSecondary,
    },
    ownerEditBtn: {
      backgroundColor: colors.primary,
    },
    ownerEditBtnText: {
      color: colors.textWhite,
    },
    ownerDeleteBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.errorLight,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    },
    ownerDeleteBtnText: {
      color: colors.error,
    },
    galleryWrapper: {
      backgroundColor: colors.surfaceAlt,
    },
    mainCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    rentLabel: {
      color: colors.textMuted,
    },
    rentText: {
      color: colors.primary,
    },
    rentPeriod: {
      color: colors.textSecondary,
    },
    genderBadge: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : colors.primaryLight,
      borderColor: isDark ? colors.border : 'rgba(79, 70, 229, 0.2)',
    },
    genderBadgeText: {
      color: colors.primary,
    },
    listingTitle: {
      color: colors.textPrimary,
    },
    locationText: {
      color: colors.textSecondary,
    },
    safetyNotice: {
      backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : colors.accentLight,
    },
    safetyNoticeText: {
      color: colors.accent,
    },
    divider: {
      backgroundColor: colors.border,
    },
    specItem: {
      backgroundColor: colors.surfaceAlt,
    },
    specLabel: {
      color: colors.textMuted,
    },
    specValue: {
      color: colors.textPrimary,
    },
    verifiedCard: {
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : 'rgba(16, 185, 129, 0.3)',
      borderLeftColor: colors.verified,
    },
    verifiedIconCircle: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : colors.verifiedLight,
    },
    verifiedTitle: {
      color: colors.textPrimary,
    },
    verifiedSubtitle: {
      color: colors.textSecondary,
    },
    descriptionText: {
      color: colors.textSecondary,
    },
    amenityChip: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    amenityChipText: {
      color: colors.textPrimary,
    },
    hostAvatar: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : colors.primaryLight,
      borderColor: colors.primary,
    },
    hostAvatarText: {
      color: colors.primary,
    },
    hostName: {
      color: colors.textPrimary,
    },
    hostSub: {
      color: colors.textSecondary,
    },
    secondaryBtn: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    secondaryBtnText: {
      color: colors.primary,
    },
    reportBtn: {
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.errorLight,
    },
    editModalContent: {
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
    modalInput: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
  };

  if (loading) {
    return (
      <Container statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Room Details" onBack={() => navigation.goBack()} />
        <View style={[styles.centerContainer, dynamicStyles.centerContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading listing details...</Text>
        </View>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container statusBarStyle={isDark ? 'light' : 'dark'}>
        <Header title="Listing Not Found" onBack={() => navigation.goBack()} />
        <View style={[styles.centerContainer, dynamicStyles.centerContainer]}>
          <Ionicons name="alert-circle-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
          <Text style={[styles.notFoundTitle, dynamicStyles.notFoundTitle]}>Listing Not Found</Text>
          <Text style={[styles.notFoundSub, dynamicStyles.notFoundSub]}>
            This listing is no longer available or has been removed by its host.
          </Text>
          <Button
            title="Browse All Listings"
            variant="gradient"
            size="medium"
            onPress={() => navigation.navigate('Listings')}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </Container>
    );
  }

  const rentNumber = listing.rent || listing.monthly_rent || 0;
  const depositNumber = listing.deposit || listing.security_deposit || 0;

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title="Room Details"
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            onPress={handleToggleSave}
            style={styles.headerSaveBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? colors.primary : colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* OWNER ACTIONS BANNER - STRICTLY OWNER ONLY */}
        {isOwner && (
          <View style={[styles.ownerBanner, dynamicStyles.ownerBanner, shadows.small]}>
            <View style={styles.ownerHeaderRow}>
              <View style={styles.ownerTitleWrapper}>
                <Ionicons name="key" size={17} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.ownerTitle, dynamicStyles.ownerTitle]}>Your Listing (Owner)</Text>
              </View>
              <View style={[styles.statusPill, dynamicStyles.statusPill]}>
                <Text style={[styles.statusPillText, dynamicStyles.statusPillText]}>Status: {listing.status || 'Active'}</Text>
              </View>
            </View>
            <Text style={[styles.ownerSub, dynamicStyles.ownerSub]}>You have owner permissions to modify or remove this room listing.</Text>

            <View style={styles.ownerActionsRow}>
              <TouchableOpacity
                style={[styles.ownerEditBtn, dynamicStyles.ownerEditBtn]}
                onPress={() => {
                  populateEditForm(listing);
                  setEditModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={16} color={colors.textWhite} style={{ marginRight: 4 }} />
                <Text style={[styles.ownerEditBtnText, dynamicStyles.ownerEditBtnText]}>Edit Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ownerDeleteBtn, dynamicStyles.ownerDeleteBtn]}
                onPress={handleDeleteListing}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} style={{ marginRight: 4 }} />
                <Text style={[styles.ownerDeleteBtnText, dynamicStyles.ownerDeleteBtnText]}>Delete Listing</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* IMAGE GALLERY HERO */}
        <View style={[styles.galleryWrapper, dynamicStyles.galleryWrapper]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / (width - SPACING.md * 2));
              setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {photos.map((photoUri, index) => (
              <Image key={index} source={{ uri: photoUri }} style={styles.galleryImg} />
            ))}
          </ScrollView>

          {/* Photo Counter Badge */}
          {photos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={12} color={colors.textWhite} style={{ marginRight: 4 }} />
              <Text style={styles.photoCountText}>
                {activeImageIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          {/* Carousel Dot Indicators */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeImageIndex === idx && [styles.activeDot, { backgroundColor: colors.primary }],
                  ]}
                />
              ))}
            </View>
          )}

          {/* In-Image Tag */}
          <View style={styles.imageTopBadge}>
            <Text style={styles.imageTopBadgeText}>
              {listing.roomType || listing.propertyType || 'Room'}
            </Text>
          </View>
        </View>

        {/* TITLE & RENT MAIN CARD */}
        <View style={[styles.mainCard, dynamicStyles.mainCard, shadows.small]}>
          <View style={styles.rentRow}>
            <View>
              <Text style={[styles.rentLabel, dynamicStyles.rentLabel]}>Monthly Rent</Text>
              <Text style={[styles.rentText, dynamicStyles.rentText]}>
                ₹{rentNumber.toLocaleString('en-IN')}
                <Text style={[styles.rentPeriod, dynamicStyles.rentPeriod]}> / month</Text>
              </Text>
            </View>

            <View style={[styles.genderBadge, dynamicStyles.genderBadge]}>
              <Ionicons name="people" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.genderBadgeText, dynamicStyles.genderBadgeText]}>
                {listing.genderPreference || listing.gender_preference || 'Any Gender'}
              </Text>
            </View>
          </View>

          <Text style={[styles.listingTitle, dynamicStyles.listingTitle]}>{listing.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.locationText, dynamicStyles.locationText]}>
              {listing.location || listing.address || listing.city}, {listing.city}
            </Text>
          </View>

          {/* Location Safety Notice */}
          <View style={[styles.safetyNotice, dynamicStyles.safetyNotice]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.safetyNoticeText, dynamicStyles.safetyNoticeText]}>
              Approximate neighborhood shown for student privacy. Exact address is shared once your request is accepted.
            </Text>
          </View>

          <View style={[styles.divider, dynamicStyles.divider]} />

          {/* Key Specs Grid */}
          <View style={styles.specsGrid}>
            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Security Deposit</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>
                {depositNumber > 0 ? `₹${depositNumber.toLocaleString('en-IN')}` : 'No Deposit'}
              </Text>
            </View>

            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Available From</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{listing.availableFrom || 'Immediate'}</Text>
            </View>

            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Room Type</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>
                {listing.roomType || listing.propertyType || listing.property_type || 'Private Room'}
              </Text>
            </View>

            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Flat Layout</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{listing.flatType || '2 BHK'}</Text>
            </View>

            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Furnishing</Text>
              <Text style={[styles.specValue, dynamicStyles.specValue]}>{listing.furnishing || listing.furnished || 'Unfurnished'}</Text>
            </View>

            <View style={[styles.specItem, dynamicStyles.specItem]}>
              <Text style={[styles.specLabel, dynamicStyles.specLabel]}>Listing Status</Text>
              <Text style={[styles.specValue, { color: colors.verified }]}>
                {listing.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* VERIFICATION HIGHLIGHT SECTION */}
        {listing.isVerified && (
          <View style={[styles.verifiedCard, dynamicStyles.verifiedCard, shadows.small]}>
            <View style={styles.verifiedHeaderRow}>
              <View style={[styles.verifiedIconCircle, dynamicStyles.verifiedIconCircle]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                <Text style={[styles.verifiedTitle, dynamicStyles.verifiedTitle]}>Verified Student Housing</Text>
                <Text style={[styles.verifiedSubtitle, dynamicStyles.verifiedSubtitle]}>
                  This listing and host credentials have been verified by VFA moderation.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* PROPERTY DESCRIPTION */}
        <SectionCard
          icon="document-text-outline"
          title="Property Description"
          subtitle="Overview & Flat Details"
        >
          <Text style={[styles.descriptionText, dynamicStyles.descriptionText]}>
            {listing.description || 'Clean, comfortable student accommodation in a safe residential area with easy transit to campus.'}
          </Text>
        </SectionCard>

        {/* AMENITIES */}
        {listing.amenities && listing.amenities.length > 0 && (
          <SectionCard
            icon="sparkles-outline"
            title="Included Amenities"
            subtitle="Facilities & Services"
          >
            <View style={styles.amenitiesWrap}>
              {listing.amenities.map((item, idx) => (
                <View key={idx} style={[styles.amenityChip, dynamicStyles.amenityChip]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginRight: 5 }} />
                  <Text style={[styles.amenityChipText, dynamicStyles.amenityChipText]}>{item}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* HOST / OWNER INFORMATION */}
        <SectionCard
          icon="person-outline"
          title="Listing Host"
          subtitle="Flatmate & Room Owner"
        >
          <View style={styles.hostProfileRow}>
            <View style={[styles.hostAvatar, dynamicStyles.hostAvatar]}>
              <Text style={[styles.hostAvatarText, dynamicStyles.hostAvatarText]}>
                {(listing.owner_name || listing.ownerName || 'H').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.hostInfo}>
              <Text style={[styles.hostName, dynamicStyles.hostName]}>
                {listing.owner_name || listing.ownerName || 'Verified Student Host'}
              </Text>
              <Text style={[styles.hostSub, dynamicStyles.hostSub]}>
                📍 {listing.city || 'Indore'} • {listing.college || 'Verified Member'}
              </Text>
              <View style={{ marginTop: 4 }}>
                <VerifiedBadge label="Verified Host" size="small" />
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsBox}>
          {isOwner ? (
            <View style={styles.ownerBottomActions}>
              <Button
                title="Edit Listing Details"
                variant="gradient"
                size="large"
                onPress={() => {
                  populateEditForm(listing);
                  setEditModalVisible(true);
                }}
                icon={<Ionicons name="create" size={18} color={colors.textWhite} />}
                style={{ marginBottom: SPACING.sm }}
              />

              <Button
                title="Delete Listing"
                variant="outline"
                size="large"
                onPress={handleDeleteListing}
                icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
              />
            </View>
          ) : (
            <>
              <Button
                title="Contact Host 💬"
                variant="gradient"
                size="large"
                onPress={handleContactOwner}
                icon={<Ionicons name="chatbubbles" size={18} color={colors.textWhite} />}
                style={{ marginBottom: SPACING.sm }}
              />

              <Button
                title={isRequested ? 'Room Request Sent ✔' : 'Request Room'}
                variant={isRequested ? 'outline' : 'secondary'}
                size="large"
                onPress={handleRequestRoom}
                disabled={isRequested}
                icon={<Ionicons name={isRequested ? 'checkmark-circle' : 'home'} size={18} color={colors.primary} />}
                style={{ marginBottom: SPACING.md }}
              />

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, dynamicStyles.secondaryBtn]}
                  onPress={handleToggleSave}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.secondaryBtnText, dynamicStyles.secondaryBtnText]}>
                    {isSaved ? 'Saved' : 'Save Room'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.reportBtn, dynamicStyles.reportBtn]}
                  onPress={handleReportListing}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flag-outline" size={18} color={colors.error} />
                  <Text style={[styles.secondaryBtnText, { color: colors.error }]}>Report</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* EDIT LISTING MODAL (For Owner) */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, dynamicStyles.editModalContent, shadows.large]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Edit Listing Details</Text>
                <Text style={[styles.modalSubtitle, dynamicStyles.modalSubtitle]}>Make changes to your room listing</Text>
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
                title={isUpdating ? "Saving Changes..." : "Save Changes"}
                variant="gradient"
                size="large"
                onPress={handleUpdateListing}
                loading={isUpdating}
                disabled={isUpdating}
                style={{ marginTop: SPACING.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
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
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notFoundSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerSaveBtn: {
    padding: SPACING.xs,
  },
  content: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  ownerBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  ownerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ownerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ownerEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  ownerEditBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  ownerDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  ownerDeleteBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  galleryWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  galleryImg: {
    width: width - SPACING.md * 2,
    height: 240,
    resizeMode: 'cover',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  photoCountText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
  imageTopBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  imageTopBadgeText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  rentText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  rentPeriod: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  genderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: SPACING.xs + 4,
    borderRadius: RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  safetyNoticeText: {
    fontSize: 11,
    color: COLORS.accent,
    flex: 1,
    lineHeight: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specItem: {
    width: '48%',
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.verified,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.verifiedLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hostProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  hostAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hostSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  actionsBox: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  ownerBottomActions: {
    gap: SPACING.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 5,
  },
  reportBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: COLORS.errorLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '88%',
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
    marginTop: SPACING.xs + 2,
    marginBottom: 4,
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
});
