import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { bootstrapApp } from '../../../app/startup';
import { ROUTES } from '../../../app/constants/routes';

export const SplashScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [statusText, setStatusText] = useState('Starting app...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;

    const startBootstrap = async () => {
      await bootstrapApp((status, percentage) => {
        if (active) {
          setStatusText(status);
          setProgress(percentage);
        }
      });

      // Give the user a moment to see the 100% completion before navigating
      setTimeout(() => {
        if (active) {
          navigation.replace(ROUTES.MAIN_TABS);
        }
      }, 400);
    };

    startBootstrap();

    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Decorative Brand Leaf Logo placeholder style */}
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.brand[100] }]}>
          <Text style={[styles.logoText, { color: theme.colors.brand[700] }]}>🌿</Text>
        </View>

        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>
          Ayurvedic Super App
        </Text>
        <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
          Your Personal Holistic Wellness Companion
        </Text>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {statusText}
          </Text>

          {/* Progress Bar Container */}
          <View style={[styles.progressBarOuter, { backgroundColor: theme.colors.border }]}>
            <View 
              style={[
                styles.progressBarInner, 
                { 
                  width: `${progress}%`, 
                  backgroundColor: theme.colors.brand[500] 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressPercentage, { color: theme.colors.textMuted }]}>
            {progress}%
          </Text>
        </View>
      </View>

      <Text style={[styles.footerText, { color: theme.colors.textMuted, paddingBottom: insets.bottom + 16 }]}>
        Secured with SQLite & Local Cache
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  loaderContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarOuter: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
