/**
 * useInviteLinkHandler Hook
 * 
 * Handles deep links for friend invites.
 * Listens for incoming invite URLs and navigates to friend search with the user ID.
 */

import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function useInviteLinkHandler() {
    const navigation = useNavigation<any>();

    useEffect(() => {
        let isMounted = true;

        const handleUrl = async (url: string) => {
            if (!url || !isMounted) return;

            console.log('📱 Invite deep link received:', url);

            // Check if it's an invite link: craveless://invite/[userId]
            // or https://craveless.info/invite/[userId]
            let userId: string | null = null;

            if (url.startsWith('craveless://invite/')) {
                // Extract userId from deep link
                const match = url.match(/craveless:\/\/invite\/(.+)/);
                if (match && match[1]) {
                    userId = match[1];
                }
            } else if (url.includes('/invite/')) {
                // Extract userId from web URL
                const match = url.match(/\/invite\/([^/?]+)/);
                if (match && match[1]) {
                    userId = match[1];
                }
            }

            if (userId && navigation) {
                console.log('✅ Invite link detected, navigating to friend search with userId:', userId);
                
                // Navigate to Social screen with the invite user ID
                // This will open the friend search modal and show the user
                navigation.navigate('Main', {
                    screen: 'Social',
                    params: {
                        initialTab: 'circle',
                        inviteUserId: userId,
                    },
                });
            }
        };

        // Handle initial URL (app launched from link)
        const checkInitialUrl = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                console.log('📱 Initial URL (invite check):', initialUrl);
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
    }, [navigation]);
}

export default useInviteLinkHandler;

