import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../constants/theme';

export const AdminListingsScreen = ({ navigation }) => {
  const { adminListings, approveListing, rejectListing, removeListing, fetchAdminData } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleApprove = (item) => {
    approveListing(item.id);
    Alert.alert('Listing Approved', `"${item.title}" is now published.`);
  };

  const handleReject = (item) => {
    rejectListing(item.id);
    Alert.alert('Listing Rejected', `"${item.title}" has been rejected.`);
  };

  const handleRemove = (item) => {
    Alert.alert(
      'Remove Listing',
      `Are you sure you want to permanently remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeListing(item.id),
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isApproved = item.status === 'Approved';
    const isRejected = item.status === 'Rejected';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: SPACING.xs }}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.ownerText, { color: colors.textSecondary }]}>Owner: {item.ownerName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isApproved
                  ? (isDark ? 'rgba(6, 78, 59, 0.4)' : '#ECFDF5')
                  : isRejected
                  ? (isDark ? 'rgba(127, 29, 29, 0.4)' : colors.errorLight)
                  : (isDark ? 'rgba(120, 53, 15, 0.4)' : '#FFFBEB'),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: isApproved
                    ? colors.success
                    : isRejected
                    ? colors.error
                    : colors.warning,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.detailsRow, { borderColor: colors.border }]}>
          <Text style={[styles.areaText, { color: colors.textSecondary }]}>📍 {item.area}</Text>
          <Text style={[styles.rentText, { color: colors.primary }]}>{item.rent}</Text>
        </View>

        <View style={styles.actionRow}>
          {!isApproved && (
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleApprove(item)}
            >
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          )}

          {!isRejected && (
            <TouchableOpacity
              style={[styles.rejectBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => handleReject(item)}
            >
              <Text style={[styles.rejectBtnText, { color: colors.textSecondary }]}>Reject</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.removeBtn, { backgroundColor: isDark ? 'rgba(127,29,29,0.3)' : colors.errorLight }]}
            onPress={() => handleRemove(item)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Housing Listings</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={adminListings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Listings</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No listings are currently available in the database.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  ownerText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: SPACING.xs,
  },
  areaText: {
    fontSize: 13,
  },
  rentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
  },
});
