import api, { handleApiError } from './api';
import { getListingCoverImage } from '../utils/imageUtils';

/**
 * Normalizes backend listing object fields to be fully compatible with frontend UI models.
 */
export const normalizeListing = (raw) => {
  if (!raw) return null;

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

  const imgUrl = getListingCoverImage(raw);

  return {
    ...raw,
    id: raw.id ? String(raw.id) : null,
    ownerId: raw.owner_id ? String(raw.owner_id) : (raw.ownerId ? String(raw.ownerId) : null),
    owner_id: raw.owner_id ? Number(raw.owner_id) : null,
    title: raw.title || 'Student Room Listing',
    description: raw.description || 'Clean and comfortable student room listing.',
    city: raw.city || 'Indore',
    location: raw.address || raw.location || raw.city || 'Campus Area',
    address: raw.address || '',
    rent: rentVal,
    monthly_rent: rentVal,
    deposit: depositVal,
    security_deposit: depositVal,
    availableFrom: raw.available_from ? String(raw.available_from).split('T')[0] : (raw.availableFrom || 'Immediate'),
    available_from: raw.available_from || null,
    propertyType: rawPropertyType,
    property_type: rawPropertyType,
    roomType: propertyTypeFormatted,
    flatType: propertyTypeFormatted === 'Flat' ? '2 BHK' : propertyTypeFormatted,
    genderPreference: genderPrefFormatted,
    gender_preference: rawGender,
    furnishing: furnishedFormatted,
    furnished: rawFurnished,
    image: imgUrl,
    image_url: raw.image_url || '',
    photos: raw.photos || [imgUrl],
    status: raw.status || 'active',
    isVerified: raw.is_verified !== undefined ? !!raw.is_verified : true,
    createdAt: raw.created_at || new Date().toISOString(),
  };
};

