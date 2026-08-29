import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Clock } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { bookSlotThunk } from '../store/consultationSlice';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/components/ui/Toast';
import { formatDateDDMMYYYY, formatTime12Hour } from '../../../shared/utils/dateUtils';
import { ROUTES } from '../../../app/constants/routes';

export const BookingSummaryScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { selectedDoctor, selectedSlot } = useAppSelector((state) => state.consultation);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTablet = width >= 768;

  if (!selectedDoctor || !selectedSlot) return null;

  const tax = Math.round(selectedDoctor.consultationFee * 0.18);
  const totalAmount = selectedDoctor.consultationFee + tax;

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(
        bookSlotThunk({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          doctorAvatar: selectedDoctor.avatar,
          specialty: selectedDoctor.specialty,
          slotDate: selectedSlot.date,
          slotTime: selectedSlot.time,
          consultationFee: totalAmount,
          patientNotes: notes,
        })
      ).unwrap();

      showToast('Consultation slot reserved successfully!', 'success');
      navigation.navigate(ROUTES.CONSULTATION.BOOKING_SUCCESS);
    } catch (err: any) {
      showToast(err || 'Failed to book slot', 'error');
    } finally {
      setIsSubmitting(false);
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
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Booking Summary</Text>

          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Doctor Details</Text>
            <Text style={[styles.doctorName, { color: theme.colors.textPrimary }]}>
              {selectedDoctor.name}
            </Text>
            <Text style={[styles.doctorDetail, { color: theme.colors.textSecondary }]}>
              {selectedDoctor.qualification}
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Schedule</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <Calendar size={16} color={theme.colors.brand[500]} style={{ marginRight: 8 }} />
              <Text style={[styles.detailText, { color: theme.colors.textPrimary }]}>
                Date: {formatDateDDMMYYYY(selectedSlot.date)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <Clock size={16} color={theme.colors.brand[500]} style={{ marginRight: 8 }} />
              <Text style={[styles.detailText, { color: theme.colors.textPrimary }]}>
                Time: {formatTime12Hour(selectedSlot.time)} ({selectedSlot.period})
              </Text>
            </View>
          </Card>

          <Input
            label="Health Concerns & Notes (Optional)"
            placeholder="Briefly describe your symptoms or Prakriti query..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
            style={{ height: 140 }}
          />

          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Price Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Consultation Fee</Text>
              <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
                ₹{selectedDoctor.consultationFee}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>GST (18%)</Text>
              <Text style={[styles.value, { color: theme.colors.textPrimary }]}>₹{tax}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>Total Payable</Text>
              <Text style={[styles.totalValue, { color: theme.colors.brand[500] }]}>₹{totalAmount}</Text>
            </View>
          </Card>
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
          <Button
            title="Confirm & Pay"
            size="lg"
            isLoading={isSubmitting}
            onPress={handleConfirmBooking}
            style={styles.payBtn}
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
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  doctorDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  payBtn: {
    width: '100%',
  },
});
