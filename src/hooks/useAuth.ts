/**
 * useAuth Hook
 * 
 * Authentication methods for sign in, sign up, and sign out.
 */

import { useState, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
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
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;
    signInWithGoogle: (idToken: string) => Promise<boolean>;
    signInWithApple: (identityToken: string, nonce: string) => Promise<boolean>;
    sendVerificationEmail: () => Promise<boolean>;
    reloadUser: () => Promise<void>;
    clearError: () => void;
}

/**
 * Map Firebase error codes to user-friendly messages
 */
const getErrorMessage = (code: string): string => {
    switch (code) {
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
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
     * Sign in with email and password
     */
    const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
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
     * Sign up with email and password
     */
    const signUp = useCallback(async (
        email: string,
        password: string,
        displayName?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name if provided
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            // Create user profile in Firestore
            await userService.createUserProfile(user.uid, email, displayName);

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
     * Send password reset email
     */
    const resetPassword = useCallback(async (email: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await sendPasswordResetEmail(auth, email);
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
                await userService.createUserProfile(
                    user.uid,
                    user.email || '',
                    user.displayName || undefined
                );
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
                await userService.createUserProfile(
                    user.uid,
                    user.email || '',
                    user.displayName || undefined
                );
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

    /**
     * Send verification email via website API
     */
    const sendVerificationEmail = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            console.log('Fetching ID token for user:', user.uid);
            const idToken = await user.getIdToken(true);
            console.log('ID Token fetched, length:', idToken?.length);

            // Call website API
            const response = await fetch('https://www.craveless.info/api/auth/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send email');
            }

            return true;
        } catch (err: any) {
            console.error('Send verification error:', err);
            setError({
                code: 'verification-failed',
                message: err.message || 'Failed to send verification email',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        signInWithApple,
        clearError,
        sendVerificationEmail,
        reloadUser,
    };
}

export default useAuth;