export const listingService = {
  /**
   * Fetch all listings with query filter support
   * GET /api/listings
   */
  async getListings(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (filters.city && filters.city.trim() && filters.city !== 'All') {
        queryParams.append('city', filters.city.trim());
      }
      if (filters.property_type && filters.property_type.trim() && filters.property_type !== 'All') {
        queryParams.append('property_type', filters.property_type.trim().toLowerCase());
      }
      if (filters.gender_preference && filters.gender_preference.trim() && filters.gender_preference !== 'All') {
        let genderVal = filters.gender_preference.trim().toLowerCase();
        if (genderVal.includes('girl')) genderVal = 'female';
        else if (genderVal.includes('boy')) genderVal = 'male';
        else if (genderVal.includes('any')) genderVal = 'any';
        queryParams.append('gender_preference', genderVal);
      }
      if (filters.furnished && filters.furnished.trim() && filters.furnished !== 'All') {
        let furnVal = filters.furnished.trim().toLowerCase();
        if (furnVal.includes('semi')) furnVal = 'semi';
        else if (furnVal.includes('un')) furnVal = 'unfurnished';
        else if (furnVal.includes('furnish')) furnVal = 'fully';
        queryParams.append('furnished', furnVal);
      }
      if (filters.min_rent !== undefined && filters.min_rent !== null && filters.min_rent !== '') {
        const min = Number(filters.min_rent);
        if (!isNaN(min)) queryParams.append('min_rent', String(min));
      }
      if (filters.max_rent !== undefined && filters.max_rent !== null && filters.max_rent !== '') {
        const max = Number(filters.max_rent);
        if (!isNaN(max)) queryParams.append('max_rent', String(max));
      }
      if (filters.status && filters.status.trim()) {
        queryParams.append('status', filters.status.trim().toLowerCase());
      }

      const queryString = queryParams.toString();
      const endpoint = `/listings${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(endpoint);
      const rawListings = response.data?.listings || [];
      const listings = rawListings.map(normalizeListing);

      return {
        success: true,
        listings,
        count: listings.length,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        listings: [],
        count: 0,
      };
    }
  },

  /**
   * Fetch single listing by ID
   * GET /api/listings/:id
   */
  async getListingById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid listing ID. Must be a positive integer.',
        listing: null,
      };
    }

    try {
      const response = await api.get(`/listings/${parsedId}`);
      const listing = normalizeListing(response.data?.listing);
      return {
        success: true,
        listing,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          notFound: true,
          error: 'Listing not found or has been removed.',
          listing: null,
        };
      }
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        listing: null,
      };
    }
  },

  /**
   * Create a new listing
   * POST /api/listings
   */
  async createListing(data) {
    try {
      if (!data.title || !data.title.trim()) {
        throw new Error('Listing title is required.');
      }
      if (data.title.trim().length > 150) {
        throw new Error('Title cannot exceed 150 characters.');
      }
      if (!data.city || !data.city.trim()) {
        throw new Error('City is required.');
      }

      let propType = (data.property_type || data.propertyType || data.roomType || 'flat').toLowerCase();
      if (!['flat', 'room', 'hostel'].includes(propType)) {
        propType = 'flat';
      }

      let genderPref = (data.gender_preference || data.genderPreference || 'any').toLowerCase();
      if (genderPref.includes('girl') || genderPref.includes('female')) genderPref = 'female';
      else if (genderPref.includes('boy') || genderPref.includes('male')) genderPref = 'male';
      else genderPref = 'any';

      let furnishedStatus = (data.furnished || data.furnishing || 'unfurnished').toLowerCase();
      if (furnishedStatus.includes('semi')) furnishedStatus = 'semi';
      else if (furnishedStatus.includes('un')) furnishedStatus = 'unfurnished';
      else if (furnishedStatus.includes('furnish')) furnishedStatus = 'fully';

      const payload = {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : '',
        property_type: propType,
        city: data.city.trim(),
        address: data.address || data.location || '',
        monthly_rent: data.monthly_rent !== undefined ? Number(data.monthly_rent) : (data.rent ? Number(data.rent) : 0),
        security_deposit: data.security_deposit !== undefined ? Number(data.security_deposit) : (data.deposit ? Number(data.deposit) : 0),
        available_from: data.available_from || data.availableFrom || null,
        gender_preference: genderPref,
        furnished: furnishedStatus,
        image_url: data.image_url || data.image || '',
        status: data.status || 'active',
      };

      const response = await api.post('/listings', payload);
      const listing = normalizeListing(response.data?.listing);

      return {
        success: true,
        message: response.data?.message || 'Listing created successfully',
        listing,
      };
    } catch (error) {
      const errorMessage = error.response ? handleApiError(error) : error.message;
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Update an existing listing (Owner only)
   * PUT /api/listings/:id
   */
  async updateListing(id, data) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid listing ID.',
      };
    }

    try {
      let propType = data.property_type || data.propertyType || data.roomType;
      if (propType) {
        propType = propType.toLowerCase();
        if (!['flat', 'room', 'hostel'].includes(propType)) propType = undefined;
      }

      let genderPref = data.gender_preference || data.genderPreference;
      if (genderPref) {
        genderPref = genderPref.toLowerCase();
        if (genderPref.includes('girl')) genderPref = 'female';
        else if (genderPref.includes('boy')) genderPref = 'male';
        else if (genderPref.includes('any')) genderPref = 'any';
      }

      let furnishedStatus = data.furnished || data.furnishing;
      if (furnishedStatus) {
        furnishedStatus = furnishedStatus.toLowerCase();
        if (furnishedStatus.includes('semi')) furnishedStatus = 'semi';
        else if (furnishedStatus.includes('un')) furnishedStatus = 'unfurnished';
        else if (furnishedStatus.includes('furnish')) furnishedStatus = 'fully';
      }

      const payload = {
        title: data.title ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        property_type: propType,
        city: data.city ? data.city.trim() : undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
        monthly_rent: data.monthly_rent !== undefined ? Number(data.monthly_rent) : (data.rent !== undefined ? Number(data.rent) : undefined),
        security_deposit: data.security_deposit !== undefined ? Number(data.security_deposit) : (data.deposit !== undefined ? Number(data.deposit) : undefined),
        available_from: data.available_from || data.availableFrom || undefined,
        gender_preference: genderPref,
        furnished: furnishedStatus,
        image_url: data.image_url !== undefined ? data.image_url : (data.image !== undefined ? data.image : undefined),
        status: data.status || undefined,
      };

      const response = await api.put(`/listings/${parsedId}`, payload);
      const listing = normalizeListing(response.data?.listing);

      return {
        success: true,
        message: response.data?.message || 'Listing updated successfully',
        listing,
      };
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return {
          success: false,
          forbidden: true,
          error: 'You are not authorized to modify this listing.',
        };
      }
      const errorMessage = error.response ? handleApiError(error) : error.message;
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Delete a listing (Owner only)
   * DELETE /api/listings/:id
   */
  async deleteListing(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid listing ID.',
      };
    }

    try {
      const response = await api.delete(`/listings/${parsedId}`);
      return {
        success: true,
        message: response.data?.message || 'Listing deleted successfully',
      };
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return {
          success: false,
          forbidden: true,
          error: 'You are not authorized to delete this listing.',
        };
      }
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
