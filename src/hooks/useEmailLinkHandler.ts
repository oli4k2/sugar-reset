/**
 * useEmailLinkHandler Hook
 * 
 * DEPRECATED: This hook handled deep links for email magic link authentication.
 * The app now uses OTP-based email authentication instead.
 * Kept for backwards compatibility but no longer functional.
 */

interface EmailLinkHandlerState {
    isProcessing: boolean;
    error: string | null;
}

export function useEmailLinkHandler(): EmailLinkHandlerState {
    // No-op: OTP auth doesn't use deep links
    return { isProcessing: false, error: null };
}

export default useEmailLinkHandler;
