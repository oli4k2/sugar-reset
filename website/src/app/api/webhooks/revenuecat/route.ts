/**
 * RevenueCat Webhook Endpoint
 * 
 * Handles RevenueCat webhook events for subscription lifecycle:
 * - Subscription cancellations
 * - Trial expirations
 * - Subscription renewals
 * - Subscription changes
 * 
 * Webhook URL: https://craveless.info/api/webhooks/revenuecat
 * 
 * Setup in RevenueCat Dashboard:
 * 1. Go to Project Settings > Webhooks
 * 2. Add webhook URL: https://craveless.info/api/webhooks/revenuecat
 * 3. Select events:
 *    - SUBSCRIPTION_CANCELLED
 *    - TRIAL_EXPIRED
 *    - SUBSCRIPTION_RENEWED
 *    - SUBSCRIPTION_DID_CHANGE
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// RevenueCat webhook secret for verification (optional but recommended)
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

interface RevenueCatWebhookEvent {
    event: {
        id: string;
        type: string;
        app_user_id: string;
        product_id?: string;
        period_type?: string;
        expiration_at_ms?: number;
        presented_offering_id?: string;
        entitlement_ids?: string[];
        aliases?: string[];
    };
}

/**
 * Verify webhook signature (optional but recommended for production)
 */
function verifyWebhookSignature(
    payload: string,
    signature: string | null
): boolean {
    if (!REVENUECAT_WEBHOOK_SECRET || !signature) {
        // In development, skip verification
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        return false;
    }

    // TODO: Implement signature verification if you set up webhook secrets
    // RevenueCat provides X-RevenueCat-Event-Signature header
    return true;
}

/**
 * Send cancellation offer notification to user
 */
async function handleSubscriptionCancelled(event: RevenueCatWebhookEvent) {
    const userId = event.event.app_user_id;
    
    console.log('📧 Subscription cancelled for user:', userId);
    
    // TODO: Store cancellation event in database
    // This allows the app to show cancellation offers when user opens the app
    
    // Optionally send email notification
    try {
        // Get user email from Firebase (you'd need to fetch this)
        // For now, just log the event
        console.log('💌 Would send cancellation offer email to user:', userId);
        
        // Example email (uncomment when you have user email):
        // await resend.emails.send({
        //     from: 'Craveless <auth@craveless.info>',
        //     to: userEmail,
        //     subject: 'Wait! Special Offer Just For You',
        //     html: `...cancellation offer email...`
        // });
    } catch (error) {
        console.error('Failed to send cancellation email:', error);
    }
}

/**
 * Handle trial expiration
 */
async function handleTrialExpired(event: RevenueCatWebhookEvent) {
    const userId = event.event.app_user_id;
    
    console.log('⏰ Trial expired for user:', userId);
    
    // TODO: Store trial expiration in database
    // This allows the app to show upgrade prompts
    
    // Optionally send email notification
    try {
        console.log('💌 Would send trial expiration email to user:', userId);
    } catch (error) {
        console.error('Failed to send trial expiration email:', error);
    }
}

/**
 * Handle subscription renewal
 */
async function handleSubscriptionRenewed(event: RevenueCatWebhookEvent) {
    const userId = event.event.app_user_id;
    
    console.log('✅ Subscription renewed for user:', userId);
    
    // TODO: Update user's premium status in database
    // This ensures premium access continues
}

/**
 * Handle subscription changes (upgrades, downgrades, etc.)
 */
async function handleSubscriptionChanged(event: RevenueCatWebhookEvent) {
    const userId = event.event.app_user_id;
    
    console.log('🔄 Subscription changed for user:', userId);
    
    // TODO: Update user's subscription status in database
}

export async function POST(request: NextRequest) {
    try {
        // Get webhook signature for verification
        const signature = request.headers.get('X-RevenueCat-Event-Signature');
        
        // Parse request body
        const body = await request.text();
        
        // Verify webhook signature (optional)
        if (!verifyWebhookSignature(body, signature)) {
            console.error('❌ Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }
        
        const event: RevenueCatWebhookEvent = JSON.parse(body);
        
        console.log('📥 RevenueCat webhook received:', event.event.type);
        
        // Handle different event types
        switch (event.event.type) {
            case 'SUBSCRIPTION_CANCELLED':
                await handleSubscriptionCancelled(event);
                break;
                
            case 'TRIAL_EXPIRED':
                await handleTrialExpired(event);
                break;
                
            case 'SUBSCRIPTION_RENEWED':
                await handleSubscriptionRenewed(event);
                break;
                
            case 'SUBSCRIPTION_DID_CHANGE':
                await handleSubscriptionChanged(event);
                break;
                
            default:
                console.log('ℹ️ Unhandled webhook event type:', event.event.type);
        }
        
        // Always return 200 to acknowledge receipt
        return NextResponse.json({ 
            success: true,
            message: 'Webhook processed',
            eventType: event.event.type
        });
        
    } catch (error: any) {
        console.error('❌ Error processing RevenueCat webhook:', error);
        
        // Return 200 even on error to prevent RevenueCat from retrying
        // (unless it's a signature verification error)
        return NextResponse.json(
            { 
                error: 'Webhook processing failed',
                message: error.message 
            },
            { status: 200 }
        );
    }
}

// GET handler for testing
export async function GET() {
    return NextResponse.json({
        message: 'RevenueCat Webhook Endpoint',
        method: 'Use POST to receive webhook events',
        endpoint: '/api/webhooks/revenuecat',
        setup: {
            url: 'https://craveless.info/api/webhooks/revenuecat',
            events: [
                'SUBSCRIPTION_CANCELLED',
                'TRIAL_EXPIRED',
                'SUBSCRIPTION_RENEWED',
                'SUBSCRIPTION_DID_CHANGE'
            ]
        }
    });
}

