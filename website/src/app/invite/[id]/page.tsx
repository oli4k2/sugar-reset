"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function InvitePage() {
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    if (!userId) return;

    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    // Deep link to app
    const deepLink = `craveless://invite/${userId}`;

    // App Store URLs (update these with actual app store links when available)
    const iosAppStoreUrl = "https://apps.apple.com/app/craveless/idYOUR_APP_ID"; // TODO: Replace with actual App Store ID
    const androidPlayStoreUrl = "https://play.google.com/store/apps/details?id=com.craveless.app"; // TODO: Verify package name

    // Try to open the app first
    const tryOpenApp = () => {
      // Try opening the deep link
      window.location.href = deepLink;

      // If app is not installed, redirect to store after a short delay
      setTimeout(() => {
        if (isIOS) {
          window.location.href = iosAppStoreUrl;
        } else if (isAndroid) {
          window.location.href = androidPlayStoreUrl;
        } else {
          // Desktop - show message
          alert("Please open this link on your mobile device to add this friend in the Craveless app.");
        }
      }, 2000);
    };

    tryOpenApp();
  }, [userId]);

  return (
    <div className="min-h-screen bg-loovi-background flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loovi-coral-orange"></div>
        </div>
        <h1 className="text-2xl font-bold text-loovi-text-primary mb-2">
          Opening Craveless...
        </h1>
        <p className="text-loovi-text-secondary">
          If the app doesn't open, you'll be redirected to download it.
        </p>
      </div>
    </div>
  );
}

