import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { fetchDoctors, setActiveSpecialty, setSelectedDoctor } from '../store/consultationSlice';
import { DoctorCard } from '../components/DoctorCard';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { SearchBar } from '../../../shared/components/ui/SearchBar';
import { Chip } from '../../../shared/components/ui/Chip';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ROUTES } from '../../../app/constants/routes';
import { Doctor } from '../types/consultationTypes';

const SPECIALTIES = ['All', 'Vata', 'Pitta', 'Kapha', 'General Ayurveda', 'Panchakarma'];

export const DoctorListingScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { doctors, activeSpecialty, isLoading } = useAppSelector((state) => state.consultation);

  const [search, setSearch] = useState('');
  const isTablet = width >= 768;

  useEffect(() => {
    dispatch(fetchDoctors({ specialty: activeSpecialty, searchQuery: search }));
  }, [dispatch, activeSpecialty, search]);

  const handleSelectDoctor = (doctor: Doctor) => {
    dispatch(setSelectedDoctor(doctor));
    navigation.navigate(ROUTES.CONSULTATION.DOCTOR_DETAILS);
  };

  const handleBookSlot = (doctor: Doctor) => {
    dispatch(setSelectedDoctor(doctor));
    navigation.navigate(ROUTES.CONSULTATION.SLOT_SELECTION);
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
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Find Ayurvedic Doctor</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Consult certified BAMS & MD specialists
          </Text>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search doctor by name or condition..."
          />

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
                onPress={() => dispatch(setActiveSpecialty(item))}
              />
            )}
          />

          {doctors.length > 0 && (
            <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
              {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} available
            </Text>
          )}
        </View>

        {isLoading && doctors.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={140} style={{ marginBottom: 12 }} />
            <Skeleton height={140} style={{ marginBottom: 12 }} />
            <Skeleton height={140} style={{ marginBottom: 12 }} />
          </View>
        ) : doctors.length === 0 ? (
          <EmptyState
            title="No Doctors Available"
            description="We couldn't find any doctor matching your search or specialty filter."
            actionTitle="Reset Search"
            onAction={() => {
              setSearch('');
              dispatch(setActiveSpecialty('All'));
            }}
          />
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <DoctorCard
                doctor={item}
                onPress={() => handleSelectDoctor(item)}
                onBookPress={() => handleBookSlot(item)}
              />
            )}
          />
        )}
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
});
