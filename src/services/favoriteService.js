import api, { handleApiError } from './api';

/**
 * Normalizes backend favorite listing record to frontend UI model
 */
export const normalizeFavorite = (raw) => {
  if (!raw) return null;
  const listingId = raw.listing_id !== undefined && raw.listing_id !== null
    ? String(raw.listing_id)
    : (raw.id ? String(raw.id) : null);

  const rentVal = raw.monthly_rent !== undefined && raw.monthly_rent !== null
    ? Number(raw.monthly_rent)
    : (raw.rent ? Number(raw.rent) : 0);

  const depositVal = raw.security_deposit !== undefined && raw.security_deposit !== null
    ? Number(raw.security_deposit)
    : (raw.deposit ? Number(raw.deposit) : 0);

  const rawPropertyType = raw.property_type || raw.roomType || 'flat';
  const propertyTypeFormatted = rawPropertyType.charAt(0).toUpperCase() + rawPropertyType.slice(1);

  const rawGender = raw.gender_preference || raw.genderPreference || 'any';
  const genderPrefFormatted = rawGender === 'female'
    ? 'Girls Only'
    : rawGender === 'male'
      ? 'Boys Only'
      : 'Any Gender';

  const rawFurnished = raw.furnished || raw.furnishing || 'unfurnished';
  const furnishedFormatted = rawFurnished === 'fully'
    ? 'Furnished'
    : rawFurnished === 'semi'
      ? 'Semi-Furnished'
      : 'Unfurnished';

  const imgUrl = raw.image_url || raw.image || (raw.photos && raw.photos.length > 0 ? raw.photos[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80');

  return {
    ...raw,
    id: listingId,
    listing_id: listingId ? Number(listingId) : null,
    listingId: listingId,
    favorite_id: raw.favorite_id ? String(raw.favorite_id) : null,
    owner_id: raw.owner_id ? Number(raw.owner_id) : null,
    ownerId: raw.owner_id ? String(raw.owner_id) : null,
    title: raw.title || 'Student Room Listing',
    description: raw.description || '',
    city: raw.city || 'Campus Area',
    location: raw.address || raw.city || 'Campus Area',
    address: raw.address || '',
    rent: rentVal,
    monthly_rent: rentVal,
    deposit: depositVal,
    security_deposit: depositVal,
    availableFrom: raw.available_from ? String(raw.available_from).split('T')[0] : (raw.availableFrom || 'Immediate'),
    propertyType: rawPropertyType,
    roomType: propertyTypeFormatted,
    flatType: propertyTypeFormatted === 'Flat' ? '2 BHK' : propertyTypeFormatted,
    genderPreference: genderPrefFormatted,
    furnishing: furnishedFormatted,
    image: imgUrl,
    image_url: raw.image_url || '',
    photos: raw.photos || [imgUrl],
    isVerified: raw.is_verified !== undefined ? !!raw.is_verified : true,
    createdAt: raw.created_at || raw.favorited_at || new Date().toISOString(),
  };
};

export const favoriteService = {
  /**
   * Fetch all favorites for the authenticated user
   * GET /api/favorites
   */
  async getFavorites() {
    try {
      const response = await api.get('/favorites');
      const rawFavorites = response.data?.favorites || [];
      const favorites = rawFavorites.map(normalizeFavorite).filter(Boolean);

      return {
        success: true,
        count: favorites.length,
        favorites,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        favorites: [],
        count: 0,
      };
    }
  },

  /**
   * Add a listing to favorites
   * POST /api/favorites/:listingId
   */
  async addFavorite(listingId) {
    const parsedId = parseInt(listingId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid listing ID. Must be a positive integer.',
      };
    }

    try {
      const response = await api.post(`/favorites/${parsedId}`);
      return {
        success: true,
        message: response.data?.message || 'Listing added to favorites',
        favorite: response.data?.favorite,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Remove a listing from favorites
   * DELETE /api/favorites/:listingId
   */
  async removeFavorite(listingId) {
    const parsedId = parseInt(listingId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid listing ID.',
      };
    }

    try {
      const response = await api.delete(`/favorites/${parsedId}`);
      return {
        success: true,
        message: response.data?.message || 'Listing removed from favorites',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
