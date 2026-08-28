import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Calendar, Clock, WifiOff } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { cancelBooking } from '../store/consultationSlice';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Button } from '../../../shared/components/ui/Button';
import { Tag } from '../../../shared/components/ui/Tag';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { formatDateDDMMYYYY, formatTime12Hour } from '../../../shared/utils/dateUtils';
import { ROUTES } from '../../../app/constants/routes';

export const UpcomingConsultationsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { upcomingBookings } = useAppSelector((state) => state.consultation);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Upcoming Consultations
      </Text>

      {upcomingBookings.length === 0 ? (
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
                  onPress={() => dispatch(cancelBooking(item.id))}
                />
                <Button title="Join Video Call" size="sm" style={styles.joinBtn} />
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
});
