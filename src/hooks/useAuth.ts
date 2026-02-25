/**
 * useAuth Hook
 * 
 * Authentication methods for sign in with Google/Apple/Email OTP.
 */

import { useState, useCallback } from 'react';
import {
    signOut as firebaseSignOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
    signInWithCustomToken,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';

const EMAIL_STORAGE_KEY = '@auth_email_for_sign_in';
const API_BASE_URL = 'https://www.craveless.info';

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
    sendOTP: (email: string) => Promise<boolean>;
    verifyOTP: (email: string, code: string, displayName?: string) => Promise<boolean>;
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
            return 'This sign-in method is not enabled. Please contact support.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/invalid-custom-token':
            return 'Authentication failed. Please try again.';
        case 'auth/custom-token-mismatch':
            return 'Authentication misconfigured. Please contact support.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'otp-send-failed':
            return 'Failed to send verification code. Please try again.';
        case 'otp-verify-failed':
            return 'Failed to verify code. Please try again.';
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
     * Send OTP code to email for verification
     * Uses Resend API via the Vercel backend
     */
    const sendOTP = useCallback(async (email: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('📧 Sending OTP to:', email);

            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                }),
            });

            const responseText = await response.text();
            console.log('📡 API Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Failed to send verification code';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorMessage;
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
                throw new Error('Invalid response from server');
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to send verification code');
            }

            // Store email locally for the verification step
            await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
            console.log('✅ OTP sent successfully');
            return true;
        } catch (err: any) {
            // Only log errors in development, not production
            if (__DEV__) {
                console.error('❌ Send OTP error:', err.message);
            }

            setError({
                code: err.code || 'otp-send-failed',
                message: err.message || getErrorMessage('otp-send-failed'),
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Verify OTP code and sign in
     * The backend validates the code and returns a Firebase custom token
     */
    const verifyOTP = useCallback(async (
        email: string,
        code: string,
        displayName?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('🔐 Verifying OTP for:', email);

            const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code: code.trim(),
                    displayName,
                }),
            });

            const responseText = await response.text();
            console.log('📡 Verify API Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Failed to verify code';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorMessage;
                    }
                } catch (e) {
                    errorMessage = responseText || `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            if (!result.success || !result.token) {
                throw new Error(result.error || 'Verification failed');
            }

            // Sign in with the custom token
            console.log('🔑 Signing in with custom token...');
            const { user } = await signInWithCustomToken(auth, result.token);

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

            // Clear stored email
            await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);

            console.log('✅ OTP verification and sign-in complete');
            return true;
        } catch (err: any) {
            // Only log errors in development, not production
            if (__DEV__) {
                console.error('❌ Verify OTP error:', err.message);
            }

            // Extract user-friendly error message
            let errorMessage = err.message || getErrorMessage('otp-verify-failed');
            
            // For reviewer email, provide a more helpful message if verification fails
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail === 'reviewer@craveless.info' && errorMessage.includes('Incorrect code')) {
                errorMessage = 'Reviewer login failed. Please ensure you are using code 555555.';
            }

            setError({
                code: err.code || 'otp-verify-failed',
                message: errorMessage,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get stored email (for resuming verification)
     */
    const getStoredEmail = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
        } catch {
            return null;
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
        sendOTP,
        verifyOTP,
        getStoredEmail,
        clearError,
        reloadUser,
    };
}

export default useAuth;
