/**
 * Referral Service
 * 
 * Tracks user referrals for the "Invite 3 friends = Premium" feature.
 * 
 * Flow:
 * 1. User generates unique referral code (based on their UID)
 * 2. User shares link with referral code
 * 3. When new user signs up with referral code, both are credited
 * 4. After 3 successful referrals, user gets premium access
 */

import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    increment,
    serverTimestamp,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ReferralData {
    referralCode: string;
    referredBy?: string; // UID of user who referred them
    referralCount: number; // Number of successful referrals
    referredUsers: string[]; // UIDs of users they've referred
    earnedPremiumFromReferrals: boolean;
    createdAt: any;
    updatedAt: any;
}

const REFERRALS_REQUIRED_FOR_PREMIUM = 3;

class ReferralService {
    private readonly collectionName = 'referrals';

    /**
     * Generate a unique referral code for a user
     * Format: First 8 chars of UID (easy to share)
     */
    generateReferralCode(userId: string): string {
        // Take first 8 chars of UID and make it URL-safe
        return userId.substring(0, 8).toUpperCase();
    }

    /**
     * Get or create referral data for a user
     */
    async getOrCreateReferralData(userId: string): Promise<ReferralData> {
        try {
            const docRef = doc(db, this.collectionName, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as ReferralData;
            }

            // Create new referral data
            const referralCode = this.generateReferralCode(userId);
            const newData: ReferralData = {
                referralCode,
                referralCount: 0,
                referredUsers: [],
                earnedPremiumFromReferrals: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(docRef, newData);
            return newData;
        } catch (error) {
            console.error('❌ Error getting/creating referral data:', error);
            throw error;
        }
    }

    /**
     * Get user's referral code
     */
    async getReferralCode(userId: string): Promise<string> {
        const data = await this.getOrCreateReferralData(userId);
        return data.referralCode;
    }

    /**
     * Get the shareable referral link
     */
    async getReferralLink(userId: string): Promise<string> {
        const code = await this.getReferralCode(userId);
        // Use your app's deep link or website URL
        return `https://craveless.info/invite?ref=${code}`;
    }

    /**
     * Find user by referral code
     */
    async findUserByReferralCode(referralCode: string): Promise<string | null> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('referralCode', '==', referralCode.toUpperCase())
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].id; // Return the user ID
            }
            return null;
        } catch (error) {
            console.error('❌ Error finding user by referral code:', error);
            return null;
        }
    }

    /**
     * Process a referral when a new user signs up
     * Call this after user account creation with the referral code they used
     */
    async processReferral(newUserId: string, referralCode: string): Promise<{
        success: boolean;
        referrerEarnedPremium?: boolean;
        message: string;
    }> {
        try {
            if (!referralCode) {
                return { success: false, message: 'No referral code provided' };
            }

            // Find the referrer
            const referrerId = await this.findUserByReferralCode(referralCode);
            if (!referrerId) {
                return { success: false, message: 'Invalid referral code' };
            }

            // Make sure user isn't referring themselves
            if (referrerId === newUserId) {
                return { success: false, message: 'Cannot refer yourself' };
            }

            // Check if this user was already referred
            const newUserData = await this.getOrCreateReferralData(newUserId);
            if (newUserData.referredBy) {
                return { success: false, message: 'User already has a referrer' };
            }

            // Update the new user's data to show who referred them
            await updateDoc(doc(db, this.collectionName, newUserId), {
                referredBy: referrerId,
                updatedAt: serverTimestamp(),
            });

            // Update the referrer's data
            const referrerRef = doc(db, this.collectionName, referrerId);
            await updateDoc(referrerRef, {
                referralCount: increment(1),
                referredUsers: arrayUnion(newUserId),
                updatedAt: serverTimestamp(),
            });

            // Check if referrer has earned premium
            const referrerData = await this.getOrCreateReferralData(referrerId);
            const earnedPremium = referrerData.referralCount >= REFERRALS_REQUIRED_FOR_PREMIUM - 1; // -1 because we just incremented

            if (earnedPremium && !referrerData.earnedPremiumFromReferrals) {
                // Mark that they've earned premium
                await updateDoc(referrerRef, {
                    earnedPremiumFromReferrals: true,
                    updatedAt: serverTimestamp(),
                });

                // TODO: Grant premium access in RevenueCat
                // This would typically involve calling your backend to grant
                // a promotional entitlement
                console.log('🎉 User earned premium through referrals:', referrerId);
            }

            return {
                success: true,
                referrerEarnedPremium: earnedPremium,
                message: 'Referral processed successfully',
            };
        } catch (error) {
            console.error('❌ Error processing referral:', error);
            return { success: false, message: 'Failed to process referral' };
        }
    }

    /**
     * Get referral stats for a user
     */
    async getReferralStats(userId: string): Promise<{
        referralCode: string;
        referralLink: string;
        referralCount: number;
        referralsNeeded: number;
        hasEarnedPremium: boolean;
        progress: number; // 0-1
    }> {
        const data = await this.getOrCreateReferralData(userId);
        const referralLink = await this.getReferralLink(userId);

        return {
            referralCode: data.referralCode,
            referralLink,
            referralCount: data.referralCount,
            referralsNeeded: Math.max(0, REFERRALS_REQUIRED_FOR_PREMIUM - data.referralCount),
            hasEarnedPremium: data.earnedPremiumFromReferrals,
            progress: Math.min(1, data.referralCount / REFERRALS_REQUIRED_FOR_PREMIUM),
        };
    }

    /**
     * Check if user has earned premium through referrals
     */
    async hasEarnedPremiumThroughReferrals(userId: string): Promise<boolean> {
        try {
            const data = await this.getOrCreateReferralData(userId);
            return data.earnedPremiumFromReferrals || data.referralCount >= REFERRALS_REQUIRED_FOR_PREMIUM;
        } catch (error) {
            console.error('❌ Error checking referral premium:', error);
            return false;
        }
    }
}

export const referralService = new ReferralService();
export default referralService;
