import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Button } from '../../../shared/components/ui/Button';
import { ROUTES } from '../../../app/constants/routes';

export const BookingSuccessScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <CheckCircle2 size={72} color={theme.colors.brand[500]} style={{ marginBottom: 20 }} />
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Consultation Booked!</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Your slot has been reserved. You can view your appointment details under Upcoming Consultations.
      </Text>

      <Button
        title="View Upcoming Consultations"
        onPress={() => navigation.navigate(ROUTES.CONSULTATION.UPCOMING_CONSULTATIONS)}
        style={styles.btn}
      />
      
      <Button
        title="Back to Home"
        variant="ghost"
        onPress={() => navigation.navigate(ROUTES.MAIN_TABS)}
        style={[styles.btn, { marginTop: 8 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    width: '100%',
  },
});
