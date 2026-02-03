import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("Failed to parse request body:", e);
            return NextResponse.json({ error: "Invalid request body", success: false }, { status: 400 });
        }

        const { email, redirectUrl } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required", success: false }, { status: 400 });
        }

        // Generate Firebase sign-in link using Admin SDK
        const finalRedirectUrl = redirectUrl || `https://${process.env.FIREBASE_AUTH_DOMAIN || 'sugar-reset.firebaseapp.com'}/auth/email-signin`;
        
        const actionCodeSettings = {
            url: finalRedirectUrl,
            handleCodeInApp: true,
        };

        // Use generateSignInWithEmailLink from Firebase Admin
        const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

        // Send email via Resend with simple, clean design (matching verification email style)
        const { data, error: resendError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Craveless <auth@craveless.info>",
            to: email,
            subject: "Verify your email for Craveless",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E8A87C;">Welcome to Craveless!</h1>
          <p>Please click the link below to verify your email address and start your journey.</p>
          <a href="${link}" style="display: inline-block; background-color: #E8A87C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; margin: 16px 0;">Verify Email</a>
          <p style="color: #666; font-size: 14px;">If you didn't request this email, you can ignore it.</p>
        </div>
      `,
        });

        if (resendError) {
            console.error("Resend error:", resendError);
            return NextResponse.json({ 
                error: typeof resendError === 'string' ? resendError : 'Failed to send email via Resend',
                success: false 
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error sending magic link email:", error);
        const errorMessage = error?.message || error?.toString() || "Internal Server Error";
        return NextResponse.json(
            { error: errorMessage, success: false },
            { status: 500 }
        );
    }
}

