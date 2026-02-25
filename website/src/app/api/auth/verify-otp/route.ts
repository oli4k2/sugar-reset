import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (prevent re-initialization)
if (!admin.apps.length) {
    try {
        const privateKeyMatch = process.env.FIREBASE_PRIVATE_KEY?.match(/-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/);
        const privateKey = privateKeyMatch
            ? privateKeyMatch[0].replace(/\\n/g, "\n")
            : undefined;

        if (!privateKey) {
            console.error("FIREBASE_PRIVATE_KEY is missing or malformed");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

const db = admin.firestore();

export async function GET() {
    return NextResponse.json({
        message: "Verify OTP API",
        method: "Use POST to verify OTP codes",
        endpoint: "/api/auth/verify-otp",
    });
}

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("Failed to parse request body:", e);
            return NextResponse.json(
                { error: "Invalid request body", success: false },
                { status: 400 }
            );
        }

        const { email, code, displayName } = body;

        if (!email || !code) {
            return NextResponse.json(
                { error: "Email and code are required", success: false },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = code.trim();

        // App Store Reviewer Login: Special email always accepts OTP 555555
        const REVIEWER_EMAIL = 'reviewer@craveless.info';
        const isReviewerEmail = normalizedEmail === REVIEWER_EMAIL;
        const isReviewerCode = normalizedCode === '555555';

        // Look up OTP in Firestore
        const otpRef = db.collection("otp_codes").doc(normalizedEmail);
        const otpDoc = await otpRef.get();

        // For reviewer email with code 555555, skip Firestore check
        if (!otpDoc.exists && !(isReviewerEmail && isReviewerCode)) {
            return NextResponse.json(
                { error: "No verification code found. Please request a new one.", success: false },
                { status: 400 }
            );
        }

        // For reviewer email with code 555555, skip all validation
        if (isReviewerEmail && isReviewerCode) {
            console.log("✅ Reviewer OTP verified (bypassing normal validation)");
        } else {
            const otpData = otpDoc.data()!;

            // Check if already used
            if (otpData.used) {
                return NextResponse.json(
                    { error: "This code has already been used. Please request a new one.", success: false },
                    { status: 400 }
                );
            }

            // Check expiry
            const expiresAt = otpData.expiresAt?.toDate?.() || new Date(0);
            if (Date.now() > expiresAt.getTime()) {
                // Clean up expired code
                await otpRef.delete();
                return NextResponse.json(
                    { error: "This code has expired. Please request a new one.", success: false },
                    { status: 400 }
                );
            }

            // Check attempts
            if (otpData.attempts >= otpData.maxAttempts) {
                await otpRef.delete();
                return NextResponse.json(
                    { error: "Too many incorrect attempts. Please request a new code.", success: false },
                    { status: 429 }
                );
            }

            // Verify code
            if (otpData.code !== normalizedCode) {
                // Increment attempts
                await otpRef.update({
                    attempts: admin.firestore.FieldValue.increment(1),
                });

                const remainingAttempts = otpData.maxAttempts - otpData.attempts - 1;
                return NextResponse.json(
                    {
                        error: `Incorrect code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`,
                        success: false,
                    },
                    { status: 400 }
                );
            }

            // Code is correct! Mark as used
            await otpRef.update({ used: true });
        }

        // Get or create Firebase user
        let uid: string;
        try {
            const existingUser = await admin.auth().getUserByEmail(normalizedEmail);
            uid = existingUser.uid;
            console.log("✅ Found existing user:", uid);
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                // Create new user
                const newUser = await admin.auth().createUser({
                    email: normalizedEmail,
                    emailVerified: true,
                    displayName: displayName || undefined,
                });
                uid = newUser.uid;
                console.log("✅ Created new user:", uid);
            } else {
                throw error;
            }
        }

        // Mark email as verified (in case it wasn't)
        await admin.auth().updateUser(uid, { emailVerified: true });

        // Generate custom token for sign-in
        const customToken = await admin.auth().createCustomToken(uid);

        // Clean up the OTP document (only if it exists)
        if (otpDoc.exists) {
            await otpRef.delete();
        }

        console.log("✅ OTP verified successfully for:", normalizedEmail);

        return NextResponse.json({
            success: true,
            token: customToken,
            uid,
            isNewUser: false, // The app will check Firestore for profile
        });
    } catch (error: any) {
        console.error("Error verifying OTP:", error);
        const errorMessage =
            error?.message || error?.toString() || "Internal Server Error";
        return NextResponse.json(
            { error: errorMessage, success: false },
            { status: 500 }
        );
    }
}
