import React, { useEffect } from 'react';
import { Platform, BackHandler } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { VerificationScreen } from '../screens/VerificationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { StudentProfileScreen } from '../screens/StudentProfileScreen';
import { ListingsScreen } from '../screens/ListingsScreen';
import { ListingDetailsScreen } from '../screens/ListingDetailsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ConnectionsScreen } from '../screens/ConnectionsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MapScreen } from '../screens/MapScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { RentCalculatorScreen } from '../screens/RentCalculatorScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminVerificationScreen } from '../screens/AdminVerificationScreen';
import { AdminListingsScreen } from '../screens/AdminListingsScreen';
import { AdminReportsScreen } from '../screens/AdminReportsScreen';

import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

/**
 * Deep linking & Web History Configuration (Bug 3 Fix)
 * Enables HTML5 browser history synchronization on Expo Web
 * so browser Back navigates previous in-app destinations instead of exiting.
 */
const linking = {
  prefixes: [
    'vfa://',
    'https://vfa-flatmate.vercel.app',
    'http://localhost:19006',
    'http://localhost:8081',
  ],
  config: {
    screens: {
      Splash: 'splash',
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ProfileSetup: 'profile-setup',
      Verification: 'verification',
      Home: 'home',
      Discover: 'discover',
      StudentProfile: 'student/:id?',
      Listings: 'listings',
      ListingDetails: 'listing/:listingId?',
      Messages: 'messages',
      Connections: 'connections',
      Chat: 'chat',
      Profile: 'profile',
      Map: 'map',
      Favorites: 'favorites',
      RentCalculator: 'rent-calculator',
      Notifications: 'notifications',
      Safety: 'safety',
      Settings: 'settings',
      AdminDashboard: 'admin',
      AdminUsers: 'admin/users',
      AdminVerification: 'admin/verification',
      AdminListings: 'admin/listings',
      AdminReports: 'admin/reports',
    },
  },
};

export const AppNavigator = () => {
  const { colors } = useTheme();
  const navigationRef = useNavigationContainerRef();

  /**
   * Android Hardware Back Button Handler (Bug 3 Fix)
   * Intercepts Android back press to return to previous in-app screen
   * instead of exiting the app from every screen.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      if (!navigationRef.isReady()) return false;

      // 1. If React Navigation stack has history, go back
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true; // Prevent default app exit
      }

      // 2. If stack cannot go back, check current screen name
      const currentRoute = navigationRef.getCurrentRoute();
      const currentName = currentRoute?.name;

      // Root screens where exiting the app is intended when no history exists
      const rootScreens = ['Home', 'Welcome', 'AdminDashboard', 'Splash'];

      if (currentName && !rootScreens.includes(currentName)) {
        // Return to main Home screen instead of abruptly exiting
        navigationRef.navigate('Home');
        return true;
      }

      // At root screen with no history -> allow Android default behavior (exit app)
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress
    );

    return () => backSubscription.remove();
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="Listings" component={ListingsScreen} />
        <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Connections" component={ConnectionsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="RentCalculator" component={RentCalculatorScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Safety" component={SafetyScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Admin Navigation Routes */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminListings" component={AdminListingsScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
