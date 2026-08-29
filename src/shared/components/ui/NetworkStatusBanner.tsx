import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../../core/network/networkMonitor';
import { SyncManager } from '../../../core/offline/syncManager';
import { useTheme } from '../../../app/theme/ThemeProvider';

export const NetworkStatusBanner = () => {
  const { isConnected } = useNetworkStatus();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!isConnected) {
      setSyncState('idle');
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Re-connected! Trigger sync
      setSyncState('syncing');
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      SyncManager.processQueue()
        .then(() => {
          setSyncState('success');
          setTimeout(() => {
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              setVisible(false);
              setSyncState('idle');
            });
          }, 3000);
        })
        .catch(() => {
          setSyncState('idle');
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: false,
          }).start(() => setVisible(false));
        });
    }
  }, [isConnected]);

  if (!visible) return null;

  let backgroundColor = theme.colors.status.error;
  let text = "You're offline. You can continue using the app. Your changes will sync automatically.";

  if (isConnected && syncState === 'syncing') {
    backgroundColor = theme.colors.brand[500];
    text = "Syncing your offline changes...";
  } else if (isConnected && syncState === 'success') {
    backgroundColor = '#2E7D32'; // Green success
    text = "Offline changes synced successfully.";
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor,
          paddingTop: insets.top,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

