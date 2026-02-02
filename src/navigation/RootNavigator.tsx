/**
 * Root Navigation Setup for SugarReset
 * 
 * Calm, linear navigation flow with emphasis on habit science.
 */

import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    RootStackParamList,
    AuthStackParamList,
    OnboardingStackParamList,
    MainTabParamList,
} from '../types';
import { colors } from '../theme';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useRevenueCat } from '../hooks/useRevenueCat';

// Onboarding Screens
import {
    WelcomeScreen,
    QuizIntroScreen,
    ComprehensiveQuizScreen,
    SugarScienceScreen,
    SugarestWelcomeScreen,
    SuccessStoriesScreen,
    SugarResetGraphScreen,
    FeatureShowcaseScreen,
    GoalsScreen,
    PlanSelectionScreen,
    PromiseScreen,
    PaywallScreen,
    SymptomsScreen,
} from '../screens/onboarding';

// Auth Screens
import {
    LoginScreen,
    SignUpScreen,
    ForgotPasswordScreen,
    VerificationPendingScreen,
} from '../screens/auth';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import TrackingScreen from '../screens/TrackingScreen';
import PanicScreen from '../screens/PanicScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';

// Support/Modal Screens
import ReasonsScreen from '../screens/ReasonsScreen';
import BreathingExerciseScreen from '../screens/BreathingExerciseScreen';
import JournalScreen from '../screens/JournalScreen';
import InnerCircleScreen from '../screens/InnerCircleScreen';
import EmergencyCallScreen from '../screens/EmergencyCallScreen';
import DistractMeScreen from '../screens/DistractMeScreen';
import AlternativesScreen from '../screens/AlternativesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import HelpScreen from '../screens/HelpScreen';
import DistractionTaskScreen from '../screens/DistractionTaskScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator (swipe not supported with BottomTabNavigator)
function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 250, 245, 0.98)',
                    borderTopColor: 'transparent',
                    borderTopWidth: 0,
                    paddingTop: 6,
                    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
                    height: Platform.OS === 'ios' ? 80 : 60,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarActiveTintColor: '#D97B66',
                tabBarInactiveTintColor: 'rgba(107, 114, 128, 0.7)',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Feather name="home" size={22} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
                    ),
                }}
            />
            <Tab.Screen
                name="Track"
                component={TrackingScreen}
                options={{
                    tabBarLabel: 'Track',
                    tabBarIcon: ({ color, focused }) => (
                        <Feather name="layers" size={22} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
                    ),
                }}
            />
            <Tab.Screen
                name="Panic"
                component={PanicScreen}
                options={{
                    tabBarLabel: '',
                    tabBarStyle: {
                        backgroundColor: 'rgba(255, 250, 245, 0.98)',
                        borderTopColor: 'transparent',
                        borderTopWidth: 0,
                        paddingTop: 6,
                        paddingBottom: Platform.OS === 'ios' ? 22 : 8,
                        height: Platform.OS === 'ios' ? 80 : 60,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                    },
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <View style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: focused ? '#EF4444' : '#D97B66',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#EF4444',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 8,
                                borderWidth: 4,
                                borderColor: '#FFFFFF',
                            }}>
                                <Feather name="heart" size={26} color="#FFFFFF" />
                            </View>
                            <Text style={{
                                fontSize: 7,
                                fontWeight: '600',
                                color: focused ? '#EF4444' : 'rgba(107, 114, 128, 0.7)',
                                marginTop: 4,
                                letterSpacing: -0.5,
                            }}>CRAVING</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{
                    tabBarLabel: 'Analytics',
                    tabBarIcon: ({ color, focused }) => (
                        <Feather name="bar-chart-2" size={22} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
                    ),
                }}
            />

            <Tab.Screen
                name="Social"
                component={SocialScreen}
                options={{
                    tabBarLabel: 'Social',
                    tabBarIcon: ({ color, focused }) => (
                        <Feather name="users" size={22} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// Loading Screen
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
    );
}

// Root Navigation - Shows appropriate flow based on auth state
export default function RootNavigator() {
    const { isLoading: authLoading, isAuthenticated, isUnverified } = useAuthContext();
    const { hasCompletedOnboarding, isLoading: userDataLoading } = useUserData();
    const { isPremium, isLoading: revenueCatLoading } = useRevenueCat();
    
    // IMPORTANT: All hooks must be called before any conditional returns
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    const lastNavigationState = useRef<{ hasCompletedOnboarding: boolean; isAuthenticated: boolean; isPremium: boolean } | null>(null);

    const isLoading = authLoading || userDataLoading || revenueCatLoading;

    // Determine initial route based on auth, onboarding completion, and premium status
    let initialRouteName: 'Main' | 'Onboarding' | 'Auth' = 'Onboarding';
    
    if (!isLoading) {
        // Debug: Log all navigation state
        console.log('🧭 Navigation State:', {
            isAuthenticated,
            hasCompletedOnboarding,
            isPremium,
            authLoading,
            userDataLoading,
            revenueCatLoading,
        });
        
        if (hasCompletedOnboarding && !isAuthenticated) {
            // Onboarding complete but user needs to authenticate
            initialRouteName = 'Auth';
            console.log('ℹ️ Navigation: Onboarding complete but not authenticated → Auth');
        } else if (isAuthenticated && hasCompletedOnboarding) {
            // User is authenticated and completed onboarding - let them into the app
            initialRouteName = 'Main';
            console.log('✅ Navigation: User authenticated and onboarding complete → Main', {
                isPremium,
            });
        } else {
            console.log('ℹ️ Navigation: Showing onboarding flow', {
                isAuthenticated,
                hasCompletedOnboarding,
                isPremium,
            });
        }
    }

    // Handle navigation when state changes (not just on initial mount)
    // Only navigate if state actually changed and we're not already on the correct screen
    // IMPORTANT: This useEffect must be called before any conditional returns
    useEffect(() => {
        // Don't navigate while loading or if unverified
        if (isLoading || isUnverified) return;
        if (!navigationRef.current) return;
        
        const currentState = { hasCompletedOnboarding, isAuthenticated, isPremium };
        
        // Skip if state hasn't changed
        if (lastNavigationState.current &&
            lastNavigationState.current.hasCompletedOnboarding === currentState.hasCompletedOnboarding &&
            lastNavigationState.current.isAuthenticated === currentState.isAuthenticated &&
            lastNavigationState.current.isPremium === currentState.isPremium) {
            return;
        }
        
        lastNavigationState.current = currentState;
        
        const currentRoute = navigationRef.current.getCurrentRoute();
        const currentRouteName = currentRoute?.name;

        // If authenticated and completed onboarding, go to Main (regardless of premium)
        // Premium users get full access, non-premium can access paywall from Main
        if (isAuthenticated && hasCompletedOnboarding) {
            if (currentRouteName !== 'Main' && currentRouteName !== 'Paywall') {
                console.log('🔄 Navigating to Main (authenticated and onboarding complete)', {
                    isPremium,
                });
                navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            }
        }
        // If onboarding complete but not authenticated, navigate to Auth
        // But only if we're not already on Auth or Paywall (let Paywall handle its own navigation)
        else if (hasCompletedOnboarding && !isAuthenticated) {
            if (currentRouteName !== 'Auth' && currentRouteName !== 'Paywall') {
                console.log('🔄 Navigating to Auth (onboarding complete, not authenticated)');
                navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
                });
            }
        }
        // Otherwise, stay where we are - don't force navigation
    }, [hasCompletedOnboarding, isAuthenticated, isPremium, isLoading, isUnverified]);

    // Early returns AFTER all hooks
    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isUnverified) {
        return (
            <NavigationContainer>
                <RootStack.Navigator screenOptions={{ headerShown: false }}>
                    <RootStack.Screen name="VerificationPending" component={VerificationPendingScreen} />
                </RootStack.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <RootStack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
                initialRouteName={initialRouteName}
            >
                {/* Onboarding Flow */}
                <RootStack.Screen name="Onboarding">
                    {() => (
                        <OnboardingStack.Navigator
                            screenOptions={{
                                headerShown: false,
                                animation: 'fade',
                            }}
                        >
                            {/* Phase 1: Quiz */}
                            <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
                            <OnboardingStack.Screen name="QuizIntro" component={QuizIntroScreen} />
                            <OnboardingStack.Screen name="ComprehensiveQuiz" component={ComprehensiveQuizScreen} />
                            <OnboardingStack.Screen name="Symptoms" component={SymptomsScreen} />

                            {/* Phase 2: Education & Social Proof */}
                            <OnboardingStack.Screen name="SugarDangers" component={SugarScienceScreen} />
                            <OnboardingStack.Screen name="SugarestWelcome" component={SugarestWelcomeScreen} />
                            <OnboardingStack.Screen name="FeatureShowcase" component={FeatureShowcaseScreen} />
                            <OnboardingStack.Screen name="SuccessStories" component={SuccessStoriesScreen} />
                            <OnboardingStack.Screen name="SugarResetGraph" component={SugarResetGraphScreen} />

                            {/* Phase 3: Commitment */}
                            <OnboardingStack.Screen name="Goals" component={GoalsScreen} />
                            <OnboardingStack.Screen name="PlanSelection" component={PlanSelectionScreen} />
                            <OnboardingStack.Screen name="Promise" component={PromiseScreen} />
                            <OnboardingStack.Screen name="Paywall" component={PaywallScreen} />
                        </OnboardingStack.Navigator>
                    )}
                </RootStack.Screen>

                {/* Auth Flow */}
                <RootStack.Screen name="Auth">
                    {() => (
                        <AuthStack.Navigator
                            screenOptions={{
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        >
                            <AuthStack.Screen name="Login" component={LoginScreen} />
                            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
                            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        </AuthStack.Navigator>
                    )}
                </RootStack.Screen>

                {/* Main App */}
                <RootStack.Screen name="Main" component={MainTabNavigator} />

                {/* Support Screens (accessible from any tab) */}
                <RootStack.Screen
                    name="Reasons"
                    component={ReasonsScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="BreathingExercise"
                    component={BreathingExerciseScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="Journal"
                    component={JournalScreen}
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                    }}
                />
                <RootStack.Screen
                    name="InnerCircle"
                    component={InnerCircleScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="EmergencyCall"
                    component={EmergencyCallScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="DistractMe"
                    component={DistractMeScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="DistractionTask"
                    component={DistractionTaskScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="Alternatives"
                    component={AlternativesScreen}
                    options={{
                        presentation: 'fullScreenModal',
                        animation: 'fade',
                    }}
                />
                <RootStack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                        headerShown: true,
                        headerTitle: '',
                        headerTransparent: true,
                        headerTintColor: colors.text.primary,
                    }}
                />
                <RootStack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicyScreen}
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                        headerShown: false,
                    }}
                />
                <RootStack.Screen
                    name="TermsOfService"
                    component={TermsOfServiceScreen}
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                        headerShown: false,
                    }}
                />
                <RootStack.Screen
                    name="Help"
                    component={HelpScreen}
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                        headerShown: false,
                    }}
                />
                <RootStack.Screen
                    name="PostDetail"
                    component={PostDetailScreen}
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                        headerShown: false,
                    }}
                />
            </RootStack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
    },
    tabIcon: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiText: {
        fontSize: 20,
    },
});
