/**
 * SugarReset - Quit sugar. Built on habit science.
 * 
 * A modern, minimal, science-driven habit app for quitting sugar.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('Google Sign-In native module not available (Expo Go)');
}
import { PostHogProvider } from 'posthog-react-native';
import { AuthProvider } from './src/context/AuthContext';
import { UserDataProvider } from './src/context/UserDataContext';
import { RevenueCatProvider } from './src/context/RevenueCatContext';
import { UserProfileProvider } from './src/context/UserProfileContext';
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
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  // Configure Google Sign-In (only if native module is available)
  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        iosClientId: '68240123690-a3vhmp88g4ng97npdpgkvkbgrspj4hfr.apps.googleusercontent.com',
        offlineAccess: true,
      });
    }
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
        <PostHogProvider
          apiKey="phc_X8ZnTf6o2B7I14EFbCuvH4xlhgLUJe8yu5C8YaZdzVd"
          options={{
            host: 'https://eu.i.posthog.com',
            enableSessionReplay: true,
          }}
          autocapture={false}
        >
          <AuthProvider>
            <RevenueCatProvider>
              <UserDataProvider>
                <UserProfileProvider>
                  <RootNavigator />
                </UserProfileProvider>
              </UserDataProvider>
            </RevenueCatProvider>
          </AuthProvider>
        </PostHogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}