import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stethoscope, Leaf, ClipboardList, User } from 'lucide-react-native';
import { DoctorListingScreen } from '../../modules/consultation/screens/DoctorListingScreen';
import { ProductListingScreen } from '../../modules/shop/screens/ProductListingScreen';
import { TimelineScreen } from '../../modules/healthRecords/screens/TimelineScreen';
import { UserProfileScreen } from '../../modules/profile/screens/UserProfileScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand[500],
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name={ROUTES.CONSULTATION.ROOT}
        component={DoctorListingScreen}
        options={{
          tabBarLabel: 'Consult',
          tabBarIcon: ({ color, size }) => <Stethoscope size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.SHOP.ROOT}
        component={ProductListingScreen}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => <Leaf size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.HEALTH_RECORDS.ROOT}
        component={TimelineScreen}
        options={{
          tabBarLabel: 'Records',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE.ROOT}
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
