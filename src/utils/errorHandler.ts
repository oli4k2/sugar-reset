/**
 * Error Handler Utility
 * 
 * Provides consistent error handling that:
 * - Always shows user-friendly alerts (never console errors to users)
 * - Only logs to console in development mode
 * - Provides friendly error messages for common scenarios
 */

import { Alert } from 'react-native';

/**
 * Log error to console only in development mode
 * In production, errors are silent to avoid exposing technical details
 */
export function logError(context: string, error: any): void {
    if (__DEV__) {
        console.error(`[${context}]`, error);
    }
    // In production, errors are not logged to console to avoid "coding vibes"
}

/**
 * Handle and display user-facing errors
 * Always shows a user-friendly alert, never console errors
 */
export function handleError(
    error: any,
    defaultMessage: string = 'Something went wrong. Please try again.',
    context?: string
): void {
    // Log to console only in development
    if (context && __DEV__) {
        logError(context, error);
    }

    // Extract user-friendly error message
    let message = defaultMessage;
    
    if (error?.message) {
        // Use the error message if it's user-friendly
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    // Show user-friendly alert
    Alert.alert('Error', message);
}

/**
 * Handle validation errors with specific messages
 */
export function handleValidationError(error: any): void {
    const message = error?.message || 'Invalid input. Please check your entry and try again.';
    Alert.alert('Invalid Input', message);
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(error: any): void {
    const message = error?.message || 'You are doing this too quickly. Please wait a moment and try again.';
    Alert.alert('Too Fast', message);
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: any): void {
    const message = 'Unable to connect. Please check your internet connection and try again.';
    Alert.alert('Connection Error', message);
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: any): void {
    const message = error?.message || 'Authentication failed. Please try signing in again.';
    Alert.alert('Sign In Error', message);
}

