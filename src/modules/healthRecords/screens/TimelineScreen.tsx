import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import {
  fetchHealthRecords,
  setRecordCategoryFilter,
  setSelectedRecord,
  addHealthRecordThunk,
} from '../store/healthRecordsSlice';
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
import { HealthRecord } from '../types/healthRecordTypes';

const RECORD_CATEGORIES = ['All', 'Prescription', 'Lab Report', 'Vitals', 'Panchakarma Summary'];

export const TimelineScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { records, selectedCategory, isLoading } = useAppSelector((state) => state.healthRecords);

  const [search, setSearch] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const isTablet = width >= 768;

  useEffect(() => {
    dispatch(fetchHealthRecords());
  }, [dispatch]);

  const filteredRecords = records.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      r.title.toLowerCase().includes(q) ||
      (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
      r.category.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleAddRecord = async () => {
    if (!newTitle.trim()) {
      showToast('Record title is required', 'error');
      return;
    }

    await dispatch(
      addHealthRecordThunk({
        title: newTitle,
        category: 'Prescription',
        doctorName: newDoctor || 'Dr. Vaidya Harsh Sharma',
        date: formatDateDDMMYYYY(new Date()),
        notes: newNotes,
      })
    );

    showToast('Health Record added to local encrypted vault!', 'success');
    setIsAddModalVisible(false);
    setNewTitle('');
    setNewDoctor('');
    setNewNotes('');
  };

  const handleSelectRecord = (record: HealthRecord) => {
    dispatch(setSelectedRecord(record));
    navigation.navigate(ROUTES.HEALTH_RECORDS.RECORD_DETAILS);
  };

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

          <SearchBar value={search} onChangeText={setSearch} placeholder="Search prescriptions, lab tests..." />

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
        </View>

        {isLoading ? (
          <View style={styles.skeletonBox}>
            <Skeleton height={100} style={{ marginBottom: 12 }} />
            <Skeleton height={100} style={{ marginBottom: 12 }} />
          </View>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No Records Found"
            description="We couldn't find any health record matching your search."
            actionTitle="Reset Search"
            onAction={() => {
              setSearch('');
              dispatch(setRecordCategoryFilter('All'));
            }}
          />
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <RecordCard record={item} onPress={() => handleSelectRecord(item)} />
            )}
          />
        )}

        <BottomSheet
          isVisible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          title="Add New Health Record"
        >
          <Input label="Record Title" placeholder="e.g. Abhyanga Session Report" value={newTitle} onChangeText={setNewTitle} />
          <Input label="Doctor / Clinic Name" placeholder="e.g. Sanjeevani Ayurvedic Clinic" value={newDoctor} onChangeText={setNewDoctor} />
          <Input label="Clinical Notes" placeholder="Prescription summary or lifestyle instructions..." value={newNotes} onChangeText={setNewNotes} multiline style={{ height: 60 }} />
          <Button title="Save Record" onPress={handleAddRecord} style={{ marginTop: 12 }} />
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
  chipList: {
    marginVertical: 4,
  },
  skeletonBox: {
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
