import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Calendar, Clock, WifiOff } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { cancelBookingThunk, fetchUpcomingBookings } from '../store/consultationSlice';
import { selectUpcomingBookings, selectIsConsultationLoading } from '../selectors/consultationSelectors';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Button } from '../../../shared/components/ui/Button';
import { Tag } from '../../../shared/components/ui/Tag';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { useToast } from '../../../shared/components/ui/Toast';
import { formatDateDDMMYYYY, formatTime12Hour } from '../../../shared/utils/dateUtils';
import { ROUTES } from '../../../app/constants/routes';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

export const UpcomingConsultationsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  
  const upcomingBookings = useAppSelector(selectUpcomingBookings);
  const isLoading = useAppSelector(selectIsConsultationLoading);

  // Fetch bookings on mount
  useEffect(() => {
    dispatch(fetchUpcomingBookings());
  }, [dispatch]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await dispatch(cancelBookingThunk(bookingId)).unwrap();
      showToast('Appointment cancelled successfully.', 'success');
    } catch (err: any) {
      showToast(err || 'Failed to cancel appointment', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Upcoming Consultations
      </Text>

      {isLoading && upcomingBookings.length === 0 ? (
        <View style={styles.shimmerContainer}>
          {Array.from({ length: 2 }).map((_, index) => (
            <View key={index} style={[styles.shimmerCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <View style={styles.shimmerHeader}>
                <ShimmerPlaceholder style={styles.shimmerAvatar} />
                <View style={styles.shimmerHeaderInfo}>
                  <ShimmerPlaceholder style={styles.shimmerName} />
                  <ShimmerPlaceholder style={styles.shimmerTag} />
                </View>
              </View>
              <View style={[styles.shimmerDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.shimmerDetailsRow}>
                <ShimmerPlaceholder style={styles.shimmerDetail} />
                <ShimmerPlaceholder style={styles.shimmerDetail} />
              </View>
              <View style={styles.shimmerBtnRow}>
                <ShimmerPlaceholder style={styles.shimmerCancelBtn} />
              </View>
            </View>
          ))}
        </View>
      ) : upcomingBookings.length === 0 ? (
        <EmptyState
          title="No Upcoming Consultations"
          description="Book a slot with our expert Ayurvedic doctors for personalized healthcare."
          actionTitle="Find a Doctor"
          onAction={() => navigation.navigate(ROUTES.CONSULTATION.DOCTOR_LISTING)}
        />
      ) : (
        <FlatList
          data={upcomingBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card} elevation="low">
              <View style={styles.header}>
                <Avatar source={item.doctorAvatar} name={item.doctorName} size={48} />
                <View style={styles.headerInfo}>
                  <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
                    {item.doctorName}
                  </Text>
                  <Tag label={item.specialty} />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.detailsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
                    {formatDateDDMMYYYY(item.slotDate)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
                    {formatTime12Hour(item.slotTime)}
                  </Text>
                </View>
              </View>

              {item.isOfflineQueued && (
                <View style={[styles.offlineBanner, { backgroundColor: theme.colors.status.warning + '20' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <WifiOff size={14} color={theme.colors.status.warning} style={{ marginRight: 6 }} />
                    <Text style={[styles.offlineText, { color: theme.colors.status.warning }]}>
                      Queued for sync when online
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.btnRow}>
                <Button
                  title="Cancel Booking"
                  variant="outline"
                  size="sm"
                  onPress={() => handleCancelBooking(item.id)}
                  style={styles.cancelBtnFull}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    fontWeight: '500',
  },
  offlineBanner: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinBtn: {
    flex: 1,
    marginLeft: 8,
  },
  cancelBtnFull: {
    flex: 1,
    width: '100%',
  },
  shimmerContainer: {
    paddingVertical: 4,
  },
  shimmerCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  shimmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shimmerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  shimmerHeaderInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 6,
  },
  shimmerName: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  shimmerTag: {
    width: 60,
    height: 16,
    borderRadius: 4,
  },
  shimmerDivider: {
    height: 1,
    marginVertical: 12,
  },
  shimmerDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shimmerDetail: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  shimmerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shimmerCancelBtn: {
    width: '100%',
    height: 36,
    borderRadius: 6,
  },
});
