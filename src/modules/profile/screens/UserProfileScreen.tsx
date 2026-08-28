import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Tag } from '../../../shared/components/ui/Tag';
import { useNetworkStatus } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { ROUTES } from '../../../app/constants/routes';

export const UserProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const network = useNetworkStatus();
  const pendingQueueCount = OfflineQueue.getQueue().length;

  const isTablet = width >= 768;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.header}>
            <Avatar name="Prakriti Patient" size={80} />
            <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>Prakriti Patient</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              patient@ayurvedic.com
            </Text>
            <View style={styles.doshaRow}>
              <Tag label="Pitta-Kapha Prakriti" dosha="pitta" />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>Network & Sync</Text>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Connection Status</Text>
              <Tag
                label={network.isConnected ? 'ONLINE' : 'OFFLINE'}
                backgroundColor={network.isConnected ? theme.colors.status.success : theme.colors.status.warning}
                color="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.row}>
              <View>
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Offline Queue</Text>
                <Text style={[styles.subText, { color: theme.colors.textMuted }]}>
                  {pendingQueueCount} pending offline mutations
                </Text>
              </View>
              <Button
                title="Inspect Queue"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate(ROUTES.PROFILE.OFFLINE_QUEUE)}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.brand[500] }]}>App Preferences</Text>
            <View style={styles.row}>
              <View>
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Theme Mode</Text>
                <Text style={[styles.subText, { color: theme.colors.textMuted }]}>
                  Optimized Light Theme active
                </Text>
              </View>
              <Tag label="Light Mode" backgroundColor={theme.colors.brand[100]} color={theme.colors.brand[700]} />
            </View>
          </Card>
        </ScrollView>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  doshaRow: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
