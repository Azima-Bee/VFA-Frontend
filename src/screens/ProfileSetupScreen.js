import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { SectionCard } from '../components/SectionCard';
import { SelectOptionGroup } from '../components/SelectOptionGroup';
import { PhotoPicker } from '../components/PhotoPicker';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { validateRequiredText } from '../utils/validation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const ROOM_TYPES = [
  { label: 'Private Room', value: 'Private', icon: 'home-outline' },
  { label: 'Shared Room', value: 'Shared', icon: 'people-outline' },
];

const FLAT_TYPES = [
  { label: '1 BHK', value: '1 BHK' },
  { label: '2 BHK', value: '2 BHK' },
  { label: '3 BHK', value: '3 BHK' },
  { label: 'Hostel', value: 'Hostel' },
];

const MOVE_IN_OPTIONS = ['Immediate', '1st Oct 2026', '15th Oct 2026', '1st Nov 2026'];
const BUDGET_OPTIONS = ['₹5,000 - ₹8,000', '₹8,000 - ₹10,000', '₹10,000 - ₹15,000', '₹15,000 - ₹20,000', '₹20,000+'];

export const ProfileSetupScreen = ({ navigation }) => {
  const { user, profile, updateProfile, isLoading, error, setError } = useAuth();
  const { colors, isDark } = useTheme();

  // Basic Student Info
  const [photo, setPhoto] = useState(
    profile?.photo || user?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const [fullName, setFullName] = useState(user?.fullName || profile?.fullName || '');
  const [university, setUniversity] = useState(profile?.college_name || user?.university || '');
  const [course, setCourse] = useState(profile?.course || user?.course || '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study || user?.yearOfStudy || '');
  const [city, setCity] = useState(profile?.city || user?.city || '');
  const [aboutMe, setAboutMe] = useState(
    profile?.bio || user?.aboutMe || ''
  );


  // Housing Preferences
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthlyBudget || '₹8,000 - ₹10,000');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || 'Near Campus');
  const [moveInDate, setMoveInDate] = useState(user?.moveInDate || 'Immediate');
  const [roomType, setRoomType] = useState(user?.roomType || 'Private');
  const [flatType, setFlatType] = useState(user?.flatType || '2 BHK');

  // Lifestyle Preferences
  const [food, setFood] = useState(user?.food || 'Both');
  const [smoking, setSmoking] = useState(user?.smoking || 'No');
  const [drinking, setDrinking] = useState(user?.drinking || 'No');
  const [pets, setPets] = useState(user?.pets || 'No');
  const [cleanliness, setCleanliness] = useState(user?.cleanliness || 'High');
  const [sleepSchedule, setSleepSchedule] = useState(user?.sleepSchedule || 'Normal');
  const [studyEnvironment, setStudyEnvironment] = useState(user?.studyEnvironment || 'Quiet');
  const [guests, setGuests] = useState(user?.guests || 'Sometimes');

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSaveProfile = async () => {
    // Reset messages
    if (error) setError(null);
    setSuccessMessage(null);

    // Validate required fields
    const photoErr = validateRequiredText(photo, 'Profile photo');
    const nameErr = validateRequiredText(fullName, 'Full Name');
    const uniErr = validateRequiredText(university, 'College/University');
    const courseErr = validateRequiredText(course, 'Course');
    const yearErr = validateRequiredText(yearOfStudy, 'Year of Study');
    const cityErr = validateRequiredText(city, 'City');
    const aboutErr = validateRequiredText(aboutMe, 'About Me');

    const budgetErr = validateRequiredText(monthlyBudget, 'Monthly Budget');
    const locErr = validateRequiredText(preferredLocation, 'Preferred Location');
    const moveInErr = validateRequiredText(moveInDate, 'Move-in Date');
    const roomErr = validateRequiredText(roomType, 'Room Type');
    const flatErr = validateRequiredText(flatType, 'Flat Type');

    const foodErr = validateRequiredText(food, 'Food preference');
    const smokingErr = validateRequiredText(smoking, 'Smoking preference');
    const drinkingErr = validateRequiredText(drinking, 'Drinking preference');
    const petsErr = validateRequiredText(pets, 'Pets preference');
    const cleanlinessErr = validateRequiredText(cleanliness, 'Cleanliness rating');
    const sleepErr = validateRequiredText(sleepSchedule, 'Sleep schedule');
    const studyErr = validateRequiredText(studyEnvironment, 'Study environment');
    const guestsErr = validateRequiredText(guests, 'Guests preference');

    if (
      photoErr ||
      nameErr ||
      uniErr ||
      courseErr ||
      yearErr ||
      cityErr ||
      aboutErr ||
      budgetErr ||
      locErr ||
      moveInErr ||
      roomErr ||
      flatErr ||
      foodErr ||
      smokingErr ||
      drinkingErr ||
      petsErr ||
      cleanlinessErr ||
      sleepErr ||
      studyErr ||
      guestsErr
    ) {
      setErrors({
        photo: photoErr,
        fullName: nameErr,
        university: uniErr,
        course: courseErr,
        yearOfStudy: yearErr,
        city: cityErr,
        aboutMe: aboutErr,
        monthlyBudget: budgetErr,
        preferredLocation: locErr,
        moveInDate: moveInErr,
        roomType: roomErr,
        flatType: flatErr,
        food: foodErr,
        smoking: smokingErr,
        drinking: drinkingErr,
        pets: petsErr,
        cleanliness: cleanlinessErr,
        sleepSchedule: sleepErr,
        studyEnvironment: studyErr,
        guests: guestsErr,
      });
      return;
    }

    setErrors({});

    const profileData = {
      photo,
      fullName,
      university,
      course,
      yearOfStudy,
      city,
      aboutMe,
      monthlyBudget,
      preferredLocation,
      moveInDate,
      roomType,
      flatType,
      food,
      smoking,
      drinking,
      pets,
      cleanliness,
      sleepSchedule,
      studyEnvironment,
      guests,
    };

    const result = await updateProfile(profileData);

    if (result.success) {
      setSuccessMessage('Profile saved successfully!');
      Alert.alert(
        'Profile Saved! ✨',
        'Your student flatmate profile has been updated.',
        [
          {
            text: 'View Home Dashboard',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
      navigation.navigate('Home');
    }
  };

  return (
    <Container scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      <Header
        title="Student Profile Setup"
        onBack={() => navigation.navigate('Home')}
      />

      <View style={styles.content}>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <VerifiedBadge label="FlatMate Profile" style={{ marginBottom: SPACING.xs }} />
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Set Up Your Profile</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            Complete your profile to find compatible student flatmates who match your lifestyle.
          </Text>
        </View>

        {/* Global Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Success Banner */}
        {successMessage && (
          <View style={[styles.successBanner, { backgroundColor: colors.verifiedLight }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.verified} />
            <Text style={[styles.successBannerText, { color: colors.verified }]}>{successMessage}</Text>
          </View>
        )}

        {/* SECTION 1: Basic Student Information */}
        <SectionCard
          icon="person-outline"
          title="Basic Student Details"
          subtitle="Your academic profile & personal info"
        >
          {/* Photo Picker */}
          <PhotoPicker
            selectedPhoto={photo}
            onSelectPhoto={(url) => {
              setPhoto(url);
              if (errors.photo) setErrors({ ...errors, photo: null });
            }}
            error={errors.photo}
          />

          <Input
            label="Full Name *"
            placeholder="e.g. Alex Morgan"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              if (errors.fullName) setErrors({ ...errors, fullName: null });
            }}
            leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.fullName}
          />

          <Input
            label="College / University *"
            placeholder="e.g. IIT Delhi, VIT Vellore"
            value={university}
            onChangeText={(t) => {
              setUniversity(t);
              if (errors.university) setErrors({ ...errors, university: null });
            }}
            leftIcon={<Ionicons name="school-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.university}
          />

          <Input
            label="Course / Major *"
            placeholder="e.g. Computer Science"
            value={course}
            onChangeText={(t) => {
              setCourse(t);
              if (errors.course) setErrors({ ...errors, course: null });
            }}
            leftIcon={<Ionicons name="book-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.course}
          />

          <Input
            label="Year of Study *"
            placeholder="e.g. 2nd Year, 3rd Year"
            value={yearOfStudy}
            onChangeText={(t) => {
              setYearOfStudy(t);
              if (errors.yearOfStudy) setErrors({ ...errors, yearOfStudy: null });
            }}
            leftIcon={<Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.yearOfStudy}
          />

          <Input
            label="City / Region *"
            placeholder="e.g. Mumbai, Pune, Bangalore"
            value={city}
            onChangeText={(t) => {
              setCity(t);
              if (errors.city) setErrors({ ...errors, city: null });
            }}
            leftIcon={<Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.city}
          />

          <Input
            label="About Me *"
            placeholder="Share a short bio about yourself, your hobbies, or flatmate preferences..."
            value={aboutMe}
            onChangeText={(t) => {
              setAboutMe(t);
              if (errors.aboutMe) setErrors({ ...errors, aboutMe: null });
            }}
            style={{ marginBottom: 0 }}
            inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
            leftIcon={<Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.aboutMe}
          />
        </SectionCard>

        {/* SECTION 2: Housing Preferences */}
        <SectionCard
          icon="home-outline"
          title="Housing Preferences"
          subtitle="Your room type, budget, & target area"
        >
          <Input
            label="Monthly Budget (₹) *"
            placeholder="e.g. ₹10,000 / month"
            value={monthlyBudget}
            onChangeText={(t) => {
              setMonthlyBudget(t);
              if (errors.monthlyBudget) setErrors({ ...errors, monthlyBudget: null });
            }}
            leftIcon={<Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.monthlyBudget}
          />

          {/* Quick Select Budget Chips */}
          <View style={styles.chipRow}>
            {BUDGET_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.chip,
                  monthlyBudget === b && styles.chipActive,
                ]}
                onPress={() => {
                  setMonthlyBudget(b);
                  if (errors.monthlyBudget) setErrors({ ...errors, monthlyBudget: null });
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    monthlyBudget === b && styles.chipTextActive,
                  ]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Preferred Location *"
            placeholder="e.g. Near College / Koramangala, HSR Layout"
            value={preferredLocation}
            onChangeText={(t) => {
              setPreferredLocation(t);
              if (errors.preferredLocation) setErrors({ ...errors, preferredLocation: null });
            }}
            leftIcon={<Ionicons name="map-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.preferredLocation}
          />

          <Input
            label="Move-in Date *"
            placeholder="e.g. Immediate / 1st Oct 2026"
            value={moveInDate}
            onChangeText={(t) => {
              setMoveInDate(t);
              if (errors.moveInDate) setErrors({ ...errors, moveInDate: null });
            }}
            leftIcon={<Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />}
            error={errors.moveInDate}
          />

          {/* Quick Select Move In Date Chips */}
          <View style={styles.chipRow}>
            {MOVE_IN_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  moveInDate === d && styles.chipActive,
                ]}
                onPress={() => {
                  setMoveInDate(d);
                  if (errors.moveInDate) setErrors({ ...errors, moveInDate: null });
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    moveInDate === d && styles.chipTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Room Type Selector */}
          <SelectOptionGroup
            label="Room Type *"
            options={ROOM_TYPES}
            selectedValue={roomType}
            onSelect={(val) => {
              setRoomType(val);
              if (errors.roomType) setErrors({ ...errors, roomType: null });
            }}
            error={errors.roomType}
          />

          {/* Flat Type Selector */}
          <SelectOptionGroup
            label="Preferred Flat Type *"
            options={FLAT_TYPES}
            selectedValue={flatType}
            onSelect={(val) => {
              setFlatType(val);
              if (errors.flatType) setErrors({ ...errors, flatType: null });
            }}
            error={errors.flatType}
          />
        </SectionCard>

        {/* SECTION 3: Lifestyle Preferences */}
        <SectionCard
          icon="sparkles-outline"
          title="Lifestyle Preferences"
          subtitle="Habits, food, & flatmate compatibility"
        >
          {/* Food */}
          <SelectOptionGroup
            label="Food Preference *"
            options={['Vegetarian', 'Non-Vegetarian', 'Both']}
            selectedValue={food}
            onSelect={(val) => {
              setFood(val);
              if (errors.food) setErrors({ ...errors, food: null });
            }}
            error={errors.food}
          />

          {/* Smoking */}
          <SelectOptionGroup
            label="Smoking *"
            options={['Yes', 'No']}
            selectedValue={smoking}
            onSelect={(val) => {
              setSmoking(val);
              if (errors.smoking) setErrors({ ...errors, smoking: null });
            }}
            error={errors.smoking}
          />

          {/* Drinking */}
          <SelectOptionGroup
            label="Drinking *"
            options={['Yes', 'No']}
            selectedValue={drinking}
            onSelect={(val) => {
              setDrinking(val);
              if (errors.drinking) setErrors({ ...errors, drinking: null });
            }}
            error={errors.drinking}
          />

          {/* Pets */}
          <SelectOptionGroup
            label="Pets Allowed / Preferred *"
            options={['Yes', 'No']}
            selectedValue={pets}
            onSelect={(val) => {
              setPets(val);
              if (errors.pets) setErrors({ ...errors, pets: null });
            }}
            error={errors.pets}
          />

          {/* Cleanliness */}
          <SelectOptionGroup
            label="Cleanliness Rating *"
            options={['Low', 'Medium', 'High']}
            selectedValue={cleanliness}
            onSelect={(val) => {
              setCleanliness(val);
              if (errors.cleanliness) setErrors({ ...errors, cleanliness: null });
            }}
            error={errors.cleanliness}
          />

          {/* Sleep Schedule */}
          <SelectOptionGroup
            label="Sleep Schedule *"
            options={['Early', 'Normal', 'Late']}
            selectedValue={sleepSchedule}
            onSelect={(val) => {
              setSleepSchedule(val);
              if (errors.sleepSchedule) setErrors({ ...errors, sleepSchedule: null });
            }}
            error={errors.sleepSchedule}
          />

          {/* Study Environment */}
          <SelectOptionGroup
            label="Study Environment *"
            options={['Quiet', 'Flexible', 'Social']}
            selectedValue={studyEnvironment}
            onSelect={(val) => {
              setStudyEnvironment(val);
              if (errors.studyEnvironment) setErrors({ ...errors, studyEnvironment: null });
            }}
            error={errors.studyEnvironment}
          />

          {/* Guests */}
          <SelectOptionGroup
            label="Guests Frequency *"
            options={['Rarely', 'Sometimes', 'Often']}
            selectedValue={guests}
            onSelect={(val) => {
              setGuests(val);
              if (errors.guests) setErrors({ ...errors, guests: null });
            }}
            error={errors.guests}
          />
        </SectionCard>

        {/* Save Profile Button */}
        <Button
          title="Save Profile"
          variant="gradient"
          size="large"
          onPress={handleSaveProfile}
          loading={isLoading}
          disabled={isLoading}
          icon={<Ionicons name="checkmark-done" size={20} color={COLORS.textWhite} />}
          style={styles.saveBtn}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.md,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.h1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  subheading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successBannerText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});
