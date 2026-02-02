/**
 * UserProfileContext
 * 
 * Global context to manage the UserProfilePopup state.
 * Allows any component to open the user profile popup by calling showUserProfile().
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserProfilePopup } from '../components/UserProfilePopup';

interface UserProfileData {
    userId: string;
    displayName: string;
    photoURL?: string | null;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
}

interface UserProfileContextType {
    showUserProfile: (data: UserProfileData) => void;
    hideUserProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);

    const showUserProfile = useCallback((data: UserProfileData) => {
        setProfileData(data);
        setVisible(true);
    }, []);

    const hideUserProfile = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <UserProfileContext.Provider value={{ showUserProfile, hideUserProfile }}>
            {children}
            {profileData && (
                <UserProfilePopup
                    visible={visible}
                    onClose={hideUserProfile}
                    userId={profileData.userId}
                    displayName={profileData.displayName}
                    photoURL={profileData.photoURL}
                    avatarType={profileData.avatarType}
                    avatarValue={profileData.avatarValue}
                />
            )}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
}

export default UserProfileContext;
