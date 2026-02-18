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

const db = admin.firestore();

// Generate a 6-digit OTP code
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET() {
    return NextResponse.json({
        message: "Send OTP API",
        method: "Use POST to send OTP codes",
        endpoint: "/api/auth/send-otp",
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

        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required", success: false },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Rate limiting: check if an OTP was sent recently (within 60 seconds)
        const otpRef = db.collection("otp_codes").doc(normalizedEmail);
        const existingDoc = await otpRef.get();

        if (existingDoc.exists) {
            const data = existingDoc.data();
            const createdAt = data?.createdAt?.toDate?.() || new Date(0);
            const secondsSinceLastSend = (Date.now() - createdAt.getTime()) / 1000;

            if (secondsSinceLastSend < 60) {
                const waitTime = Math.ceil(60 - secondsSinceLastSend);
                return NextResponse.json(
                    {
                        error: `Please wait ${waitTime} seconds before requesting a new code.`,
                        success: false,
                    },
                    { status: 429 }
                );
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in Firestore
        await otpRef.set({
            code: otp,
            email: normalizedEmail,
            attempts: 0,
            maxAttempts: 5,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            used: false,
        });

        console.log("📧 OTP generated for:", normalizedEmail);

        // Send email via Resend
        const { data, error: resendError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Craveless <auth@craveless.info>",
            to: normalizedEmail,
            subject: "Your Craveless verification code",
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #E8A87C; font-size: 28px; margin: 0;">Craveless</h1>
                        <p style="color: #999; font-size: 14px; margin-top: 4px;">Your sugar-free journey</p>
                    </div>
                    
                    <div style="background: #FAFAFA; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                        <p style="color: #333; font-size: 16px; margin: 0 0 8px;">Your verification code is:</p>
                        <div style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #333; padding: 16px 0; font-family: 'SF Mono', 'Courier New', monospace;">
                            ${otp}
                        </div>
                        <p style="color: #999; font-size: 13px; margin: 8px 0 0;">This code expires in 10 minutes</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; text-align: center; line-height: 1.5;">
                        Enter this code in the app to verify your email address.<br/>
                        If you didn't request this code, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        if (resendError) {
            console.error("Resend error:", resendError);
            return NextResponse.json(
                {
                    error:
                        typeof resendError === "string"
                            ? resendError
                            : "Failed to send verification email",
                    success: false,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error sending OTP email:", error);
        const errorMessage =
            error?.message || error?.toString() || "Internal Server Error";
        return NextResponse.json(
            { error: errorMessage, success: false },
            { status: 500 }
        );
    }
}
