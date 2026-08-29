import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { fetchDoctorSlots, setSelectedSlot, holdSelectedSlotLocally } from '../store/consultationSlice';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { SlotGrid } from '../components/SlotGrid';
import { Button } from '../../../shared/components/ui/Button';
import { ROUTES } from '../../../app/constants/routes';
import { TimeSlot } from '../types/consultationTypes';


export const SlotSelectionScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { selectedDoctor, slots, selectedSlot } = useAppSelector((state) => state.consultation);

  const [selectedDate, setSelectedDate] = useState('30/08/2026');
  const isTablet = width >= 768;

  useEffect(() => {
    if (selectedDoctor) {
      dispatch(fetchDoctorSlots({ doctorId: selectedDoctor.id, date: selectedDate }));
    }
  }, [dispatch, selectedDoctor, selectedDate]);

  if (!selectedDoctor) return null;

  const handleProceed = () => {
    if (selectedSlot) {
      navigation.navigate(ROUTES.CONSULTATION.BOOKING_SUMMARY);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Select Appointment Slot</Text>
          <Text style={[styles.doctorName, { color: theme.colors.brand[500] }]}>
            Dr. {selectedDoctor.name}
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Date</Text>
          <View style={styles.dateRow}>
            {['30/08/2026', '31/08/2026', '01/09/2026'].map((date) => (
              <Button
                key={date}
                title={date}
                variant={selectedDate === date ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedDate(date)}
                style={styles.dateBtn}
              />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginTop: 20 }]}>
            Available Slots ({selectedDate})
          </Text>

          <SlotGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id}
            onSelectSlot={(slot: TimeSlot) => {
              dispatch(setSelectedSlot(slot));
              dispatch(holdSelectedSlotLocally({ doctorId: slot.doctorId, date: slot.date, time: slot.time }));
            }}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 16,
              maxWidth: isTablet ? 768 : '100%',
              alignSelf: 'center',
            },
          ]}
        >
          <View>
            <Text style={[styles.footerLabel, { color: theme.colors.textMuted }]}>Selected Time</Text>
            <Text style={[styles.footerSlot, { color: theme.colors.textPrimary }]}>
              {selectedSlot ? selectedSlot.time : 'None Selected'}
            </Text>
          </View>

          <Button
            title="Proceed to Summary"
            disabled={!selectedSlot}
            onPress={handleProceed}
          />
        </View>
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateBtn: {
    marginRight: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  footerLabel: {
    fontSize: 12,
  },
  footerSlot: {
    fontSize: 16,
    fontWeight: '700',
  },
});
