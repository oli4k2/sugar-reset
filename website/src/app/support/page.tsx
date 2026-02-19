"use client";

import Link from "next/link";

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-loovi-background overflow-hidden relative">
            {/* Background Gradients & Blobs */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-sky-blue-soft/10 via-loovi-warm-beige/20 to-transparent pointer-events-none" />
            <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-sky-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-loovi-coral-soft/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 py-8 relative z-10 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-loovi-text-secondary hover:text-loovi-text-primary transition-colors mb-6"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Home
                    </Link>
                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-loovi-text-primary mb-4">
                        Support
                    </h1>
                    <p className="text-loovi-text-secondary text-lg leading-relaxed">
                        We&apos;re here to help. Find answers to common questions or reach out to our team.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Contact Us */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            Contact Us
                        </h2>
                        <p className="text-loovi-text-secondary mb-4 leading-relaxed">
                            Have a question, feedback, or need help? Our support team is happy to assist. You can reach us at:
                        </p>
                        <a
                            href="mailto:hello@craveless.info"
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-loovi-coral-orange/10 border border-loovi-coral-orange/20 text-loovi-text-primary font-semibold hover:bg-loovi-coral-orange/20 transition-colors"
                        >
                            <svg className="w-5 h-5 text-loovi-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            hello@craveless.info
                        </a>
                        <p className="text-sm text-loovi-text-tertiary mt-4">
                            We aim to respond to all inquiries within 48 hours.
                        </p>
                    </div>

                    {/* FAQ */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-6">
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-2">
                                    How do I cancel my subscription?
                                </h3>
                                <p className="text-loovi-text-secondary leading-relaxed">
                                    Subscriptions are managed through your device&apos;s app store. On <span className="font-semibold text-loovi-text-primary">iOS</span>, go to Settings → Your Name → Subscriptions → Craveless. On <span className="font-semibold text-loovi-text-primary">Android</span>, open the Google Play Store → Profile → Payments & subscriptions → Subscriptions → Craveless.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-2">
                                    How do I delete my account?
                                </h3>
                                <p className="text-loovi-text-secondary leading-relaxed">
                                    You can delete your account from within the app by going to Profile → Settings → Delete Account. For more details, visit our{" "}
                                    <Link href="/account-deletion" className="text-loovi-text-primary hover:underline font-semibold">
                                        Account Deletion
                                    </Link>{" "}
                                    page.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-2">
                                    How do I request a refund?
                                </h3>
                                <p className="text-loovi-text-secondary leading-relaxed">
                                    Refunds are processed through Apple or Google, depending on your platform. Please visit our{" "}
                                    <Link href="/refund-policy" className="text-loovi-text-primary hover:underline font-semibold">
                                        Refund Policy
                                    </Link>{" "}
                                    page for step-by-step instructions.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-2">
                                    Is my data safe?
                                </h3>
                                <p className="text-loovi-text-secondary leading-relaxed">
                                    Yes. We take your privacy seriously. Your data is stored securely using industry-standard encryption. For full details on how we collect, use, and protect your data, please read our{" "}
                                    <Link href="/privacy-policy" className="text-loovi-text-primary hover:underline font-semibold">
                                        Privacy Policy
                                    </Link>.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-2">
                                    The app isn&apos;t working correctly. What should I do?
                                </h3>
                                <p className="text-loovi-text-secondary leading-relaxed">
                                    First, try closing and reopening the app, or restarting your device. Make sure you have the latest version installed from the App Store or Google Play Store. If the issue persists, please contact us at{" "}
                                    <a href="mailto:hello@craveless.info" className="text-loovi-text-primary hover:underline font-semibold">
                                        hello@craveless.info
                                    </a>{" "}
                                    with a description of the problem and your device model.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            Useful Links
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Link
                                href="/privacy-policy"
                                className="flex items-center gap-3 p-4 rounded-xl bg-loovi-warm-beige/30 border border-loovi-warm-beige/40 hover:bg-loovi-warm-beige/50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-loovi-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="font-medium text-loovi-text-primary">Privacy Policy</span>
                            </Link>
                            <Link
                                href="/terms-of-service"
                                className="flex items-center gap-3 p-4 rounded-xl bg-loovi-warm-beige/30 border border-loovi-warm-beige/40 hover:bg-loovi-warm-beige/50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-loovi-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium text-loovi-text-primary">Terms of Service</span>
                            </Link>
                            <Link
                                href="/refund-policy"
                                className="flex items-center gap-3 p-4 rounded-xl bg-loovi-warm-beige/30 border border-loovi-warm-beige/40 hover:bg-loovi-warm-beige/50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-loovi-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span className="font-medium text-loovi-text-primary">Refund Policy</span>
                            </Link>
                            <Link
                                href="/account-deletion"
                                className="flex items-center gap-3 p-4 rounded-xl bg-loovi-warm-beige/30 border border-loovi-warm-beige/40 hover:bg-loovi-warm-beige/50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-loovi-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="font-medium text-loovi-text-primary">Account Deletion</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12 pt-8 border-t border-white/20">
                        <p className="text-sm text-loovi-text-tertiary mb-2">
                            Last updated: February 2026
                        </p>
                        <p className="text-sm text-loovi-text-tertiary">
                            Contact: <a href="mailto:hello@craveless.info" className="text-loovi-text-primary hover:underline">hello@craveless.info</a>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
