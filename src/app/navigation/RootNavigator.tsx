import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { DoctorDetailsScreen } from '../../modules/consultation/screens/DoctorDetailsScreen';
import { SlotSelectionScreen } from '../../modules/consultation/screens/SlotSelectionScreen';
import { BookingSummaryScreen } from '../../modules/consultation/screens/BookingSummaryScreen';
import { BookingSuccessScreen } from '../../modules/consultation/screens/BookingSuccessScreen';
import { UpcomingConsultationsScreen } from '../../modules/consultation/screens/UpcomingConsultationsScreen';
import { CartScreen } from '../../modules/shop/screens/CartScreen';
import { RecordDetailsScreen } from '../../modules/healthRecords/screens/RecordDetailsScreen';
import { OfflineQueueScreen } from '../../modules/profile/screens/OfflineQueueScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name={ROUTES.MAIN_TABS}
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CONSULTATION.DOCTOR_DETAILS}
        component={DoctorDetailsScreen}
        options={{ title: 'Doctor Profile' }}
      />
      <Stack.Screen
        name={ROUTES.CONSULTATION.SLOT_SELECTION}
        component={SlotSelectionScreen}
        options={{ title: 'Select Time Slot' }}
      />
      <Stack.Screen
        name={ROUTES.CONSULTATION.BOOKING_SUMMARY}
        component={BookingSummaryScreen}
        options={{ title: 'Confirm Booking' }}
      />
      <Stack.Screen
        name={ROUTES.CONSULTATION.BOOKING_SUCCESS}
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CONSULTATION.UPCOMING_CONSULTATIONS}
        component={UpcomingConsultationsScreen}
        options={{ title: 'My Appointments' }}
      />
      <Stack.Screen
        name={ROUTES.SHOP.CART}
        component={CartScreen}
        options={{ title: 'My Cart' }}
      />
      <Stack.Screen
        name={ROUTES.HEALTH_RECORDS.RECORD_DETAILS}
        component={RecordDetailsScreen}
        options={{ title: 'Health Record Details' }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE.OFFLINE_QUEUE}
        component={OfflineQueueScreen}
        options={{ title: 'Offline Mutation Queue' }}
      />
    </Stack.Navigator>
  );
};
