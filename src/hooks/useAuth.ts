/**
 * useAuth Hook
 * 
 * Authentication methods for sign in with Google/Apple.
 * No password authentication - social sign-in only.
 */

import { useState, useCallback } from 'react';
import {
    signOut as firebaseSignOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';

interface AuthError {
    code: string;
    message: string;
}

interface UseAuthReturn {
    isLoading: boolean;
    error: AuthError | null;
    signOut: () => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<boolean>;
    signInWithApple: (identityToken: string, nonce: string) => Promise<boolean>;
    reloadUser: () => Promise<void>;
    clearError: () => void;
}

/**
 * Map Firebase error codes to user-friendly messages
 */
const getErrorMessage = (code: string): string => {
    switch (code) {
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        case 'auth/invalid-credential':
            return 'Invalid credentials. Please try again.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
};

export function useAuth(): UseAuthReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Sign out
     */
    const signOut = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
        } catch (err: any) {
            setError({
                code: err.code,
                message: getErrorMessage(err.code),
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Sign in with Google (using ID token from Google Sign-In)
     */
    const signInWithGoogle = useCallback(async (idToken: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const { user } = await signInWithCredential(auth, credential);

            // Check if user profile exists, create if not
            const existingProfile = await userService.getUserProfile(user.uid);
            if (!existingProfile) {
                console.log('📝 Creating Firestore profile for Google user:', user.uid);
                const newProfile = await userService.createUserProfile(
                    user.uid,
                    user.email || '',
                    user.displayName || undefined
                );
                if (newProfile) {
                    console.log('✅ Firestore profile created for Google user');
                } else {
                    console.warn('⚠️ Failed to create Firestore profile for Google user');
                }
            } else {
                console.log('✅ Firestore profile already exists for Google user');
            }

            return true;
        } catch (err: any) {
            setError({
                code: err.code,
                message: getErrorMessage(err.code),
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Sign in with Apple
     */
    const signInWithApple = useCallback(async (
        identityToken: string,
        nonce: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: identityToken,
                rawNonce: nonce,
            });
            const { user } = await signInWithCredential(auth, credential);

            // Check if user profile exists, create if not
            const existingProfile = await userService.getUserProfile(user.uid);
            if (!existingProfile) {
                console.log('📝 Creating Firestore profile for Apple user:', user.uid);
                const newProfile = await userService.createUserProfile(
                    user.uid,
                    user.email || '',
                    user.displayName || undefined
                );
                if (newProfile) {
                    console.log('✅ Firestore profile created for Apple user');
                } else {
                    console.warn('⚠️ Failed to create Firestore profile for Apple user');
                }
            } else {
                console.log('✅ Firestore profile already exists for Apple user');
            }

            return true;
        } catch (err: any) {
            setError({
                code: err.code,
                message: getErrorMessage(err.code),
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reload user to refresh token and verification status
     */
    const reloadUser = useCallback(async (): Promise<void> => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
        }
    }, []);

    return {
        isLoading,
        error,
        signOut,
        signInWithGoogle,
        signInWithApple,
        clearError,
        reloadUser,
    };
}

export default useAuth;
