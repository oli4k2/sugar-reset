/**
 * RevenueCat Customer Management API
 * 
 * Fetches customer data from RevenueCat REST API
 * Allows searching and viewing customer purchase history
 * 
 * Security: Requires ADMIN_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-me-in-production';

interface RevenueCatCustomer {
    request_date: string;
    request_date_ms: number;
    subscriber: {
        entitlements: Record<string, any>;
        first_seen: string;
        last_seen: string;
        management_url: string | null;
        non_subscriptions: Record<string, any>;
        original_app_user_id: string;
        original_application_version: string | null;
        other_purchases: Record<string, any>;
        subscriptions: Record<string, any>;
    };
}

/**
 * Verify admin authentication
 */
function verifyAdmin(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${ADMIN_SECRET}`;
}

/**
 * GET /api/admin/revenuecat/customers
 * 
 * Search for customers by:
 * - app_user_id (exact match)
 * - email (if stored as attribute)
 * - transaction_id (search in purchases)
 */
export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        if (!verifyAdmin(request)) {
            return NextResponse.json(
                { error: "Unauthorized. Admin secret required." },
                { status: 401 }
            );
        }

        if (!REVENUECAT_API_KEY) {
            return NextResponse.json(
                { error: "RevenueCat API key not configured" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const appUserId = searchParams.get('app_user_id');
        const email = searchParams.get('email');
        const transactionId = searchParams.get('transaction_id');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // If specific customer ID provided, fetch that customer
        if (appUserId) {
            const response = await fetch(
                `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 404) {
                return NextResponse.json({
                    customer: null,
                    message: "Customer not found"
                });
            }

            if (!response.ok) {
                const error = await response.text();
                return NextResponse.json(
                    { error: `RevenueCat API error: ${error}` },
                    { status: response.status }
                );
            }

            const customer: RevenueCatCustomer = await response.json();
            return NextResponse.json({ customer });
        }

        // If email provided, search by email attribute
        if (email) {
            // RevenueCat doesn't have direct email search, but we can try to find via attributes
            // For now, return a message that they should search by app_user_id
            return NextResponse.json({
                message: "Email search not directly supported. Use app_user_id or search in RevenueCat dashboard.",
                suggestion: "If you have the Firebase UID, use that as app_user_id"
            });
        }

        // If transaction ID provided, we'd need to search all customers
        // This is expensive, so we'll return a message
        if (transactionId) {
            return NextResponse.json({
                message: "Transaction ID search requires iterating through all customers.",
                suggestion: "Use RevenueCat dashboard to search by transaction ID, then use the app_user_id here"
            });
        }

        // No search params - return message about how to use
        return NextResponse.json({
            message: "RevenueCat Customer Search API",
            usage: {
                search_by_user_id: "/api/admin/revenuecat/customers?app_user_id=<user_id>",
                search_by_email: "/api/admin/revenuecat/customers?email=<email>",
                search_by_transaction: "/api/admin/revenuecat/customers?transaction_id=<transaction_id>",
            },
            note: "For email and transaction searches, use RevenueCat dashboard first to find the app_user_id"
        });

    } catch (error: any) {
        console.error('❌ Error fetching RevenueCat customer:', error);
        return NextResponse.json(
            { error: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/revenuecat/customers/identify
 * 
 * Identify (link) an anonymous customer to a user ID
 * This merges the anonymous purchase with the authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin access
        if (!verifyAdmin(request)) {
            return NextResponse.json(
                { error: "Unauthorized. Admin secret required." },
                { status: 401 }
            );
        }

        if (!REVENUECAT_API_KEY) {
            return NextResponse.json(
                { error: "RevenueCat API key not configured" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { anonymousAppUserId, newAppUserId } = body;

        if (!anonymousAppUserId || !newAppUserId) {
            return NextResponse.json(
                { error: "Both anonymousAppUserId and newAppUserId are required" },
                { status: 400 }
            );
        }

        // Use RevenueCat's identify endpoint to merge customers
        // This is done via the logIn method in the SDK, but we can use REST API
        // The REST API doesn't have a direct "identify" endpoint, but we can:
        // 1. Get the anonymous customer's data
        // 2. Create/update the new customer with the same entitlements
        
        // Actually, RevenueCat's REST API doesn't support direct customer merging
        // The SDK's logIn() method handles this. For admin tool, we should:
        // 1. Show the customer data
        // 2. Provide instructions to use the SDK or RevenueCat dashboard
        
        // Alternative: We can update the customer's app_user_id via aliases
        // But the proper way is to use the SDK's logIn() method
        
        return NextResponse.json({
            message: "Customer identification requires SDK logIn() method",
            instructions: [
                "1. In the app, when user signs up, call: Purchases.logIn(newAppUserId)",
                "2. This automatically merges anonymous purchases with the user account",
                "3. Alternatively, use RevenueCat dashboard to manually identify customers"
            ],
            note: "The app already handles this automatically when users sign up"
        });

    } catch (error: any) {
        console.error('❌ Error identifying RevenueCat customer:', error);
        return NextResponse.json(
            { error: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

