import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin (prevent re-initialization)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines for Vercel env vars
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Get the auth token from the header
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }
        const idToken = authHeader.split("Bearer ")[1];

        // 2. Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const email = decodedToken.email;

        if (!email) {
            return NextResponse.json({ error: "No email in token" }, { status: 400 });
        }

        // 3. Generate verification link
        const link = await admin.auth().generateEmailVerificationLink(email);

        // 4. Send email via Resend
        const { data, error } = await resend.emails.send({
            from: "Craveless <auth@craveless.info>",
            to: email,
            subject: "Verify your email for Craveless",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E8A87C;">Welcome to Craveless!</h1>
          <p>Please click the link below to verify your email address and start your journey.</p>
          <a href="${link}" style="display: inline-block; background-color: #E8A87C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; margin: 16px 0;">Verify Email</a>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
        </div>
      `,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error sending verification email:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
