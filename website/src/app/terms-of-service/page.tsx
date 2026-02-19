"use client";

import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-loovi-background overflow-hidden relative">
      {/* Background Gradients & Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-coral-soft/10 via-loovi-warm-beige/20 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-coral-soft/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-loovi-coral-orange/10 rounded-full blur-[100px] pointer-events-none" />

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
            Terms of Service
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              By accessing and using the Craveless application, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              2. Educational Purpose
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              The content provided in Craveless is for educational and informational purposes only. It is not intended to substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p className="text-loovi-text-secondary leading-relaxed">
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              3. User Conduct
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              You agree to use the application only for lawful purposes. You are prohibited from posting or transmitting any unlawful, threatening, libelous, defamatory, obscene, or profane material in the community features.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              4. Intellectual Property
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              All content included on this app, such as text, graphics, logos, button icons, images, and software, is the property of Craveless or its content suppliers and protected by international copyright laws.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              5. Subscriptions and Payments
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Craveless offers premium subscription plans that provide access to additional features:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Subscription Plans:</span> We offer monthly and annual subscription plans. Prices are displayed in the app and may vary by region.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Auto-Renewal:</span> Subscriptions automatically renew at the end of each billing period unless cancelled at least 24 hours before the renewal date.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Cancellation:</span> You can cancel your subscription at any time through your device's App Store or Google Play settings. Cancellation takes effect at the end of the current billing period.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Price Changes:</span> We reserve the right to change subscription prices. You will be notified of any price changes, and they will apply to your next billing cycle.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Refunds:</span> Refund requests are handled by Apple (for iOS) or Google (for Android) in accordance with their respective refund policies. Please see our <Link href="/refund-policy" className="text-loovi-text-primary hover:underline font-semibold">Refund Policy</Link> for more details.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              6. Account Termination
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may also terminate your account at any time through the app settings or by contacting us at <a href="mailto:hello@craveless.info" className="text-loovi-text-primary hover:underline font-semibold">hello@craveless.info</a>.
            </p>
            <p className="text-loovi-text-secondary leading-relaxed">
              Upon termination, your access to the app will be revoked, but you may request deletion of your data in accordance with our Privacy Policy.
            </p>
          </div>

          {/* Section 7 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              To the maximum extent permitted by law, Craveless shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the app.
            </p>
          </div>

          {/* Section 8 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              This app is provided "as is" without any representations or warranties, express or implied. Craveless makes no representations or warranties in relation to this app or the information and materials provided.
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

