import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { Doctor } from '../types/consultationTypes';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Tag } from '../../../shared/components/ui/Tag';
import { Button } from '../../../shared/components/ui/Button';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = React.memo(({ doctor, onPress, onBookPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
      <Card style={styles.card} elevation="low">
        <View style={styles.row}>
          <Avatar source={doctor.avatar} name={doctor.name} size={64} />
          
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {doctor.name}
              </Text>
              <Tag
                label={doctor.specialty}
                dosha={
                  doctor.specialty === 'Vata' || doctor.specialty === 'Pitta' || doctor.specialty === 'Kapha'
                    ? doctor.specialty.toLowerCase() as any
                    : undefined
                }
              />
            </View>

            <Text style={[styles.qualification, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {doctor.qualification}
            </Text>

            <View style={styles.metaRow}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={[styles.rating, { color: theme.colors.brand[500] }]}>
                {doctor.rating} ({doctor.reviewCount})
              </Text>
              <Text style={[styles.dot, { color: theme.colors.textMuted }]}>•</Text>
              <Text style={[styles.exp, { color: theme.colors.textSecondary }]}>
                {doctor.experienceYears} yrs exp
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.feeLabel, { color: theme.colors.textMuted }]}>Consultation Fee</Text>
            <Text style={[styles.feeAmount, { color: theme.colors.textPrimary }]}>
              ₹{doctor.consultationFee}
            </Text>
          </View>

          <Button title="Book Slot" size="sm" onPress={onBookPress} />
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touchable: {
    marginVertical: 6,
  },
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  qualification: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    marginHorizontal: 6,
  },
  exp: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
