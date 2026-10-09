import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';

export const DEFAULT_LISTING_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80';

export const STUDENT_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80', // Furnished Private Room with Desk
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80', // Modern Bright Bedroom
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80', // Shared Student Room / Twin Bed
  'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=800&auto=format&fit=crop&q=80', // Clean Studio Apartment Room
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80', // Cozy Room with Plant & Study Table
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80', // Bright Student Hostel/PG Room
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80', // Light Airy Flatmate Bedroom
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80', // Neat Student Dorm Bedroom
];

export const getListingCoverImage = (item) => {
  if (!item) return DEFAULT_LISTING_IMAGE;

  if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
    const validPhoto = item.photos.find(
      (p) => typeof p === 'string' && p.trim().length > 0 && !p.includes('placeholder')
    );
    if (validPhoto) return validPhoto.trim();
  }

  if (
    item.image_url &&
    typeof item.image_url === 'string' &&
    item.image_url.trim().length > 0 &&
    !item.image_url.includes('placeholder')
  ) {
    return item.image_url.trim();
  }

  if (
    item.image &&
    typeof item.image === 'string' &&
    item.image.trim().length > 0 &&
    !item.image.includes('placeholder')
  ) {
    return item.image.trim();
  }

  // Stable, deterministic image selection based on listing ID or title
  const idKey = item.id !== undefined && item.id !== null ? String(item.id) : (item.title || '0');
  let hash = 0;
  for (let i = 0; i < idKey.length; i++) {
    hash = (hash << 5) - hash + idKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % STUDENT_ROOM_IMAGES.length;
  return STUDENT_ROOM_IMAGES[index];
};

export const ListingCardImage = ({ sourceUri, style, defaultUri = DEFAULT_LISTING_IMAGE }) => {
  const [currentUri, setCurrentUri] = useState(sourceUri || defaultUri);

  useEffect(() => {
    setCurrentUri(sourceUri || defaultUri);
  }, [sourceUri, defaultUri]);

  return (
    <Image
      source={{ uri: currentUri }}
      style={style}
      onError={() => {
        if (currentUri !== defaultUri) {
          setCurrentUri(defaultUri);
        }
      }}
    />
  );
};
