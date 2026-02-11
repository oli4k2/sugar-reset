/**
 * Authentication Context
 * 
 * Provides global auth state and methods throughout the app.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, isFirebaseReady } from '../config/firebase';
import { User } from '../types';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { usePostHog } from 'posthog-react-native';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isUnverified: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    isLoading: true,
    isAuthenticated: false,
    isUnverified: false,
    refreshUser: async () => { },
});

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const posthog = usePostHog();

    useEffect(() => {
        if (firebaseUser && posthog) {
            posthog.identify(firebaseUser.uid, {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
            });
        } else if (!firebaseUser && posthog) {
            posthog.reset();
        }
    }, [firebaseUser, posthog]);

    useEffect(() => {
        console.log('🔄 Setting up auth state listener...');
        let isMounted = true;

        // Helper to create local user from Firebase Auth
        const createLocalUser = (fbUser: FirebaseUser): User => ({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'User',
            photoURL: fbUser.photoURL || undefined,
            avatarType: null,
            avatarValue: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
                notifications: true,
                theme: 'dark',
            },
            streak: {
                currentStreak: 0,
                longestStreak: 0,
                lastCheckIn: null,
                startDate: new Date(),
                totalDaysSugarFree: 0,
            },
        });

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (!isMounted) return;

            console.log('👤 Auth state changed:', fbUser ? `User: ${fbUser.uid} (${fbUser.email || 'no email'})` : 'No user');
            console.log('👤 Auth state details:', {
                hasUser: !!fbUser,
                uid: fbUser?.uid,
                email: fbUser?.email,
                emailVerified: fbUser?.emailVerified,
                providerId: fbUser?.providerData?.[0]?.providerId,
                providers: fbUser?.providerData?.map(p => p?.providerId),
            });

            setFirebaseUser(fbUser);

            if (fbUser) {
                // Set local user immediately so app can proceed
                const localUser = createLocalUser(fbUser);

                // Try to fetch profile with a short timeout - don't block the app
                const fetchWithTimeout = async (): Promise<User> => {
                    try {
                        const profile = await Promise.race([
                            userService.getUserProfile(fbUser.uid, 0), // No retries - fast fail
                            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
                        ]);

                        if (profile) {
                            // Ensure photoURL from Auth is available
                            if (!profile.photoURL && fbUser.photoURL) {
                                profile.photoURL = fbUser.photoURL;
                            }
                            console.log('✅ User profile loaded from Firestore');
                            return profile;
                        }
                    } catch (e) {
                        console.log('📴 Could not fetch profile, using local data');
                    }
                    return localUser;
                };

                const finalUser = await fetchWithTimeout();
                if (isMounted) {
                    setUser(finalUser);
                    setIsLoading(false);
                    console.log('✅ Auth loading complete');
                }

                // Register for push notifications (don't block on this)
                notificationService.registerForPushNotifications(fbUser.uid)
                    .then(token => token && console.log('Push notifications registered'))
                    .catch(() => { });
            } else {
                setUser(null);
                setIsLoading(false);
                console.log('✅ Auth loading complete (no user)');
            }
        });

        // Safety timeout - if nothing happens in 5 seconds, just proceed
        const safetyTimeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.log('⏰ Safety timeout - proceeding without waiting');
                setIsLoading(false);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
            unsubscribe();
        };
    }, []);

    // For OAuth (Google/Apple), users are always verified - no email verification needed
    const isUnverified = false;

    // User is authenticated if they have a Firebase user
    // OAuth users (Google/Apple) are automatically verified
    const isAuthenticated = !!firebaseUser;

    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            try {
                const profile = await userService.getUserProfile(auth.currentUser.uid);
                if (profile) {
                    if (!profile.photoURL && auth.currentUser.photoURL) {
                        profile.photoURL = auth.currentUser.photoURL;
                    }
                    setUser(profile);
                    console.log('✅ User profile refreshed');
                }
            } catch (error) {
                console.warn('⚠️ Failed to refresh user profile:', error);
            }
        }
    };

    const value: AuthContextType = {
        user,
        firebaseUser,
        isLoading,
        isAuthenticated,
        isUnverified,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
