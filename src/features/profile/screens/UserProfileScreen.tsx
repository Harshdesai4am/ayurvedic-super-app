import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  User, 
  Heart, 
  Bell, 
  HelpCircle, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Calendar, 
  FileText, 
  ShoppingBag,
  Settings,
  ChevronDown,
  ChevronUp,
  Wifi,
  Database
} from 'lucide-react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Tag } from '../../../shared/components/ui/Tag';
import { useNetworkStatus } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { seedLargeDatasetForScaleTesting } from '../../../core/utils/performanceTestHelper';
import { sqlite } from '../../../core/database/sqlite';
import { useToast } from '../../../shared/components/ui/Toast';
import { ROUTES } from '../../../app/constants/routes';

export const UserProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const network = useNetworkStatus();
  const { showToast } = useToast();

  const [isSeeding, setIsSeeding] = useState(false);
  const [isDevSectionOpen, setIsDevSectionOpen] = useState(false);
  const [stats, setStats] = useState({ consultations: 0, healthRecords: 0, orders: 3 });

  const pendingQueueCount = OfflineQueue.getQueue().length;
  const isTablet = width >= 768;

  // Load actual counts from SQLite DB
  const loadStats = async () => {
    try {
      const bookingsRes = await sqlite.executeSql("SELECT COUNT(*) as count FROM bookings WHERE status = 'UPCOMING'");
      const recordsRes = await sqlite.executeSql("SELECT COUNT(*) as count FROM health_records WHERE isDeleted = 0");
      setStats({
        consultations: bookingsRes.rows.item(0).count || 0,
        healthRecords: recordsRes.rows.item(0).count || 0,
        orders: 3, // Mock orders count
      });
    } catch (e) {
      console.error('[Profile] Failed to load stats:', e);
    }
  };

  useEffect(() => {
    loadStats();
    const unsubscribe = navigation.addListener('focus', () => {
      loadStats();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSeedLargeData = async () => {
    setIsSeeding(true);
    showToast('Starting Scale Seeding (35k records)... This may take a few seconds.', 'success');
    
    setTimeout(async () => {
      try {
        await seedLargeDatasetForScaleTesting();
        showToast('Scale seeding complete! 35,000 items successfully written to SQLite.', 'success');
        loadStats();
      } catch (err) {
        showToast('Scale seeding failed.', 'error');
      } finally {
        setIsSeeding(false);
      }
    }, 100);
  };

  const handleMenuItemPress = (title: string) => {
    showToast(`${title} functionality coming soon!`, 'success');
  };

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
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <Card style={styles.headerCard} elevation="low">
            <View style={styles.headerRow}>
              <Avatar name="Prakriti Patient" size={68} />
              <View style={styles.headerTextContainer}>
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>Prakriti Patient</Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>patient@ayurvedic.com</Text>
                <View style={styles.tagWrapper}>
                  <Tag label="Pitta-Kapha Prakriti" dosha="pitta" />
                </View>
              </View>
            </View>
          </Card>

          {/* Patient Health Stats Card */}
          <Card style={styles.statsCard} elevation="low">
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>YOUR HEALTH OVERVIEW</Text>
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statBox} 
                onPress={() => navigation.navigate(ROUTES.CONSULTATION.UPCOMING_CONSULTATIONS)}
              >
                <View style={[styles.statIconWrapper, { backgroundColor: theme.colors.brand[50] }]}>
                  <Calendar size={20} color={theme.colors.brand[500]} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.consultations}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Appointments</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <TouchableOpacity style={styles.statBox} onPress={() => handleMenuItemPress('Active Orders')}>
                <View style={[styles.statIconWrapper, { backgroundColor: theme.colors.brand[50] }]}>
                  <ShoppingBag size={20} color={theme.colors.brand[500]} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.orders}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Active Orders</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <TouchableOpacity style={styles.statBox} onPress={() => handleMenuItemPress('Health Records')}>
                <View style={[styles.statIconWrapper, { backgroundColor: theme.colors.brand[50] }]}>
                  <FileText size={20} color={theme.colors.brand[500]} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.healthRecords}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Records</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Settings Menu Card */}
          <Card style={styles.menuCard} elevation="low">
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>ACCOUNT & SETTINGS</Text>
            
            {[
              { title: 'Personal Details', icon: User, desc: 'Manage your profile and dosha types' },
              { title: 'Medical History', icon: Heart, desc: 'Update chronic conditions & allergies' },
              { title: 'Notification Settings', icon: Bell, desc: 'Manage alerts & appointment reminders' },
              { title: 'Help & Support', icon: HelpCircle, desc: 'FAQs, contact chat, and ticket support' },
              { title: 'Privacy & Security Policy', icon: Shield, desc: 'Encrypted storage details & permissions' },
            ].map((item, index) => (
              <View key={item.title}>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress(item.title)}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconWrapper, { backgroundColor: theme.colors.background }]}>
                      <item.icon size={18} color={theme.colors.brand[600]} />
                    </View>
                    <View>
                      <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.menuItemDesc, { color: theme.colors.textMuted }]}>{item.desc}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
                {index < 4 && <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />}
              </View>
            ))}
          </Card>

          {/* Connection and Synchronization Status Card */}
          <Card style={styles.syncCard} elevation="low">
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>SYNCHRONIZATION STATUS</Text>
            <View style={styles.syncRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Wifi size={18} color={network.isConnected ? theme.colors.status.success : theme.colors.status.warning} />
                <View>
                  <Text style={[styles.syncLabel, { color: theme.colors.textPrimary }]}>Device Connection</Text>
                  <Text style={[styles.syncSubLabel, { color: theme.colors.textMuted }]}>
                    Currently {network.isConnected ? 'connected to remote secure sync' : 'operating in offline-first mode'}
                  </Text>
                </View>
              </View>
              <Tag
                label={network.isConnected ? 'ONLINE' : 'OFFLINE'}
                backgroundColor={network.isConnected ? theme.colors.status.success : theme.colors.status.warning}
                color="#FFFFFF"
              />
            </View>

            <View style={[styles.menuDivider, { backgroundColor: theme.colors.border, marginVertical: 12 }]} />

            <View style={styles.syncRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Database size={18} color={theme.colors.brand[500]} />
                <View>
                  <Text style={[styles.syncLabel, { color: theme.colors.textPrimary }]}>Offline Mutate Queue</Text>
                  <Text style={[styles.syncSubLabel, { color: theme.colors.textMuted }]}>
                    {pendingQueueCount} mutations waiting to commit on reconnection
                  </Text>
                </View>
              </View>
              <Button
                title="Inspect Queue"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate(ROUTES.PROFILE.OFFLINE_QUEUE)}
              />
            </View>
          </Card>

          {/* Expandable Developer Section */}
          <Card style={styles.devCard} elevation="low">
            <TouchableOpacity 
              style={styles.devHeader}
              onPress={() => setIsDevSectionOpen(!isDevSectionOpen)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.devTitle, { color: theme.colors.textSecondary }]}>Scale & Performance Testing</Text>
              </View>
              {isDevSectionOpen ? (
                <ChevronUp size={16} color={theme.colors.textSecondary} />
              ) : (
                <ChevronDown size={16} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>

            {isDevSectionOpen && (
              <View style={styles.devContent}>
                <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
                  Seed the local simulation SQLite database with 5,000 doctors, 20,000 shop products, and 10,000 encrypted health records to stress test lists virtualization, search querying, and caching strategies.
                </Text>
                <Button
                  title={isSeeding ? "Seeding Records..." : "Seed 35,000 Scale Records"}
                  onPress={handleSeedLargeData}
                  disabled={isSeeding}
                  style={{ marginTop: 12 }}
                />
                {isSeeding && (
                  <View style={styles.loaderRow}>
                    <ActivityIndicator size="small" color={theme.colors.brand[500]} />
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      Writing batches to local SQLite store...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: theme.colors.border }]}
            onPress={() => handleMenuItemPress('Logout')}
          >
            <LogOut size={18} color={theme.colors.status.error} />
            <Text style={[styles.logoutText, { color: theme.colors.status.error }]}>Sign Out</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerCard: {
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  tagWrapper: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statsCard: {
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuCard: {
    padding: 14,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuItemDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
  },
  syncCard: {
    padding: 14,
    marginBottom: 12,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  syncSubLabel: {
    fontSize: 10,
    marginTop: 2,
    maxWidth: '82%',
  },
  devCard: {
    padding: 12,
    marginBottom: 16,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  devContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 16,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
