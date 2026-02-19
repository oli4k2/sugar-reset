"use client";

import Link from "next/link";

export default function AccountDeletionPage() {
    return (
        <main className="min-h-screen bg-loovi-background overflow-hidden relative">
            {/* Background Gradients & Blobs */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-coral-soft/10 via-loovi-warm-beige/20 to-transparent pointer-events-none" />
            <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-coral-orange/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-loovi-warm-beige/10 rounded-full blur-[100px] pointer-events-none" />

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
                        Account Deletion
                    </h1>
                    <p className="text-loovi-text-secondary text-lg leading-relaxed">
                        Learn how to delete your Craveless account and what happens to your data.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* How to Delete */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            How to Delete Your Account
                        </h2>
                        <p className="text-loovi-text-secondary mb-6 leading-relaxed">
                            You can delete your account directly from within the Craveless app by following these steps:
                        </p>
                        <ol className="space-y-4 text-loovi-text-secondary">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-loovi-coral-orange/15 text-loovi-coral-dark font-bold flex items-center justify-center text-sm">1</span>
                                <span className="pt-1">Open the <span className="font-semibold text-loovi-text-primary">Craveless</span> app and navigate to your <span className="font-semibold text-loovi-text-primary">Profile</span>.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-loovi-coral-orange/15 text-loovi-coral-dark font-bold flex items-center justify-center text-sm">2</span>
                                <span className="pt-1">Tap on <span className="font-semibold text-loovi-text-primary">Settings</span> (gear icon).</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-loovi-coral-orange/15 text-loovi-coral-dark font-bold flex items-center justify-center text-sm">3</span>
                                <span className="pt-1">Scroll down and tap <span className="font-semibold text-loovi-text-primary">Delete Account</span>.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-loovi-coral-orange/15 text-loovi-coral-dark font-bold flex items-center justify-center text-sm">4</span>
                                <span className="pt-1">Confirm your decision. Your account and data will be scheduled for permanent deletion.</span>
                            </li>
                        </ol>
                    </div>

                    {/* Alternative Method */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            Alternative: Request Deletion via Email
                        </h2>
                        <p className="text-loovi-text-secondary mb-4 leading-relaxed">
                            If you are unable to access the app, you can request account deletion by sending an email to:
                        </p>
                        <a
                            href="mailto:hello@craveless.info?subject=Account%20Deletion%20Request"
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-loovi-coral-orange/10 border border-loovi-coral-orange/20 text-loovi-text-primary font-semibold hover:bg-loovi-coral-orange/20 transition-colors"
                        >
                            <svg className="w-5 h-5 text-loovi-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            hello@craveless.info
                        </a>
                        <p className="text-sm text-loovi-text-tertiary mt-4">
                            Please include the email address associated with your Craveless account. We will process your request within 30 days.
                        </p>
                    </div>

                    {/* What Gets Deleted */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            What Data Gets Deleted
                        </h2>
                        <p className="text-loovi-text-secondary mb-4 leading-relaxed">
                            When you delete your account, the following data will be permanently removed:
                        </p>
                        <ul className="space-y-3 text-loovi-text-secondary">
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>Your profile information (name, email, profile picture)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>Food logs and sugar intake history</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>Journal entries and mood check-ins</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>Streak and progress data</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>Community posts and comments</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>App settings and preferences</span>
                            </li>
                        </ul>
                    </div>

                    {/* Important Notes */}
                    <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                        <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
                            Important Notes
                        </h2>
                        <ul className="space-y-3 text-loovi-text-secondary">
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>
                                    <span className="font-semibold text-loovi-text-primary">Subscription cancellation:</span> Deleting your account does not automatically cancel your subscription. Please cancel your subscription through the App Store or Google Play before deleting your account to avoid future charges.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>
                                    <span className="font-semibold text-loovi-text-primary">Irreversible action:</span> Account deletion is permanent and cannot be undone. All your data will be lost and cannot be recovered.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>
                                    <span className="font-semibold text-loovi-text-primary">Processing time:</span> Account deletion requests are processed within 30 days. During this period, your account will be deactivated.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-loovi-coral-dark font-semibold">•</span>
                                <span>
                                    <span className="font-semibold text-loovi-text-primary">Legal retention:</span> We may retain certain data as required by law or for legitimate business purposes (e.g., fraud prevention, legal compliance) even after account deletion.
                                </span>
                            </li>
                        </ul>
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
