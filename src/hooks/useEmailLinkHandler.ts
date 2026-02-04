/**
 * useEmailLinkHandler Hook
 * 
 * Handles deep links for email magic link authentication.
 * Listens for incoming URLs and completes sign-in when a valid link is detected.
 */

import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from './useAuth';

interface EmailLinkHandlerState {
    isProcessing: boolean;
    error: string | null;
}

export function useEmailLinkHandler(): EmailLinkHandlerState {
    const { completeEmailSignIn, getStoredEmail } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const handleUrl = async (url: string) => {
            if (!url || !isMounted) return;

            console.log('📱 Deep link received:', url);

            // Extract the Firebase URL from the deep link
            // Can be either:
            // 1. Direct Firebase URL: https://sugar-reset.firebaseapp.com/auth/email-signin?...
            // 2. App deep link with encoded URL: craveless://auth/email-signin?url=ENCODED_URL
            // 3. Web URL opened in app (universal link): https://sugar-reset.firebaseapp.com/auth/email-signin?...
            let firebaseUrl = url;
            
            // Check if it's already a Firebase URL (web URL opened directly in app)
            if (url.startsWith('https://') && url.includes('firebaseapp.com') && url.includes('/auth/email-signin')) {
                firebaseUrl = url;
                console.log('🔗 Direct Firebase URL detected:', firebaseUrl);
            } else if (url.startsWith('craveless://')) {
                try {
                    // Parse the deep link: craveless://auth/email-signin?url=ENCODED_URL
                    const match = url.match(/craveless:\/\/auth\/email-signin\?url=(.+)/);
                    if (match && match[1]) {
                        firebaseUrl = decodeURIComponent(match[1]);
                        console.log('🔗 Extracted Firebase URL from deep link:', firebaseUrl);
                    } else {
                        // Try to extract query params directly from deep link
                        const urlMatch = url.match(/craveless:\/\/auth\/email-signin\?(.+)/);
                        if (urlMatch && urlMatch[1]) {
                            // If it's just query params, construct the Firebase URL
                            const params = urlMatch[1];
                            const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sugar-reset.firebaseapp.com';
                            firebaseUrl = `https://${authDomain}/auth/email-signin?${params}`;
                            console.log('🔗 Constructed Firebase URL from deep link params:', firebaseUrl);
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Could not parse deep link URL:', e);
                }
            }

            console.log('🔍 Checking if URL is valid Firebase sign-in link:', firebaseUrl);
            
            // Check if this is a Firebase email sign-in link
            if (isSignInWithEmailLink(auth, firebaseUrl)) {
                console.log('🔐 Valid email sign-in link detected');
                
                if (!isMounted) return;
                setIsProcessing(true);
                setError(null);

                try {
                    const email = await getStoredEmail();
                    
                    if (!email) {
                        console.log('⚠️ No stored email found');
                        if (isMounted) {
                            setError('Please enter your email to complete sign-in.');
                        }
                        return;
                    }

                    const success = await completeEmailSignIn(firebaseUrl);
                    
                    if (success) {
                        console.log('✅ Email sign-in completed successfully');
                    } else if (isMounted) {
                        setError('Failed to complete sign-in. The link may have expired.');
                    }
                } catch (err: any) {
                    console.error('❌ Email sign-in error:', err);
                    if (isMounted) {
                        setError(err.message || 'Sign-in failed. Please try again.');
                    }
                } finally {
                    if (isMounted) {
                        setIsProcessing(false);
                    }
                }
            } else {
                console.log('⚠️ URL is not a valid Firebase email sign-in link:', firebaseUrl);
            }
        };

        // Handle initial URL (app launched from link)
        const checkInitialUrl = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                console.log('📱 Initial URL:', initialUrl);
                await handleUrl(initialUrl);
            }
        };

        // Handle URL when app is already open
        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        checkInitialUrl();

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, [completeEmailSignIn, getStoredEmail]);

    return { isProcessing, error };
}

export default useEmailLinkHandler;

