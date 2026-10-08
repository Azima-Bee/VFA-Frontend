import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '../components/Container';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/Badge';
import { SelectOptionGroup } from '../components/SelectOptionGroup';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAuth } from '../hooks/useAuth';
import { MOCK_INDIAN_STUDENTS } from '../data/mockStudents';
import { calculateCompatibility } from '../utils/compatibility';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'bestMatch', icon: 'sparkles' },
  { label: 'Lowest Budget', value: 'lowestBudget', icon: 'cash-outline' },
  { label: 'Newest', value: 'newest', icon: 'time-outline' },
];

export const DiscoverScreen = ({ navigation }) => {
  const { user, isUserBlocked } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  const [studentsList, setStudentsList] = useState(MOCK_INDIAN_STUDENTS);
  const [passedStudentIds, setPassedStudentIds] = useState([]);
  const [connectedStudentIds, setConnectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState('bestMatch');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filters
  const [searchCity, setSearchCity] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('All');
  const [filterFood, setFilterFood] = useState('All');
  const [maxBudget, setMaxBudget] = useState('');

  // Handle Pass Profile
  const handlePass = (id) => {
    setPassedStudentIds((prev) => [...prev, id]);
  };

  // Handle Connect Profile
  const handleConnect = (student) => {
    if (connectedStudentIds.includes(student.id)) return;
    setConnectedStudentIds((prev) => [...prev, student.id]);
    Alert.alert(
      'Connection Request Sent 🤝',
      `Your request to connect with ${student.name} has been sent!`,
      [{ text: 'OK' }]
    );
  };

  // Reset Filters & Feeds
  const handleResetFeed = () => {
    setLoading(true);
    setTimeout(() => {
      setPassedStudentIds([]);
      setSearchCity('');
      setFilterRoomType('All');
      setFilterFood('All');
      setMaxBudget('');
      setSortBy('bestMatch');
      setLoading(false);
    }, 600);
  };

  // Compute processed flatmates list with compatibility, filtering, and sorting
  const processedStudents = useMemo(() => {
    // 1. Exclude passed and blocked students
    let list = studentsList.filter(
      (stu) => !passedStudentIds.includes(stu.id) && !isUserBlocked(stu.id)
    );

    // 2. Attach compatibility score
    list = list.map((stu) => {
      const compat = calculateCompatibility(user || {}, stu);
      return {
        ...stu,
        compat,
        isConnected: connectedStudentIds.includes(stu.id),
      };
    });

    // 3. Apply Filters
    if (searchCity.trim()) {
      const query = searchCity.trim().toLowerCase();
      list = list.filter(
        (stu) =>
          stu.city.toLowerCase().includes(query) ||
          stu.preferredLocation.toLowerCase().includes(query) ||
          stu.college.toLowerCase().includes(query)
      );
    }

    if (filterRoomType !== 'All') {
      list = list.filter((stu) => stu.roomType === filterRoomType);
    }

    if (filterFood !== 'All') {
      list = list.filter((stu) => stu.food === filterFood);
    }

    if (maxBudget && !isNaN(maxBudget)) {
      const limit = parseInt(maxBudget, 10);
      list = list.filter((stu) => (stu.budgetValue || 0) <= limit);
    }

    // 4. Apply Sorting
    if (sortBy === 'bestMatch') {
      list.sort((a, b) => b.compat.score - a.compat.score);
    } else if (sortBy === 'lowestBudget') {
      list.sort((a, b) => a.budgetValue - b.budgetValue);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [studentsList, passedStudentIds, connectedStudentIds, searchCity, filterRoomType, filterFood, maxBudget, sortBy, user]);

  const dynamicStyles = {
    screenWrapper: {
      backgroundColor: colors.background,
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
    studentName: {
      color: colors.textPrimary,
    },
    collegeText: {
      color: colors.primary,
    },
    courseText: {
      color: colors.textSecondary,
    },
    locText: {
      color: colors.textMuted,
    },
    explanationBox: {
      backgroundColor: colors.surfaceAlt,
    },
    specChip: {
      backgroundColor: colors.surfaceAlt,
    },
    specChipText: {
      color: colors.textPrimary,
    },
    passBtn: {
      backgroundColor: colors.errorLight,
      borderColor: isDark ? colors.border : 'rgba(239, 68, 68, 0.3)',
    },
    passBtnText: {
      color: colors.error,
    },
    viewProfileBtn: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    viewProfileBtnText: {
      color: colors.textPrimary,
    },
    connectBtn: {
      backgroundColor: colors.primary,
    },
    connectedBtn: {
      backgroundColor: colors.verified,
    },
    connectBtnText: {
      color: colors.textWhite,
    },
    modalContent: {
      backgroundColor: colors.surface,
    },
    modalTitle: {
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
          title="Find Flatmate"
          showBack={false}
          rightComponent={
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={styles.filterHeaderBtn}
            >
              <Ionicons name="options-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        {/* SEARCH & SORT TOOLBAR */}
        <View style={styles.toolbar}>
          <View style={[styles.searchBarWrapper, dynamicStyles.searchBarWrapper]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.searchInput, dynamicStyles.searchInput]}
              placeholder="Search by city, college, or location..."
              placeholderTextColor={colors.textMuted}
              value={searchCity}
              onChangeText={setSearchCity}
            />
            {searchCity ? (
              <TouchableOpacity onPress={() => setSearchCity('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
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
          <Text style={[styles.sortLabel, dynamicStyles.sortLabel]}>Sort by:</Text>
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
              >
                <Ionicons
                  name={opt.icon}
                  size={12}
                  color={isSelected ? colors.primary : colors.textSecondary}
                  style={{ marginRight: 3 }}
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
        </View>

        {/* MAIN FEED / LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Matching compatible student flatmates...</Text>
          </View>
        ) : processedStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={54} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Flatmates Found</Text>
            <Text style={[styles.emptySub, dynamicStyles.emptySub]}>
              You've viewed or filtered all available profiles in this feed. Reset filters to explore more student flatmates.
            </Text>
            <Button
              title="Reset Filters & Refresh Feed"
              variant="gradient"
              size="medium"
              onPress={handleResetFeed}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <FlatList
            data={processedStudents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const { compat } = item;

              return (
                <View style={[styles.card, dynamicStyles.card, shadows.medium]}>
                  {/* Photo & Compatibility Overlay */}
                  <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => navigation.navigate('StudentProfile', { student: item })}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: item.photo }} style={styles.cardImage} />

                    {/* Compatibility Match Badge */}
                    <View style={[styles.compatBadgePill, { backgroundColor: compat.levelColor }, shadows.small]}>
                      <Ionicons name="sparkles" size={12} color={colors.textWhite} style={{ marginRight: 3 }} />
                      <Text style={styles.compatBadgeText}>{compat.score}% Compatible</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.infoIconOverlay}
                      onPress={() => navigation.navigate('StudentProfile', { student: item })}
                    >
                      <Ionicons name="information-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Card Content */}
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.studentName, dynamicStyles.studentName]}>{item.name}</Text>
                      {item.isVerified && <VerifiedBadge size="small" />}
                    </View>

                    <Text style={[styles.collegeText, dynamicStyles.collegeText]} numberOfLines={2}>🎓 {item.college}</Text>
                    <Text style={[styles.courseText, dynamicStyles.courseText]} numberOfLines={2}>📚 {item.course} • {item.yearOfStudy}</Text>
                    <Text style={[styles.locText, dynamicStyles.locText]} numberOfLines={2}>📍 {item.preferredLocation || item.city}</Text>

                    {/* Explanation Sentence (Requirement 9) */}
                    <View style={[styles.explanationBox, dynamicStyles.explanationBox, { borderColor: `${compat.levelColor}40` }]}>
                      <Text style={[styles.explanationText, { color: compat.levelColor }]}>
                        💡 {compat.score}% Match: {compat.explanation}
                      </Text>
                    </View>

                    {/* Specs Chips Row */}
                    <View style={styles.specsRow}>
                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="cash-outline" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.monthlyBudget}</Text>
                      </View>

                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 3 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.moveInDate}</Text>
                      </View>

                      <View style={[styles.specChip, dynamicStyles.specChip]}>
                        <Ionicons name="home-outline" size={12} color={colors.verified} style={{ marginRight: 3 }} />
                        <Text style={[styles.specChipText, dynamicStyles.specChipText]}>{item.roomType} Room</Text>
                      </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.passBtn, dynamicStyles.passBtn]}
                        onPress={() => handlePass(item.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={18} color={colors.error} />
                        <Text style={[styles.passBtnText, dynamicStyles.passBtnText]}>Pass</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.viewProfileBtn, dynamicStyles.viewProfileBtn]}
                        onPress={() => navigation.navigate('StudentProfile', { student: item })}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.viewProfileBtnText, dynamicStyles.viewProfileBtnText]}>View Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.connectBtn,
                          dynamicStyles.connectBtn,
                          item.isConnected && [styles.connectedBtn, dynamicStyles.connectedBtn],
                        ]}
                        onPress={() => handleConnect(item)}
                        disabled={item.isConnected}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={item.isConnected ? 'checkmark-circle' : 'person-add'}
                          size={16}
                          color={colors.textWhite}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.connectBtnText, dynamicStyles.connectBtnText]}>
                          {item.isConnected ? 'Sent' : 'Connect'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </Container>

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
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Filter Flatmates</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Room Type */}
            <SelectOptionGroup
              label="Room Preference"
              options={['All', 'Private', 'Shared']}
              selectedValue={filterRoomType}
              onSelect={setFilterRoomType}
            />

            {/* Food Preference */}
            <SelectOptionGroup
              label="Food Preference"
              options={['All', 'Vegetarian', 'Non-Vegetarian', 'Both']}
              selectedValue={filterFood}
              onSelect={setFilterFood}
            />

            {/* Max Budget Filter */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={[styles.filterLabel, dynamicStyles.filterLabel]}>Max Monthly Budget (₹)</Text>
              <TextInput
                style={[styles.modalInput, dynamicStyles.modalInput]}
                placeholder="e.g. 12000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={maxBudget}
                onChangeText={setMaxBudget}
              />
            </View>

            <View style={styles.modalActionsRow}>
              <Button
                title="Clear All"
                variant="outline"
                onPress={() => {
                  setFilterRoomType('All');
                  setFilterFood('All');
                  setMaxBudget('');
                  setSearchCity('');
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
      <BottomNavBar activeTab="Discover" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  filterHeaderBtn: {
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
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  sortChipActive: {
  },
  sortChipText: {
    fontSize: 11,
  },
  sortChipTextActive: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  compatBadgePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  compatBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  infoIconOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardBody: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
    maxWidth: '65%',
  },
  collegeText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  courseText: {
    fontSize: 12,
    marginBottom: 2,
  },
  locText: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  explanationBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  explanationText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  passBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  viewProfileBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  connectedBtn: {
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    fontSize: 14,
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
