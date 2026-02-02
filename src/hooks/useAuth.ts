/**
 * useAuth Hook
 * 
 * Authentication methods for sign in, sign up, and sign out.
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
    signInWithPhoneNumber: (phoneNumber: string) => Promise<string>; // Returns verification ID
    verifyOTP: (verificationId: string, code: string) => Promise<boolean>;
    signOut: () => Promise<void>;
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
     * Sign in with phone number (sends OTP)
     * Returns verification ID to be used with verifyOTP
     * 
     * NOTE: This requires Firebase Phone Auth to be enabled in Firebase Console
     * and may require additional setup for React Native/Expo
     */
    const signInWithPhoneNumber = useCallback(async (phoneNumber: string): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            // Format phone number (ensure it starts with +)
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
            
            // For React Native/Expo, we need to use a different approach
            // Firebase Phone Auth in React Native requires react-native-firebase or expo-firebase
            // For now, we'll use a placeholder that needs to be implemented with the correct library
            
            // TODO: Implement with react-native-firebase or expo-firebase
            // Example:
            // const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
            // return confirmation.verificationId;
            
            throw new Error('Phone authentication not yet implemented. Please use Google or Apple sign-in.');
        } catch (err: any) {
            setIsLoading(false);
            setError({
                code: err.code || 'phone-auth-not-implemented',
                message: err.message || getErrorMessage(err.code),
            });
            throw err;
        }
    }, []);

    /**
     * Verify OTP code
     */
    const verifyOTP = useCallback(async (
        verificationId: string,
        code: string,
        displayName?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // TODO: Implement with react-native-firebase or expo-firebase
            // Example:
            // const credential = auth.PhoneAuthProvider.credential(verificationId, code);
            // const { user } = await auth().signInWithCredential(credential);
            
            throw new Error('OTP verification not yet implemented.');
        } catch (err: any) {
            setIsLoading(false);
            setError({
                code: err.code || 'otp-verification-not-implemented',
                message: err.message || getErrorMessage(err.code),
            });
            return false;
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
                const errorMessage = typeof data.error === 'object'
                    ? JSON.stringify(data.error)
                    : data.error || 'Failed to send email';
                throw new Error(errorMessage);
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
        signInWithPhoneNumber,
        verifyOTP,
        signOut,
        signInWithGoogle,
        signInWithApple,
        clearError,
        sendVerificationEmail,
        reloadUser,
    };
}

export default useAuth;
