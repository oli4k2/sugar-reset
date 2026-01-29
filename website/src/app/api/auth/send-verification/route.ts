import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin (prevent re-initialization)
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

        console.log("Initializing Firebase Admin...");
        console.log("Project ID exists:", !!projectId, projectId);
        console.log("Client Email exists:", !!clientEmail, clientEmail);
        console.log("Private Key exists:", !!privateKeyRaw);

        // Sanitize key
        const privateKey = privateKeyRaw?.replace(/^"|"$/g, '')?.replace(/\\n/g, "\n");

        if (privateKey) {
            console.log("Private Key Length:", privateKey.length);
            console.log("Private Key Start:", privateKey.substring(0, 20)); // Should be -----BEGIN PRIVATE
            console.log("Private Key End:", privateKey.substring(privateKey.length - 20)); // Should be ND PRIVATE KEY-----
        } else {
            console.error("Private Key is empty after sanitization!");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log("Firebase Admin initialized successfully");
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
            from: process.env.RESEND_FROM_EMAIL || "Craveless <auth@craveless.info>",
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
