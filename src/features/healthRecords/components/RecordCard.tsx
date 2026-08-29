import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pill, FlaskConical, Activity, Leaf, FileText, UserCheck, Building2 } from 'lucide-react-native';
import { HealthRecord } from '../types/healthRecordTypes';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Tag } from '../../../shared/components/ui/Tag';

export interface RecordCardProps {
  record: HealthRecord;
  onPress: () => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, onPress }) => {
  const { theme } = useTheme();

  const renderCategoryIcon = (category: string) => {
    const iconColor = theme.colors.brand[700];
    switch (category) {
      case 'Prescription':
        return <Pill size={22} color={iconColor} />;
      case 'Lab Report':
        return <FlaskConical size={22} color={iconColor} />;
      case 'Vitals':
        return <Activity size={22} color={iconColor} />;
      case 'Panchakarma Summary':
        return <Leaf size={22} color={iconColor} />;
      default:
        return <FileText size={22} color={iconColor} />;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <Card style={styles.card} elevation="low">
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.brand[50] }]}>
            {renderCategoryIcon(record.category)}
          </View>

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Tag label={record.category} />
              <Text style={[styles.date, { color: theme.colors.textMuted }]}>{record.date}</Text>
            </View>

            <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {record.title}
            </Text>

            {record.doctorName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <UserCheck size={13} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.doctor, { color: theme.colors.textSecondary }]}>
                  {record.doctorName}
                </Text>
              </View>
            )}

            {record.facilityName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Building2 size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.facility, { color: theme.colors.textMuted }]}>
                  {record.facilityName}
                </Text>
              </View>
            )}

            {record.vitals && (
              <View style={[styles.vitalsBadge, { backgroundColor: theme.colors.surface }]}>
                {record.vitals.bp && (
                  <Text style={[styles.vitalText, { color: theme.colors.textSecondary }]}>
                    BP: {record.vitals.bp}
                  </Text>
                )}
                {record.vitals.pulse && (
                  <Text style={[styles.vitalText, { color: theme.colors.textSecondary }]}>
                    Pulse: {record.vitals.pulse} bpm
                  </Text>
                )}
                {record.vitals.weightKg && (
                  <Text style={[styles.vitalText, { color: theme.colors.textSecondary }]}>
                    Weight: {record.vitals.weightKg} kg
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  doctor: {
    fontSize: 12,
    marginTop: 2,
  },
  facility: {
    fontSize: 11,
    marginTop: 2,
  },
  vitalsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  vitalText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
