/**
 * SugarReset - Quit sugar. Built on habit science.
 * 
 * A modern, minimal, science-driven habit app for quitting sugar.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthProvider } from './src/context/AuthContext';
import { UserDataProvider } from './src/context/UserDataContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      offlineAccess: true,
    });
  }, []);

  if (!fontsLoaded) {
    return null; // Keep splash screen visible or show loading
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background.primary}
        />
        <AuthProvider>
          <UserDataProvider>
            <RootNavigator />
          </UserDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

