import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, useWindowDimensions, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, Check } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { fetchDoctors, setActiveSpecialty, setSelectedDoctor } from '../store/consultationSlice';
import {
  selectDoctors,
  selectActiveSpecialty,
  selectIsConsultationLoading
} from '../selectors/consultationSelectors';
import { DoctorCard } from '../components/DoctorCard';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { SearchBar } from '../../../shared/components/ui/SearchBar';
import { Chip } from '../../../shared/components/ui/Chip';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { BottomSheet } from '../../../shared/components/ui/BottomSheet';
import { Button } from '../../../shared/components/ui/Button';
import { ROUTES } from '../../../app/constants/routes';
import { Doctor } from '../types/consultationTypes';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

const SPECIALTIES = ['All', 'Vata', 'Pitta', 'Kapha', 'General Ayurveda', 'Panchakarma'];

export const DoctorListingScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // Selectors
  const allDoctors = useAppSelector(selectDoctors);
  const activeSpecialty = useAppSelector(selectActiveSpecialty);
  const isLoading = useAppSelector(selectIsConsultationLoading);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // Advanced Filters
  const [gender, setGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(0);
  const [language, setLanguage] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [availableToday, setAvailableToday] = useState<boolean>(false);
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);

  // Sort State
  const [sortBy, setSortBy] = useState<'RATING_DESC' | 'PRICE_ASC' | 'EXPERIENCE_DESC' | 'REVIEWS_DESC' | 'ALPHA_ASC'>('RATING_DESC');

  // Temporary local states for filter bottom sheet
  const [tempGender, setTempGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [tempMinExperience, setTempMinExperience] = useState<number>(0);
  const [tempMinRating, setTempMinRating] = useState<number>(0);
  const [tempMaxFee, setTempMaxFee] = useState<number>(0);
  const [tempLanguage, setTempLanguage] = useState<string>('');
  const [tempVerifiedOnly, setTempVerifiedOnly] = useState<boolean>(false);
  const [tempAvailableToday, setTempAvailableToday] = useState<boolean>(false);
  const [tempOnlineOnly, setTempOnlineOnly] = useState<boolean>(false);
  const [tempSortBy, setTempSortBy] = useState<'RATING_DESC' | 'PRICE_ASC' | 'EXPERIENCE_DESC' | 'REVIEWS_DESC' | 'ALPHA_ASC'>('RATING_DESC');

  const openFilterSheet = () => {
    setTempGender(gender);
    setTempMinExperience(minExperience);
    setTempMinRating(minRating);
    setTempMaxFee(maxFee);
    setTempLanguage(language);
    setTempVerifiedOnly(verifiedOnly);
    setTempAvailableToday(availableToday);
    setTempOnlineOnly(onlineOnly);
    setTempSortBy(sortBy);
    setIsFilterSheetVisible(true);
  };

  const handleApplyFilters = () => {
    setGender(tempGender);
    setMinExperience(tempMinExperience);
    setMinRating(tempMinRating);
    setMaxFee(tempMaxFee);
    setLanguage(tempLanguage);
    setVerifiedOnly(tempVerifiedOnly);
    setAvailableToday(tempAvailableToday);
    setOnlineOnly(tempOnlineOnly);
    setSortBy(tempSortBy);
    setIsFilterSheetVisible(false);
  };

  const isTablet = width >= 768;

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch doctors (combines specialty filter, debounced search, sorting, and active filters)
  useEffect(() => {
    dispatch(
      fetchDoctors({
        filters: {
          specialty: activeSpecialty,
          gender,
          minExperience: minExperience || undefined,
          minRating: minRating || undefined,
          maxFee: maxFee || undefined,
          language: language || undefined,
          verifiedOnly,
          availableToday,
          onlineOnly,
          searchQuery: debouncedSearch,
        },
        sortBy,
      })
    );
  }, [
    dispatch,
    activeSpecialty,
    debouncedSearch,
    gender,
    minExperience,
    minRating,
    maxFee,
    language,
    verifiedOnly,
    availableToday,
    onlineOnly,
    sortBy,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await dispatch(
      fetchDoctors({
        filters: {
          specialty: activeSpecialty,
          gender,
          minExperience,
          minRating,
          maxFee,
          language,
          verifiedOnly,
          availableToday,
          onlineOnly,
          searchQuery: debouncedSearch,
        },
        sortBy,
      })
    );
    setRefreshing(false);
  };

  const handleResetFilters = () => {
    setTempGender('All');
    setTempMinExperience(0);
    setTempMinRating(0);
    setTempMaxFee(0);
    setTempLanguage('');
    setTempVerifiedOnly(false);
    setTempAvailableToday(false);
    setTempOnlineOnly(false);
    setTempSortBy('RATING_DESC');

    setGender('All');
    setMinExperience(0);
    setMinRating(0);
    setMaxFee(0);
    setLanguage('');
    setVerifiedOnly(false);
    setAvailableToday(false);
    setOnlineOnly(false);
    setSortBy('RATING_DESC');
    setSearch('');
    dispatch(setActiveSpecialty('All'));
    setIsFilterSheetVisible(false);
  };

  const handleSelectDoctor = useCallback((doctor: Doctor) => {
    dispatch(setSelectedDoctor(doctor));
    navigation.navigate(ROUTES.CONSULTATION.DOCTOR_DETAILS);
  }, [dispatch, navigation]);

  const handleBookSlot = useCallback((doctor: Doctor) => {
    dispatch(setSelectedDoctor(doctor));
    navigation.navigate(ROUTES.CONSULTATION.SLOT_SELECTION);
  }, [dispatch, navigation]);

  const MemoizedDoctorCard = React.memo(({ item }: { item: Doctor }) => (
    <DoctorCard
      doctor={item}
      onPress={() => handleSelectDoctor(item)}
      onBookPress={() => handleBookSlot(item)}
    />
  ));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Find Ayurvedic Doctor</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Consult certified BAMS & MD specialists
          </Text>

          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search doctor by name or condition..."
              />
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, { borderColor: theme.colors.border }]}
              onPress={openFilterSheet}
            >
              <SlidersHorizontal size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={SPECIALTIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            renderItem={({ item }) => (
              <Chip
                label={item}
                isSelected={activeSpecialty === item}
                onPress={() => {
                  setPage(1);
                  dispatch(setActiveSpecialty(item));
                }}
              />
            )}
          />

          {allDoctors.length > 0 && (
            <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
              {allDoctors.length} {allDoctors.length === 1 ? 'doctor' : 'doctors'} available
            </Text>
          )}
        </View>

        {isLoading && allDoctors.length === 0 ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={[styles.shimmerCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <View style={styles.shimmerRow}>
                  <ShimmerPlaceholder style={styles.shimmerAvatar} />
                  <View style={styles.shimmerInfo}>
                    <View style={styles.shimmerHeaderRow}>
                      <ShimmerPlaceholder style={styles.shimmerName} />
                      <ShimmerPlaceholder style={styles.shimmerTag} />
                    </View>
                    <ShimmerPlaceholder style={styles.shimmerText} />
                    <ShimmerPlaceholder style={styles.shimmerMeta} />
                  </View>
                </View>
                <View style={[styles.shimmerDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.shimmerFooterRow}>
                  <View>
                    <ShimmerPlaceholder style={styles.shimmerFeeLabel} />
                    <ShimmerPlaceholder style={styles.shimmerFeeAmount} />
                  </View>
                  <ShimmerPlaceholder style={styles.shimmerBtn} />
                </View>
              </View>
            ))}
          </View>
        ) : allDoctors.length === 0 ? (
          <EmptyState
            title="No Doctors Available"
            description="We couldn't find any doctor matching your search or filters."
            actionTitle="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <FlatList
            data={allDoctors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item }) => <MemoizedDoctorCard item={item} />}
          />
        )}

        <BottomSheet
          isVisible={isFilterSheetVisible}
          onClose={() => setIsFilterSheetVisible(false)}
          title="Sort & Filter Doctors"
        >
          <ScrollView contentContainerStyle={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Sort By</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Rating (High-Low)', val: 'RATING_DESC' },
                { label: 'Fee (Low-High)', val: 'PRICE_ASC' },
                { label: 'Experience (High-Low)', val: 'EXPERIENCE_DESC' },
                { label: 'Most Reviewed', val: 'REVIEWS_DESC' },
                { label: 'Name (A-Z)', val: 'ALPHA_ASC' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempSortBy === opt.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempSortBy(opt.val as any)}
                >
                  <Text style={[styles.filterOptionText, { color: tempSortBy === opt.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Gender Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Gender</Text>
            <View style={styles.filterChipRow}>
              {['All', 'Male', 'Female'].map((gen) => (
                <TouchableOpacity
                  key={gen}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempGender === gen && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempGender(gen as any)}
                >
                  <Text style={[styles.filterOptionText, { color: tempGender === gen ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {gen}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Experience Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary, marginTop: 12 }]}>Experience</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Any Experience', val: 0 },
                { label: '5+ Years', val: 5 },
                { label: '10+ Years', val: 10 },
                { label: '15+ Years', val: 15 },
              ].map((exp) => (
                <TouchableOpacity
                  key={exp.val}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempMinExperience === exp.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempMinExperience(exp.val)}
                >
                  <Text style={[styles.filterOptionText, { color: tempMinExperience === exp.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {exp.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary, marginTop: 12 }]}>Max Consultation Fee</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Any Price', val: 0 },
                { label: 'Under ₹500', val: 500 },
                { label: 'Under ₹700', val: 700 },
                { label: 'Under ₹900', val: 900 },
              ].map((fee) => (
                <TouchableOpacity
                  key={fee.val}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempMaxFee === fee.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempMaxFee(fee.val)}
                >
                  <Text style={[styles.filterOptionText, { color: tempMaxFee === fee.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {fee.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Toggle Switches */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Preferences</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleCard, { borderColor: theme.colors.border }, tempVerifiedOnly && { backgroundColor: theme.colors.brand[50] }]}
                onPress={() => setTempVerifiedOnly(!tempVerifiedOnly)}
              >
                <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>Verified Only</Text>
                {tempVerifiedOnly && <Check size={16} color={theme.colors.brand[500]} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleCard, { borderColor: theme.colors.border }, tempOnlineOnly && { backgroundColor: theme.colors.brand[50] }]}
                onPress={() => setTempOnlineOnly(!tempOnlineOnly)}
              >
                <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>Online Consultation</Text>
                {tempOnlineOnly && <Check size={16} color={theme.colors.brand[500]} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleCard, { borderColor: theme.colors.border }, tempAvailableToday && { backgroundColor: theme.colors.brand[50] }]}
                onPress={() => setTempAvailableToday(!tempAvailableToday)}
              >
                <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>Available Today</Text>
                {tempAvailableToday && <Check size={16} color={theme.colors.brand[500]} />}
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <Button title="Reset Filters" variant="outline" onPress={handleResetFilters} style={{ flex: 1 }} />
              <Button title="Apply Filters" onPress={handleApplyFilters} style={{ flex: 1.5 }} />
            </View>
          </ScrollView>
        </BottomSheet>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveWrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBtn: {
    borderWidth: 1,
    height: 44,
    width: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipList: {
    marginVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  skeletonContainer: {
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  filterScroll: {
    paddingBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterOptionChip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '48%',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shimmerCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginVertical: 6,
  },
  shimmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shimmerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  shimmerInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  shimmerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shimmerName: {
    width: '50%',
    height: 16,
    borderRadius: 4,
  },
  shimmerTag: {
    width: 60,
    height: 18,
    borderRadius: 9,
  },
  shimmerText: {
    width: '75%',
    height: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  shimmerMeta: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  shimmerDivider: {
    height: 1,
    marginVertical: 12,
  },
  shimmerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shimmerFeeLabel: {
    width: 70,
    height: 10,
    borderRadius: 3,
    marginBottom: 4,
  },
  shimmerFeeAmount: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
  shimmerBtn: {
    width: 80,
    height: 32,
    borderRadius: 16,
  },
});
