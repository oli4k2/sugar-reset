"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-loovi-background overflow-hidden relative">
      {/* Background Gradients & Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-loovi-sky-blue-soft/10 via-loovi-warm-beige/20 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-loovi-sky-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-loovi-sky-blue-soft/10 rounded-full blur-[100px] pointer-events-none" />

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
            Privacy Policy
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              1. Data Storage & Security
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Your privacy is our top priority. We want to be completely transparent about how your data is handled:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Google Firebase:</span> All user profile data is securely stored using Google Firebase, an industry-standard backend platform.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Password Encryption:</span> Your passwords are fully encrypted. No one, including our development team, has access to your actual password.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Community Stats:</span> Aggregated community statistics are stored to power social features, but these are identified securely.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              2. Information We Collect
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              We collect only the information necessary to provide you with a personalized experience:
            </p>
            <p className="text-loovi-text-secondary leading-relaxed whitespace-pre-line">
              • Account information (email, nickname)
              {'\n'}• App usage data (streak progress, goals)
              {'\n'}• Optional mood and craving logs
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              3. How We Use Your Data
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Your data is used solely for:
            </p>
            <p className="text-loovi-text-secondary leading-relaxed whitespace-pre-line">
              • Tracking your sugar-free journey
              {'\n'}• Personalizing your experience
              {'\n'}• Improving app performance
              {'\n'}• Facilitating the community features
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              4. Health Data
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              Craveless integrates with Apple HealthKit (iOS) and Google Fit (Android) to help you track your nutrition data:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Nutrition Data:</span> We access and write nutrition data (sugar intake, calories) to your device's health app to provide a comprehensive view of your dietary habits.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Local Storage:</span> Health data accessed through HealthKit/Google Fit remains on your device and is not transmitted to our servers unless you explicitly choose to sync it.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">User Control:</span> You can revoke access to health data at any time through your device's privacy settings. This will not affect your ability to use the app, though some features may be limited.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">No Third-Party Sharing:</span> We do not share your health data with third parties for advertising or marketing purposes.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              5. Third-Party Services
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              We use the following third-party services to provide and improve our app:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Google Firebase:</span> Used for secure data storage, user authentication, and backend services. Firebase's privacy policy applies to data processed by their services.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">RevenueCat:</span> Used to manage subscription purchases and restore previous purchases. RevenueCat processes payment information in accordance with their privacy policy.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Google Sign-In:</span> Provides authentication services. Google's privacy policy applies when you choose to sign in with Google.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>
                  <span className="font-semibold text-loovi-text-primary">Apple Sign-In:</span> Provides authentication services. Apple's privacy policy applies when you choose to sign in with Apple.
                </span>
              </li>
            </ul>
            <p className="text-loovi-text-secondary leading-relaxed">
              These services have their own privacy policies and terms of service. We encourage you to review them to understand how they handle your data.
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              6. Data Retention
            </h2>
            <p className="text-loovi-text-secondary mb-4 leading-relaxed">
              We retain your personal data for as long as your account is active or as needed to provide you with our services. Specifically:
            </p>
            <ul className="space-y-3 text-loovi-text-secondary mb-4">
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Account data is retained while your account is active</span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Upon account deletion, we will delete your personal data within 30 days, except where we are required to retain it for legal purposes</span>
              </li>
              <li className="flex gap-3">
                <span className="text-loovi-text-primary font-semibold">•</span>
                <span>Aggregated, anonymized data may be retained for analytics and service improvement purposes</span>
              </li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-loovi-text-primary mb-4">
              7. Data Deletion
            </h2>
            <p className="text-loovi-text-secondary leading-relaxed">
              You have the right to request the deletion of your account and all associated data at any time. You can do this by contacting our support at <a href="mailto:hello@craveless.info" className="text-loovi-text-primary hover:underline font-semibold">hello@craveless.info</a> or using the delete account option in the app settings. We will process your request within 30 days.
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

