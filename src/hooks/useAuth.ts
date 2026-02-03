/**
 * useAuth Hook
 * 
 * Authentication methods for sign in with Google/Apple/Email Magic Link.
 */

import { useState, useCallback } from 'react';
import {
    signOut as firebaseSignOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';

const EMAIL_STORAGE_KEY = '@auth_email_for_sign_in';

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
    sendEmailLink: (email: string) => Promise<boolean>;
    completeEmailSignIn: (url: string, displayName?: string) => Promise<boolean>;
    getStoredEmail: () => Promise<string | null>;
    reloadUser: () => Promise<void>;
    clearError: () => void;
}

/**
 * Map Firebase error codes to user-friendly messages
 */
const getErrorMessage = (code: string): string => {
    if (!code) return 'An error occurred. Please try again.';
    
    switch (code) {
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        case 'auth/invalid-credential':
            return 'Invalid credentials. Please try again.';
        case 'auth/operation-not-allowed':
            return 'Email link sign-in is not enabled. Please contact support.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/invalid-action-code':
            return 'This link has expired or already been used.';
        case 'auth/expired-action-code':
            return 'This link has expired. Please request a new one.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/missing-continue-uri':
            return 'Configuration error. Please contact support.';
        case 'auth/invalid-continue-uri':
            return 'Invalid redirect URL. Please contact support.';
        case 'auth/unauthorized-continue-uri':
            return 'Redirect URL not authorized. Please contact support.';
        default:
            return `An error occurred: ${code}. Please try again.`;
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
            await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
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
     * Send magic link to email for passwordless sign-in
     * Uses Resend API for beautiful email design, falls back to Firebase if API fails
     */
    const sendEmailLink = useCallback(async (email: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sugar-reset.firebaseapp.com';
        const redirectUrl = `https://${authDomain}/auth/email-signin`;

        try {
            // Use Resend API ONLY for beautiful email design
            console.log('📧 Sending magic link via Resend API to:', email);
            
            const response = await fetch('https://www.craveless.info/api/auth/send-magic-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    redirectUrl,
                }),
            });

            // Get response text first to check if it's empty
            const responseText = await response.text();
            console.log('📡 API Response status:', response.status);
            console.log('📡 API Response text:', responseText.substring(0, 500)); // Log first 500 chars

            if (!response.ok) {
                let errorMessage = 'Failed to send email';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorMessage;
                    } else {
                        errorMessage = `Server error (${response.status})`;
                    }
                } catch (e) {
                    errorMessage = responseText || `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            if (!responseText) {
                throw new Error('Empty response from server');
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse JSON response:', e);
                throw new Error('Invalid response from server');
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to send email');
            }

            // Store email locally for when user clicks the link
            await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email);
            console.log('✅ Magic link sent successfully via Resend');
            return true;
        } catch (err: any) {
            console.error('❌ Send email link error:', err);
            console.error('❌ Error code:', err.code);
            console.error('❌ Error message:', err.message);
            
            const errorCode = err.code || 'email-link-failed';
            const errorMessage = getErrorMessage(errorCode);
            
            setError({
                code: errorCode,
                message: errorMessage,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get stored email (for completing sign-in after clicking link)
     */
    const getStoredEmail = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
        } catch {
            return null;
        }
    }, []);

    /**
     * Complete email sign-in after user clicks the magic link
     */
    const completeEmailSignIn = useCallback(async (
        url: string,
        displayName?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if this is a valid sign-in link
            if (!isSignInWithEmailLink(auth, url)) {
                console.log('❌ Not a valid sign-in link');
                setError({
                    code: 'invalid-link',
                    message: 'This is not a valid sign-in link.',
                });
                return false;
            }

            // Get the email from storage
            const email = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
            if (!email) {
                console.log('❌ No email found in storage');
                setError({
                    code: 'no-email',
                    message: 'Please enter your email to complete sign-in.',
                });
                return false;
            }

            console.log('🔐 Completing email sign-in for:', email);

            // Complete sign-in
            const { user } = await signInWithEmailLink(auth, email, url);
            
            // Clear stored email
            await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);

            // Update display name if provided
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            // Create user profile if needed
            const existingProfile = await userService.getUserProfile(user.uid);
            if (!existingProfile) {
                console.log('📝 Creating Firestore profile for email user:', user.uid);
                await userService.createUserProfile(
                    user.uid,
                    user.email || email,
                    displayName
                );
                console.log('✅ Firestore profile created');
            }

            console.log('✅ Email sign-in complete');
            return true;
        } catch (err: any) {
            console.error('❌ Complete email sign-in error:', err);
            setError({
                code: err.code || 'sign-in-failed',
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
        sendEmailLink,
        completeEmailSignIn,
        getStoredEmail,
        clearError,
        reloadUser,
    };
}

export default useAuth;
