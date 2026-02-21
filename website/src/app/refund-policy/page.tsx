"use client";

import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-loovi-background overflow-hidden relative">
      {/* Background Gradients & Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-warm-beige/10 via-loovi-coral-soft/20 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-warm-beige/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
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
            Refund Policy
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              1. Overview
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Craveless offers premium subscription services through in-app purchases. All purchases are processed by Apple (for iOS) or Google (for Android), and refunds are handled according to their respective policies.
            </p>
            <p className="text-loovi-text-secondary leading-relaxed">
              This policy outlines how refunds work for Craveless subscriptions and how to request a refund.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              2. Refund Eligibility
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Refund eligibility depends on the platform and circumstances:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Accidental Purchases:</span> If you accidentally purchased a subscription, you may be eligible for a refund if requested within a reasonable time frame.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Technical Issues:</span> If you experience technical problems that prevent you from using the premium features, you may be eligible for a refund.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Cancelled Subscriptions:</span> If you cancel a subscription, you will continue to have access until the end of the current billing period. No refunds are provided for the remaining time in a cancelled subscription period.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              3. How to Request a Refund
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Refund requests must be made through the platform where you made the purchase:
            </p>

            <div className="mb-4">
              <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-3">
                For iOS (Apple App Store):
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-loovi-text-secondary ml-4">
                <li>Go to <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer" className="text-loovi-text-primary hover:underline font-semibold">reportaproblem.apple.com</a></li>
                <li>Sign in with your Apple ID</li>
                <li>Find the Craveless purchase</li>
                <li>Select "Report a Problem" and choose your reason</li>
                <li>Follow the instructions to submit your refund request</li>
              </ol>
              <p className="text-sm text-loovi-text-tertiary mt-3">
                Apple typically processes refund requests within 48 hours. Refunds are usually granted for purchases made within the last 90 days.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-lg font-semibold text-loovi-text-primary mb-3">
                For Android (Google Play Store):
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-loovi-text-secondary ml-4">
                <li>Open the Google Play Store app</li>
                <li>Tap your profile icon → Payments & subscriptions</li>
                <li>Find Craveless in your subscription list</li>
                <li>Tap "Manage" → "Cancel subscription" or "Request refund"</li>
                <li>Follow the prompts to complete your request</li>
              </ol>
              <p className="text-sm text-loovi-text-tertiary mt-3">
                Google typically processes refund requests within 1-3 business days. Refunds are usually granted for purchases made within the last 48 hours, though exceptions may apply.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              4. Processing Time
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Refund processing times vary by platform:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Apple:</span> Typically 48 hours to 5 business days
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Google:</span> Typically 1-3 business days
                </span>
              </li>
            </ul>
            <p className="text-loovi-text-secondary mt-4 leading-relaxed">
              Once approved, refunds will be credited back to your original payment method. The time it takes for the refund to appear in your account depends on your payment provider.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              5. Non-Refundable Items
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              The following are generally not eligible for refunds:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mt-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Subscriptions that have been active for more than the platform's refund window (typically 48 hours for Google, 90 days for Apple)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Subscriptions cancelled after the billing period has ended</span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Refund requests made through third-party channels (must go through Apple or Google)</span>
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              6. Contact Us
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              If you have questions about refunds or need assistance with the refund process, please contact us at <a href="mailto:hello@craveless.info" className="text-loovi-text-primary hover:underline font-semibold">hello@craveless.info</a>.
            </p>
            <p className="text-loovi-text-secondary leading-relaxed">
              Please note that we cannot process refunds directly. All refund requests must go through Apple or Google, as they process the payments. However, we're happy to help guide you through the process or address any concerns you may have.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-loovi-text-tertiary mb-2">
              Last updated: January 2026
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













