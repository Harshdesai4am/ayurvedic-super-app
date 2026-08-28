import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { OfflineQueue, OfflineMutation } from '../../../core/offline/offlineQueue';
import { SyncManager } from '../../../core/offline/syncManager';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Tag } from '../../../shared/components/ui/Tag';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { useToast } from '../../../shared/components/ui/Toast';

export const OfflineQueueScreen = () => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [queue, setQueue] = useState<OfflineMutation[]>(OfflineQueue.getQueue());

  const handleManualSync = async () => {
    await SyncManager.processQueue();
    setQueue(OfflineQueue.getQueue());
    showToast('Offline Queue sync attempt completed.', 'info');
  };

  const handleClear = () => {
    OfflineQueue.clear();
    setQueue([]);
    showToast('Offline Queue cleared', 'warning');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Offline Sync Queue</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Pending background actions queued for server synchronization
        </Text>
        <View style={styles.btnRow}>
          <Button title="Sync Now" size="sm" onPress={handleManualSync} />
          <Button title="Clear Queue" variant="outline" size="sm" onPress={handleClear} />
        </View>
      </View>

      {queue.length === 0 ? (
        <EmptyState
          title="Sync Queue Empty"
          description="All consultation bookings, cart changes, and health record uploads are synchronized."
        />
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.itemHeader}>
                <Tag label={item.type} backgroundColor={theme.colors.brand[500]} color="#FFFFFF" />
                <Text style={[styles.time, { color: theme.colors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={[styles.idText, { color: theme.colors.textPrimary }]}>
                Mutation ID: {item.id}
              </Text>
              <Text style={[styles.retryText, { color: theme.colors.textSecondary }]}>
                Retry Attempts: {item.retryCount}
              </Text>
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
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 10,
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
  },
  idText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryText: {
    fontSize: 12,
    marginTop: 4,
  },
});
