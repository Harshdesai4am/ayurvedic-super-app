import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { useAppSelector } from '../../../app/store/store';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Tag } from '../../../shared/components/ui/Tag';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { ROUTES } from '../../../app/constants/routes';

export const DoctorDetailsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { selectedDoctor } = useAppSelector((state) => state.consultation);

  const isTablet = width >= 768;

  if (!selectedDoctor) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
          <View style={styles.profileHeader}>
            <Avatar source={selectedDoctor.avatar} name={selectedDoctor.name} size={90} />
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{selectedDoctor.name}</Text>
            <Text style={[styles.qualification, { color: theme.colors.textSecondary }]}>
              {selectedDoctor.qualification}
            </Text>
            <Tag label={selectedDoctor.specialty} style={styles.tag} />
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.colors.brand[500] }]}>
                {selectedDoctor.experienceYears}+ Yrs
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Experience</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={[styles.statValue, { color: theme.colors.brand[500] }]}>
                  {selectedDoctor.rating}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                {selectedDoctor.reviewCount} Reviews
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.colors.brand[500] }]}>
                ₹{selectedDoctor.consultationFee}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Fee</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About Doctor</Text>
          <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>{selectedDoctor.bio}</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Available Days
          </Text>
          <View style={styles.daysRow}>
            {selectedDoctor.availableDays.map((day) => (
              <View key={day} style={[styles.dayBadge, { backgroundColor: theme.colors.brand[50] }]}>
                <Text style={[styles.dayText, { color: theme.colors.brand[700] }]}>{day}</Text>
              </View>
            ))}
          </View>
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
            <Text style={[styles.footerLabel, { color: theme.colors.textMuted }]}>Consultation Fee</Text>
            <Text style={[styles.footerPrice, { color: theme.colors.textPrimary }]}>
              ₹{selectedDoctor.consultationFee}
            </Text>
          </View>

          <Button
            title="Select Time Slot"
            size="lg"
            onPress={() => navigation.navigate(ROUTES.CONSULTATION.SLOT_SELECTION)}
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  qualification: {
    fontSize: 14,
    marginTop: 4,
  },
  tag: {
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
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
  footerPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
});
