/**
 * RevenueCat Customer Detail API
 * 
 * Get detailed information about a specific customer
 */

import { NextRequest, NextResponse } from "next/server";

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-me-in-production';

function verifyAdmin(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${ADMIN_SECRET}`;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ appUserId: string }> }
) {
    try {
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

        const { appUserId: appUserIdParam } = await params;
        const appUserId = decodeURIComponent(appUserIdParam);

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

        const customer = await response.json();
        
        // Format the response for easier consumption
        const formatted = {
            app_user_id: customer.subscriber.original_app_user_id,
            is_anonymous: customer.subscriber.original_app_user_id.startsWith('$RCAnonymousID:'),
            first_seen: customer.subscriber.first_seen,
            last_seen: customer.subscriber.last_seen,
            management_url: customer.subscriber.management_url,
            entitlements: Object.keys(customer.subscriber.entitlements || {}),
            active_entitlements: Object.entries(customer.subscriber.entitlements || {})
                .filter(([_, ent]: [string, any]) => ent.is_active)
                .map(([key]) => key),
            subscriptions: Object.keys(customer.subscriber.subscriptions || {}),
            active_subscriptions: Object.entries(customer.subscriber.subscriptions || {})
                .filter(([_, sub]: [string, any]) => sub.is_active)
                .map(([key]) => key),
            non_subscriptions: Object.keys(customer.subscriber.non_subscriptions || {}),
            raw: customer // Include full data for detailed view
        };

        return NextResponse.json({ customer: formatted });

    } catch (error: any) {
        console.error('❌ Error fetching RevenueCat customer:', error);
        return NextResponse.json(
            { error: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

