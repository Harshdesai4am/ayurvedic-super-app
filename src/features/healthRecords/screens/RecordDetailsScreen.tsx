import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { UserCheck, Building2, Check, FileText, Eye, ZoomIn, ZoomOut, Download } from 'lucide-react-native';
import { useAppSelector } from '../../../app/store/store';
import { selectSelectedRecord } from '../selectors/healthRecordsSelectors';
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
  const selectedRecord = useAppSelector(selectSelectedRecord);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>('doc_1');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!selectedRecord) return null;

  const handleShareConfirm = () => {
    const doctor = DOCTOR_OPTIONS.find((d) => d.id === selectedDoctorId);
    const doctorName = doctor ? doctor.name : 'your doctor';
    showToast(`Record "${selectedRecord.title}" shared with ${doctorName}! Access granted via encrypted vault.`, 'success');
    setIsShareModalVisible(false);
  };

  const hasPdfPreview = selectedRecord.category === 'Lab Report' || selectedRecord.category === 'Vaccination';
  const hasImagePreview = selectedRecord.category === 'Prescription' || selectedRecord.category === 'Allergy';

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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
            <UserCheck size={16} color={theme.colors.brand[500]} style={{ marginRight: 8 }} />
            <Text style={[styles.info, { color: theme.colors.textPrimary }]}>
              {selectedRecord.doctorName || 'Dr. Vaidya Harsh Sharma'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
            <Building2 size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={[styles.info, { color: theme.colors.textSecondary }]}>
              {selectedRecord.facilityName || 'AyurCare Holistic Clinic'}
            </Text>
          </View>
        </Card>

        {selectedRecord.notes && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Clinical Notes</Text>
            <Text style={[styles.notes, { color: theme.colors.textPrimary }]}>
              {selectedRecord.notes}
            </Text>
          </Card>
        )}

        {selectedRecord.tags && selectedRecord.tags.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Metadata Tags</Text>
            <View style={styles.tagsContainer}>
              {selectedRecord.tags.map((tag) => (
                <Tag key={tag} label={tag} style={styles.tagChip} />
              ))}
            </View>
          </Card>
        )}

        {/* --- Document Preview Section --- */}
        {(hasPdfPreview || hasImagePreview) && (
          <Card style={styles.card}>
            <View style={styles.previewHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.brand[500], marginBottom: 0 }]}>
                {hasPdfPreview ? 'PDF Document Attachment' : 'Image Attachment'}
              </Text>
              <TouchableOpacity
                style={[styles.previewBadge, { backgroundColor: theme.colors.brand[50] }]}
                onPress={() => setShowPreviewModal(true)}
              >
                <Eye size={12} color={theme.colors.brand[500]} />
                <Text style={[styles.previewBadgeText, { color: theme.colors.brand[500] }]}>Open Preview</Text>
              </TouchableOpacity>
            </View>

            {hasPdfPreview ? (
              <View style={[styles.pdfMockContainer, { borderColor: theme.colors.border }]}>
                <FileText size={48} color={theme.colors.textMuted} />
                <Text style={[styles.pdfName, { color: theme.colors.textPrimary }]}>
                  {selectedRecord.title.replace(/\s+/g, '_')}.pdf
                </Text>
                <Text style={[styles.pdfSize, { color: theme.colors.textMuted }]}>
                  PDF Document • 424 KB • 1 Page
                </Text>
                <Button
                  title="View PDF Report"
                  size="sm"
                  variant="outline"
                  onPress={() => setShowPreviewModal(true)}
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.imageMockContainer, { borderColor: theme.colors.border }]}
                onPress={() => setShowPreviewModal(true)}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400' }}
                  style={styles.imagePreviewThumb}
                />
                <View style={styles.imageOverlay}>
                  <Eye size={20} color="#FFFFFF" />
                  <Text style={styles.imageOverlayText}>View Prescription Image</Text>
                </View>
              </TouchableOpacity>
            )}
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

      {/* --- Encrypted Share Sheet --- */}
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

      {/* --- High Fidelity Zoom Preview Sheet --- */}
      <BottomSheet
        isVisible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={hasPdfPreview ? "Lab Report PDF Viewer" : "Prescription Image Viewer"}
      >
        <View style={styles.modalHeaderActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.zoomText, { color: theme.colors.textPrimary }]}>
            {Math.round(zoomLevel * 100)}%
          </Text>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
          >
            <ZoomIn size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconBtn, { marginLeft: 'auto' }]}
            onPress={() => showToast('Document downloaded to Local Vault!', 'success')}
          >
            <Download size={18} color={theme.colors.brand[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.zoomScroll}
          contentContainerStyle={styles.zoomScrollContent}
          horizontal
        >
          <ScrollView contentContainerStyle={styles.zoomScrollContent}>
            {hasPdfPreview ? (
              <View
                style={[
                  styles.pdfReportMock,
                  {
                    transform: [{ scale: zoomLevel }],
                    borderColor: theme.colors.border,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              >
                <Text style={styles.pdfMockHeader}>AYURCARE LABS INC.</Text>
                <View style={styles.pdfMockDivider} />
                <Text style={styles.pdfMockMeta}>Patient: Test Patient   |   Date: {selectedRecord.date}</Text>
                <Text style={styles.pdfMockMeta}>Facility Ref: L-78482A   |   Authorized Signature: vaidyahsharma</Text>
                <View style={styles.pdfMockDivider} />
                <Text style={styles.pdfMockSubTitle}>EVALUATION PROFILE RESULTS</Text>

                <View style={styles.pdfMockRow}>
                  <Text style={styles.pdfMockColName}>TEST ANALYTE</Text>
                  <Text style={styles.pdfMockColVal}>VALUE</Text>
                  <Text style={styles.pdfMockColRange}>REFERENCE RANGE</Text>
                </View>

                <View style={styles.pdfMockRow}>
                  <Text style={styles.pdfMockTestName}>Total Triglycerides</Text>
                  <Text style={[styles.pdfMockTestVal, { color: theme.colors.status.error }]}>218 mg/dL</Text>
                  <Text style={styles.pdfMockTestRange}>&lt; 150 mg/dL (Elevated)</Text>
                </View>

                <View style={styles.pdfMockRow}>
                  <Text style={styles.pdfMockTestName}>SGPT / ALT</Text>
                  <Text style={styles.pdfMockTestVal}>38 U/L</Text>
                  <Text style={styles.pdfMockTestRange}>7 - 56 U/L (Normal)</Text>
                </View>

                <View style={styles.pdfMockRow}>
                  <Text style={styles.pdfMockTestName}>Total Bilirubin</Text>
                  <Text style={styles.pdfMockTestVal}>0.9 mg/dL</Text>
                  <Text style={styles.pdfMockTestRange}>0.2 - 1.2 mg/dL (Normal)</Text>
                </View>

                <View style={{ marginTop: 24 }}>
                  <Text style={styles.pdfMockFooterNotes}>
                    Notes: Pitta-pacifying diet plans are recommended. Heavy lipids and deep-fried items should be strictly avoided.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ transform: [{ scale: zoomLevel }] }}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600' }}
                  style={styles.fullPrescriptionImage}
                />
              </View>
            )}
          </ScrollView>
        </ScrollView>
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
    alignSelf: 'flex-start',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    marginRight: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pdfMockContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  pdfSize: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  imageMockContainer: {
    borderWidth: 1,
    borderRadius: 8,
    height: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  imagePreviewThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  zoomScroll: {
    maxHeight: 400,
  },
  zoomScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfReportMock: {
    width: 320,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pdfMockHeader: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    color: '#1A237E',
  },
  pdfMockDivider: {
    height: 1,
    backgroundColor: '#000000',
    marginVertical: 6,
  },
  pdfMockMeta: {
    fontSize: 8,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '600',
  },
  pdfMockSubTitle: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 8,
    color: '#333333',
  },
  pdfMockRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BDBDBD',
    paddingVertical: 4,
  },
  pdfMockColName: {
    flex: 2,
    fontSize: 8,
    fontWeight: '800',
  },
  pdfMockColVal: {
    flex: 1,
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  pdfMockColRange: {
    flex: 1.5,
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'right',
  },
  pdfMockTestName: {
    flex: 2,
    fontSize: 8,
    color: '#333333',
    fontWeight: '500',
  },
  pdfMockTestVal: {
    flex: 1,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  pdfMockTestRange: {
    flex: 1.5,
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
  },
  pdfMockFooterNotes: {
    fontSize: 7,
    fontStyle: 'italic',
    color: '#616161',
    lineHeight: 10,
  },
  fullPrescriptionImage: {
    width: 320,
    height: 400,
    resizeMode: 'contain',
  },
});
