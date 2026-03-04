import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";

// Validate Resend API key before initializing
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing from environment variables");
}

const resend = new Resend(RESEND_API_KEY);

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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json(
                { error: "Invalid email format", success: false },
                { status: 400 }
            );
        }

        // Validate Resend API key is present
        if (!RESEND_API_KEY) {
            console.error("❌ RESEND_API_KEY is missing - cannot send OTP email");
            return NextResponse.json(
                { error: "Email service is not configured. Please contact support.", success: false },
                { status: 500 }
            );
        }

        // App Store Reviewer Login: Special email always gets OTP 555555
        const REVIEWER_EMAIL = 'reviewer@craveless.info';
        const isReviewerEmail = normalizedEmail === REVIEWER_EMAIL;

        // For reviewer email, always use 555555 as OTP
        const otp = isReviewerEmail ? '555555' : generateOTP();

        // Rate limiting: check if an OTP was sent recently (within 60 seconds)
        // Skip rate limiting for reviewer email
        const otpRef = db.collection("otp_codes").doc(normalizedEmail);
        const existingDoc = await otpRef.get();

        if (existingDoc.exists && !isReviewerEmail) {
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

        console.log("📧 OTP generated for:", normalizedEmail, isReviewerEmail ? "(Reviewer - always 555555)" : "");

        // For reviewer email, skip sending actual email - code is always 555555
        // This prevents failures if the reviewer email can't receive emails
        if (isReviewerEmail) {
            console.log("✅ Reviewer OTP stored (email send skipped - code is always 555555)");
            return NextResponse.json({ success: true, data: { id: 'reviewer-bypass' } });
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || "Craveless <auth@craveless.info>";
        console.log("📤 Attempting to send email via Resend:", {
            from: fromEmail,
            to: normalizedEmail,
            hasApiKey: !!RESEND_API_KEY,
        });

        // Send email via Resend
        const { data, error: resendError } = await resend.emails.send({
            from: fromEmail,
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
            console.error("❌ Resend error details:", {
                error: resendError,
                errorType: typeof resendError,
                errorString: JSON.stringify(resendError, null, 2),
                email: normalizedEmail,
                fromEmail: fromEmail,
            });

            // Provide more detailed error message
            let errorMessage = "Failed to send verification email";
            if (typeof resendError === "string") {
                errorMessage = resendError;
            } else if (resendError && typeof resendError === "object") {
                // Try to extract meaningful error message from Resend error object
                const errorObj = resendError as any;
                const errorMsg = errorObj.message || errorObj.error?.message || "";

                // Check for suppression list error
                if (errorMsg.toLowerCase().includes("suppression") ||
                    errorMsg.toLowerCase().includes("suppressed")) {
                    errorMessage = "This email address cannot receive emails. Please use a different email address or contact support.";
                } else {
                    errorMessage = errorMsg || JSON.stringify(resendError);
                }
            }

            return NextResponse.json(
                {
                    error: errorMessage,
                    success: false,
                },
                { status: 500 }
            );
        }

        if (!data) {
            console.error("❌ Resend returned no data and no error - this is unexpected");
            return NextResponse.json(
                {
                    error: "Email service returned an unexpected response. Please try again.",
                    success: false,
                },
                { status: 500 }
            );
        }

        console.log("✅ OTP email sent successfully:", {
            email: normalizedEmail,
            resendId: data.id,
        });

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
