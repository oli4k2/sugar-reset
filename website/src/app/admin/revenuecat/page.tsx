/**
 * RevenueCat Customer Management Admin Page
 * 
 * Allows admins to:
 * - Search for customers by user ID, email, or transaction ID
 * - View customer purchase history
 * - See anonymous customers
 * - Link anonymous purchases to user accounts
 */

'use client';

import { useState, useEffect } from 'react';

interface Customer {
    app_user_id: string;
    is_anonymous: boolean;
    first_seen: string;
    last_seen: string;
    management_url: string | null;
    entitlements: string[];
    active_entitlements: string[];
    subscriptions: string[];
    active_subscriptions: string[];
    non_subscriptions: string[];
    raw?: any;
}

export default function RevenueCatAdminPage() {
    const [searchType, setSearchType] = useState<'user_id' | 'email' | 'transaction'>('user_id');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [adminSecret, setAdminSecret] = useState('');

    // Load admin secret from localStorage (for convenience)
    useEffect(() => {
        const saved = localStorage.getItem('admin_secret');
        if (saved) {
            setAdminSecret(saved);
        }
    }, []);

    const handleSearch = async () => {
        if (!searchValue.trim() || !adminSecret) {
            setError('Please enter a search value and admin secret');
            return;
        }

        setLoading(true);
        setError(null);
        setCustomer(null);

        try {
            let url = '/api/admin/revenuecat/customers';
            const params = new URLSearchParams();

            if (searchType === 'user_id') {
                params.append('app_user_id', searchValue);
            } else if (searchType === 'email') {
                params.append('email', searchValue);
            } else if (searchType === 'transaction') {
                params.append('transaction_id', searchValue);
            }

            url += '?' + params.toString();

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${adminSecret}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch customer');
            }

            if (data.customer) {
                setCustomer(data.customer);
            } else if (data.message) {
                setError(data.message);
                if (data.suggestion) {
                    setError(data.message + ' ' + data.suggestion);
                }
            }

        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const saveAdminSecret = () => {
        if (adminSecret) {
            localStorage.setItem('admin_secret', adminSecret);
            alert('Admin secret saved to browser (localStorage)');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    RevenueCat Customer Management
                </h1>
                <p className="text-gray-600 mb-8">
                    Search for customers, view purchase history, and manage anonymous purchases
                </p>

                {/* Admin Secret Input */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Secret
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={adminSecret}
                            onChange={(e) => setAdminSecret(e.target.value)}
                            placeholder="Enter ADMIN_SECRET"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={saveAdminSecret}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Save
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Stored in browser localStorage for convenience
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex gap-4 mb-4">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="user_id">User ID (Firebase UID or Anonymous ID)</option>
                            <option value="email">Email</option>
                            <option value="transaction">Transaction ID</option>
                        </select>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder={
                                searchType === 'user_id'
                                    ? 'Enter Firebase UID or $RCAnonymousID:...'
                                    : searchType === 'email'
                                    ? 'Enter email address'
                                    : 'Enter transaction ID'
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading || !searchValue.trim() || !adminSecret}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Customer Details */}
                {customer && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Customer Details
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        customer.is_anonymous
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {customer.is_anonymous ? 'Anonymous' : 'Identified'}
                                    </span>
                                    {customer.management_url && (
                                        <a
                                            href={customer.management_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View in RevenueCat Dashboard →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Basic Information
                                </h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">App User ID</dt>
                                        <dd className="text-sm text-gray-900 font-mono break-all">
                                            {customer.app_user_id}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">First Seen</dt>
                                        <dd className="text-sm text-gray-900">
                                            {formatDate(customer.first_seen)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Last Seen</dt>
                                        <dd className="text-sm text-gray-900">
                                            {formatDate(customer.last_seen)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Entitlements */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Entitlements
                                </h3>
                                {customer.active_entitlements.length > 0 ? (
                                    <div className="space-y-2">
                                        {customer.active_entitlements.map((ent) => (
                                            <div
                                                key={ent}
                                                className="px-3 py-2 bg-green-50 border border-green-200 rounded-md"
                                            >
                                                <span className="text-sm font-medium text-green-800">
                                                    ✓ {ent} (Active)
                                                </span>
                                            </div>
                                        ))}
                                        {customer.entitlements.filter(
                                            (e) => !customer.active_entitlements.includes(e)
                                        ).map((ent) => (
                                            <div
                                                key={ent}
                                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                            >
                                                <span className="text-sm text-gray-600">{ent} (Inactive)</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No entitlements</p>
                                )}
                            </div>

                            {/* Subscriptions */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Subscriptions
                                </h3>
                                {customer.active_subscriptions.length > 0 ? (
                                    <div className="space-y-2">
                                        {customer.active_subscriptions.map((sub) => (
                                            <div
                                                key={sub}
                                                className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md"
                                            >
                                                <span className="text-sm font-medium text-blue-800">
                                                    ✓ {sub} (Active)
                                                </span>
                                            </div>
                                        ))}
                                        {customer.subscriptions.filter(
                                            (s) => !customer.active_subscriptions.includes(s)
                                        ).map((sub) => (
                                            <div
                                                key={sub}
                                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                            >
                                                <span className="text-sm text-gray-600">{sub} (Inactive)</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No subscriptions</p>
                                )}
                            </div>

                            {/* Non-Subscriptions (Lifetime, etc.) */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    One-Time Purchases
                                </h3>
                                {customer.non_subscriptions.length > 0 ? (
                                    <div className="space-y-2">
                                        {customer.non_subscriptions.map((purchase) => (
                                            <div
                                                key={purchase}
                                                className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-md"
                                            >
                                                <span className="text-sm font-medium text-purple-800">
                                                    {purchase}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No one-time purchases</p>
                                )}
                            </div>
                        </div>

                        {/* Instructions for Anonymous Customers */}
                        {customer.is_anonymous && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <h4 className="font-semibold text-yellow-900 mb-2">
                                    Anonymous Customer - How to Link
                                </h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                                    <li>When the user signs up, the app automatically calls <code className="bg-yellow-100 px-1 rounded">Purchases.logIn(userId)</code></li>
                                    <li>This merges the anonymous purchase with their Firebase UID</li>
                                    <li>Alternatively, use RevenueCat dashboard to manually identify this customer</li>
                                    <li>Or ask the user to sign up and the purchase will be automatically linked</li>
                                </ol>
                            </div>
                        )}

                        {/* Raw Data (Collapsible) */}
                        <details className="mt-6">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                View Raw Data
                            </summary>
                            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto text-xs">
                                {JSON.stringify(customer.raw, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        How to Use This Tool
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                        <li>
                            <strong>Find Anonymous Customers:</strong> Search for <code className="bg-blue-100 px-1 rounded">$RCAnonymousID:...</code> (you can find these in RevenueCat dashboard)
                        </li>
                        <li>
                            <strong>Find by Firebase UID:</strong> When a user signs up, search for their Firebase UID to see their purchase history
                        </li>
                        <li>
                            <strong>Link Purchases:</strong> When a user signs up, the app automatically links anonymous purchases. If they contact support, you can verify their purchase here.
                        </li>
                        <li>
                            <strong>Transaction ID:</strong> If a user provides a transaction ID, use RevenueCat dashboard to find the customer, then search by their app_user_id here.
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

