import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, Check } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import {
  fetchHealthRecords,
  setRecordCategoryFilter,
  setSelectedRecord,
  addHealthRecordThunk,
  setRecordSearchQuery,
} from '../store/healthRecordsSlice';
import {
  selectGroupedRecords,
  selectSelectedCategory,
  selectSearchQuery,
  selectIsLoading,
  selectAllRecords
} from '../selectors/healthRecordsSelectors';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { RecordCard } from '../components/RecordCard';
import { SearchBar } from '../../../shared/components/ui/SearchBar';
import { Chip } from '../../../shared/components/ui/Chip';
import { Button } from '../../../shared/components/ui/Button';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { BottomSheet } from '../../../shared/components/ui/BottomSheet';
import { Input } from '../../../shared/components/ui/Input';
import { useToast } from '../../../shared/components/ui/Toast';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateUtils';
import { ROUTES } from '../../../app/constants/routes';
import { HealthRecord, RecordCategory } from '../types/healthRecordTypes';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

const RECORD_CATEGORIES = ['All', 'Prescription', 'Lab Report', 'Consultation', 'Vaccination', 'Allergy', 'Vitals'];

export const TimelineScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // Selectors
  const records = useAppSelector(selectAllRecords);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const searchQuery = useAppSelector(selectSearchQuery);
  const isLoading = useAppSelector(selectIsLoading);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Advanced Filters
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [dateRange, setDateRange] = useState<'All' | '30days' | '6months' | '1year'>('All');

  // Temporary local states for filter bottom sheet
  const [tempFilterDoctor, setTempFilterDoctor] = useState('');
  const [tempFilterTag, setTempFilterTag] = useState('');
  const [tempDateRange, setTempDateRange] = useState<'All' | '30days' | '6months' | '1year'>('All');

  const openFilterSheet = () => {
    setTempFilterDoctor(filterDoctor);
    setTempFilterTag(filterTag);
    setTempDateRange(dateRange);
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = () => {
    setFilterDoctor(tempFilterDoctor);
    setFilterTag(tempFilterTag);
    setDateRange(tempDateRange);
    setIsFilterModalVisible(false);
  };

  // Form State for Adding
  const [newTitle, setNewTitle] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<RecordCategory>('Prescription');
  const [newTagsString, setNewTagsString] = useState('');

  const isTablet = width >= 768;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setRecordSearchQuery(search));
    }, 300);
    return () => clearTimeout(handler);
  }, [search, dispatch]);

  useEffect(() => {
    dispatch(fetchHealthRecords());
  }, [dispatch]);

  // Client-side filtering combining Redux state search/category with the Advanced Filters
  const filteredTimeline = useMemo(() => {
    let result = records;

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((r) => r.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 2. Text Search Query
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        return (
          r.title.toLowerCase().includes(q) ||
          r.doctorName?.toLowerCase().includes(q) ||
          r.facilityName?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }

    // 3. Doctor Filter
    if (filterDoctor.trim().length > 0) {
      const doc = filterDoctor.toLowerCase().trim();
      result = result.filter((r) => r.doctorName?.toLowerCase().includes(doc));
    }

    // 4. Tag Filter
    if (filterTag.trim().length > 0) {
      const tag = filterTag.toLowerCase().trim();
      result = result.filter((r) => r.tags?.some((t) => t.toLowerCase() === tag));
    }

    // 5. Date Range Filter
    if (dateRange !== 'All') {
      const now = Date.now();
      let limitMs = 0;
      if (dateRange === '30days') limitMs = 30 * 24 * 60 * 60 * 1000;
      else if (dateRange === '6months') limitMs = 180 * 24 * 60 * 60 * 1000;
      else if (dateRange === '1year') limitMs = 365 * 24 * 60 * 60 * 1000;

      result = result.filter((r) => now - r.createdAt <= limitMs);
    }

    return result;
  }, [records, selectedCategory, searchQuery, filterDoctor, filterTag, dateRange]);

  // Group filtered results by Month & Year for the timeline sections
  const groupedSections = useMemo(() => {
    const groups: Record<string, HealthRecord[]> = {};

    filteredTimeline.forEach((record) => {
      const parts = record.date.split('/');
      let year = 'Unknown';
      let monthName = 'Unknown';

      if (parts.length === 3) {
        year = parts[2];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthName = months[monthIndex] || 'Unknown';
      }

      const key = `${monthName} ${year}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    const sections = Object.keys(groups).map((key) => {
      const [month, year] = key.split(' ');
      return {
        title: key,
        month,
        year,
        data: groups[key],
      };
    });

    sections.sort((a, b) => {
      const yearA = parseInt(a.year, 10) || 0;
      const yearB = parseInt(b.year, 10) || 0;
      if (yearA !== yearB) return yearB - yearA;

      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });

    return sections;
  }, [filteredTimeline]);

  const handleAddRecord = async () => {
    if (!newTitle.trim()) {
      showToast('Record title is required', 'error');
      return;
    }

    const tags = newTagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await dispatch(
      addHealthRecordThunk({
        title: newTitle,
        category: newCategory,
        doctorName: newDoctor || undefined,
        facilityName: newDoctor ? 'General Clinic' : undefined,
        date: formatDateDDMMYYYY(new Date()),
        notes: newNotes || undefined,
        tags,
      })
    );

    showToast('Health Record added to local SQLite secure store!', 'success');
    setIsAddModalVisible(false);
    setNewTitle('');
    setNewDoctor('');
    setNewNotes('');
    setNewTagsString('');
    setNewCategory('Prescription');
  };

  const handleSelectRecord = (record: HealthRecord) => {
    dispatch(setSelectedRecord(record));
    navigation.navigate(ROUTES.HEALTH_RECORDS.RECORD_DETAILS);
  };

  const handleResetFilters = () => {
    setTempFilterDoctor('');
    setTempFilterTag('');
    setTempDateRange('All');

    setFilterDoctor('');
    setFilterTag('');
    setDateRange('All');
    setSearch('');
    dispatch(setRecordCategoryFilter('All'));
    setIsFilterModalVisible(false);
  };

  const totalRecordCount = filteredTimeline.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Health Records</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Encrypted timeline of prescriptions & lab reports
              </Text>
            </View>

            <Button
              title="+ Upload"
              size="sm"
              onPress={() => setIsAddModalVisible(true)}
            />
          </View>

          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search prescriptions, lab tests, tags..." />
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
            data={RECORD_CATEGORIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            renderItem={({ item }) => (
              <Chip
                label={item}
                isSelected={selectedCategory === item}
                onPress={() => dispatch(setRecordCategoryFilter(item))}
              />
            )}
          />

          {totalRecordCount > 0 && (
            <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
              {totalRecordCount} {totalRecordCount === 1 ? 'record' : 'records'} found
            </Text>
          )}
        </View>

        {isLoading && groupedSections.length === 0 ? (
          <View style={styles.shimmerBox}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={[styles.shimmerCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <View style={styles.shimmerRow}>
                  <ShimmerPlaceholder style={styles.shimmerIcon} />
                  <View style={styles.shimmerContent}>
                    <View style={styles.shimmerHeaderRow}>
                      <ShimmerPlaceholder style={styles.shimmerTag} />
                      <ShimmerPlaceholder style={styles.shimmerDate} />
                    </View>
                    <ShimmerPlaceholder style={styles.shimmerTitle} />
                    <ShimmerPlaceholder style={styles.shimmerText} />
                    <ShimmerPlaceholder style={styles.shimmerVitals} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : groupedSections.length === 0 ? (
          <EmptyState
            title="No Records Found"
            description="We couldn't find any health record matching your search."
            actionTitle="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <FlatList
            data={groupedSections}
            keyExtractor={(item) => item.title}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: section }) => (
              <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { backgroundColor: theme.colors.border }]}>
                  <Text style={[styles.sectionTitleText, { color: theme.colors.textPrimary }]}>
                    {section.title}
                  </Text>
                </View>
                {section.data.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onPress={() => handleSelectRecord(record)}
                  />
                ))}
              </View>
            )}
          />
        )}

        {/* --- Upload bottom sheet --- */}
        <BottomSheet
          isVisible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          title="Add New Health Record"
        >
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input label="Record Title" placeholder="e.g. Abhyanga Session Report" value={newTitle} onChangeText={setNewTitle} />
            
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Category</Text>
            <View style={styles.categoryPickerRow}>
              {['Prescription', 'Lab Report', 'Consultation', 'Vaccination', 'Allergy'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    { borderColor: theme.colors.border },
                    newCategory === cat && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setNewCategory(cat as RecordCategory)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: newCategory === cat ? '#FFFFFF' : theme.colors.textPrimary }
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Doctor / Clinic Name" placeholder="e.g. Sanjeevani Ayurvedic Clinic" value={newDoctor} onChangeText={setNewDoctor} />
            <Input label="Tags (comma-separated)" placeholder="e.g. detox, liver, vata" value={newTagsString} onChangeText={setNewTagsString} />
            <Input label="Clinical Notes" placeholder="Prescription summary or lifestyle instructions..." value={newNotes} onChangeText={setNewNotes} multiline style={{ height: 60 }} />
            
            <Button title="Save Record" onPress={handleAddRecord} style={{ marginTop: 16, marginBottom: 20 }} />
          </ScrollView>
        </BottomSheet>

        {/* --- Health Records Filters Bottom Sheet --- */}
        <BottomSheet
          isVisible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          title="Filter Health Records"
        >
          <ScrollView contentContainerStyle={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Date Range Filter */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Date Added</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'All Time', val: 'All' },
                { label: 'Last 30 Days', val: '30days' },
                { label: 'Last 6 Months', val: '6months' },
                { label: 'Last Year', val: '1year' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[
                    styles.catChip,
                    { borderColor: theme.colors.border },
                    tempDateRange === opt.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempDateRange(opt.val as any)}
                >
                  <Text style={{ color: tempDateRange === opt.val ? '#FFFFFF' : theme.colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Doctor Filter input */}
            <Input
              label="Filter by Practitioner"
              placeholder="e.g. Vaidya Harsh"
              value={tempFilterDoctor}
              onChangeText={setTempFilterDoctor}
            />

            {/* Tag Filter input */}
            <Input
              label="Filter by Tag"
              placeholder="e.g. detox"
              value={tempFilterTag}
              onChangeText={setTempFilterTag}
            />

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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
  skeletonBox: {
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  catChip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    paddingBottom: 24,
  },
  filterScroll: {
    paddingBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  shimmerBox: {
    padding: 16,
  },
  shimmerCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginVertical: 6,
  },
  shimmerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shimmerIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  shimmerContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  shimmerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shimmerTag: {
    width: 80,
    height: 18,
    borderRadius: 9,
  },
  shimmerDate: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  shimmerTitle: {
    width: '95%',
    height: 16,
    borderRadius: 4,
  },
  shimmerText: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    marginTop: 2,
  },
  shimmerVitals: {
    width: '75%',
    height: 20,
    borderRadius: 6,
    marginTop: 8,
  },
});
