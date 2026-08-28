import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { UserCheck, Building2, Share2, Check } from 'lucide-react-native';
import { useAppSelector } from '../../../app/store/store';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Tag } from '../../../shared/components/ui/Tag';
import { Button } from '../../../shared/components/ui/Button';
import { BottomSheet } from '../../../shared/components/ui/BottomSheet';
import { useToast } from '../../../shared/components/ui/Toast';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateUtils';

const DOCTOR_OPTIONS = [
  { id: 'doc_1', name: 'Dr. Vaidya Harsh Sharma', specialty: 'Pitta' },
  { id: 'doc_2', name: 'Dr. Ananya Roy', specialty: 'Vata' },
  { id: 'doc_3', name: 'Dr. Rajesh Nair', specialty: 'Kapha' },
  { id: 'doc_4', name: 'Dr. Sunita Deshmukh', specialty: 'General Ayurveda' },
];

export const RecordDetailsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { selectedRecord } = useAppSelector((state) => state.healthRecords);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>('doc_1');

  if (!selectedRecord) return null;

  const handleShareConfirm = () => {
    const doctor = DOCTOR_OPTIONS.find((d) => d.id === selectedDoctorId);
    const doctorName = doctor ? doctor.name : 'your doctor';
    showToast(`Record "${selectedRecord.title}" shared with ${doctorName}! Access granted via encrypted vault.`, 'success');
    setIsShareModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Tag label={selectedRecord.category} style={styles.tag} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{selectedRecord.title}</Text>
        <Text style={[styles.date, { color: theme.colors.textMuted }]}>
          Date: {formatDateDDMMYYYY(selectedRecord.date)}
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Healthcare Provider</Text>
          {selectedRecord.doctorName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
              <UserCheck size={16} color={theme.colors.brand[500]} style={{ marginRight: 8 }} />
              <Text style={[styles.info, { color: theme.colors.textPrimary }]}>
                {selectedRecord.doctorName}
              </Text>
            </View>
          )}
          {selectedRecord.facilityName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
              <Building2 size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.info, { color: theme.colors.textSecondary }]}>
                {selectedRecord.facilityName}
              </Text>
            </View>
          )}
        </Card>

        {selectedRecord.notes && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Clinical Notes</Text>
            <Text style={[styles.notes, { color: theme.colors.textPrimary }]}>
              {selectedRecord.notes}
            </Text>
          </Card>
        )}

        {selectedRecord.vitals && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Recorded Vitals</Text>
            {selectedRecord.vitals.bp && (
              <Text style={[styles.info, { color: theme.colors.textPrimary }]}>
                Blood Pressure: {selectedRecord.vitals.bp} mmHg
              </Text>
            )}
            {selectedRecord.vitals.pulse && (
              <Text style={[styles.info, { color: theme.colors.textPrimary }]}>
                Heart Pulse: {selectedRecord.vitals.pulse} bpm
              </Text>
            )}
            {selectedRecord.vitals.weightKg && (
              <Text style={[styles.info, { color: theme.colors.textPrimary }]}>
                Body Weight: {selectedRecord.vitals.weightKg} kg
              </Text>
            )}
          </Card>
        )}

        <Button
          title="Share Record with Doctor"
          variant="outline"
          onPress={() => setIsShareModalVisible(true)}
          style={styles.shareBtn}
        />
      </ScrollView>

      <BottomSheet
        isVisible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        title="Share Record with Doctor"
      >
        <Text style={[styles.modalSub, { color: theme.colors.textSecondary }]}>
          Select a verified practitioner to grant end-to-end encrypted access to this health record:
        </Text>

        {DOCTOR_OPTIONS.map((doc) => {
          const isSelected = selectedDoctorId === doc.id;
          return (
            <TouchableOpacity
              key={doc.id}
              style={[
                styles.doctorOption,
                {
                  borderColor: isSelected ? theme.colors.brand[500] : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.brand[50] : theme.colors.card,
                },
              ]}
              onPress={() => setSelectedDoctorId(doc.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionName, { color: theme.colors.textPrimary }]}>
                  {doc.name}
                </Text>
                <Text style={[styles.optionSpecialty, { color: theme.colors.textSecondary }]}>
                  {doc.specialty} Specialist
                </Text>
              </View>
              {isSelected && <Check size={18} color={theme.colors.brand[500]} />}
            </TouchableOpacity>
          );
        })}

        <Button
          title="Confirm Encrypted Share"
          onPress={handleShareConfirm}
          style={{ marginTop: 16 }}
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  tag: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    marginTop: 4,
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
  info: {
    fontSize: 14,
    marginVertical: 2,
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
  },
  shareBtn: {
    marginTop: 12,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  doctorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionSpecialty: {
    fontSize: 12,
    marginTop: 2,
  },
});
