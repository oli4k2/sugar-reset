/**
 * Input Sanitizer
 * 
 * Provides utilities for sanitizing and validating user input to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - SQL injection (if applicable)
 * - Mass posting abuse
 * - Invalid character patterns
 */

/**
 * Characters that are potentially dangerous for XSS or can break UI
 * These should be sanitized or rejected depending on the use case
 */
const DANGEROUS_CHARS = /[<>{}[\]\\|`~]/g;

/**
 * Characters that should be allowed but escaped in display names
 * These are less dangerous but should still be handled carefully
 */
const SPECIAL_CHARS = /[&"'/]/g;

/**
 * Sanitize text by removing or escaping dangerous characters
 * Use this for display names, usernames, and other user-facing identifiers
 */
export function sanitizeText(input: string, options: {
    allowSpecialChars?: boolean; // Allow &, ", ', / but escape them
    maxLength?: number;
    removeWhitespace?: boolean;
} = {}): string {
    let sanitized = input.trim();
    
    // Remove dangerous characters that could be used for XSS
    sanitized = sanitized.replace(DANGEROUS_CHARS, '');
    
    // Handle special characters based on options
    if (!options.allowSpecialChars) {
        sanitized = sanitized.replace(SPECIAL_CHARS, '');
    }
    // If allowSpecialChars is true, we keep them but they should be escaped when displayed
    
    // Remove excessive whitespace
    if (options.removeWhitespace) {
        sanitized = sanitized.replace(/\s+/g, ' ');
    }
    
    // Apply max length
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized.trim();
}

/**
 * Validate display name/nickname
 * Rejects names with dangerous characters
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }
    
    if (trimmed.length > 50) {
        return { valid: false, error: 'Name must be 50 characters or less' };
    }
    
    // Check for dangerous characters that could be used for XSS
    if (DANGEROUS_CHARS.test(trimmed)) {
        return { 
            valid: false, 
            error: 'Name contains invalid characters. Please avoid: < > { } [ ] \\ | ` ~' 
        };
    }
    
    // Check for script-like patterns (basic XSS prevention)
    const scriptPattern = /<script|javascript:|onerror=|onload=/i;
    if (scriptPattern.test(trimmed)) {
        return { valid: false, error: 'Name contains invalid content' };
    }
    
    return { valid: true };
}

/**
 * Sanitize display name - removes dangerous characters
 * Use this before saving to database
 */
export function sanitizeDisplayName(name: string): string {
    return sanitizeText(name, {
        allowSpecialChars: false, // Remove &, ", ', / for display names
        maxLength: 50,
        removeWhitespace: true,
    });
}

/**
 * Validate and sanitize post/comment content
 * Allows more characters but still prevents XSS
 */
export function validatePostContent(content: string, maxLength: number = 5000): { valid: boolean; error?: string } {
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Content cannot be empty' };
    }
    
    if (trimmed.length > maxLength) {
        return { valid: false, error: `Content must be ${maxLength} characters or less` };
    }
    
    // Check for script tags and event handlers (XSS prevention)
    const xssPattern = /<script|javascript:|onerror=|onload=|onclick=|onmouseover=/i;
    if (xssPattern.test(trimmed)) {
        return { valid: false, error: 'Content contains potentially unsafe code' };
    }
    
    return { valid: true };
}

/**
 * Sanitize post/comment content
 * Removes script tags and dangerous patterns but preserves most formatting
 */
export function sanitizePostContent(content: string): string {
    let sanitized = content.trim();
    
    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove dangerous HTML tags but keep safe ones if needed
    // For React Native, we typically don't render HTML, but this is defensive
    sanitized = sanitized.replace(/<iframe|<embed|<object/gi, '');
    
    return sanitized.trim();
}

/**
 * Validate title
 */
export function validateTitle(title: string, maxLength: number = 140): { valid: boolean; error?: string } {
    const trimmed = title.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Title cannot be empty' };
    }
    
    if (trimmed.length > maxLength) {
        return { valid: false, error: `Title must be ${maxLength} characters or less` };
    }
    
    // Check for dangerous characters
    if (DANGEROUS_CHARS.test(trimmed)) {
        return { 
            valid: false, 
            error: 'Title contains invalid characters' 
        };
    }
    
    // Check for script-like patterns
    const scriptPattern = /<script|javascript:|onerror=|onload=/i;
    if (scriptPattern.test(trimmed)) {
        return { valid: false, error: 'Title contains invalid content' };
    }
    
    return { valid: true };
}

/**
 * Sanitize title
 */
export function sanitizeTitle(title: string, maxLength: number = 140): string {
    return sanitizeText(title, {
        allowSpecialChars: false,
        maxLength,
        removeWhitespace: true,
    });
}

/**
 * Rate limiting helper
 * Tracks recent actions to prevent mass posting
 */
class RateLimiter {
    private actions: Map<string, number[]> = new Map();
    
    /**
     * Check if an action is allowed based on rate limits
     * @param userId User ID
     * @param actionType Type of action (e.g., 'post', 'comment')
     * @param maxActions Maximum actions allowed
     * @param timeWindow Time window in milliseconds
     * @returns true if allowed, false if rate limited
     */
    isAllowed(
        userId: string, 
        actionType: string, 
        maxActions: number = 10, 
        timeWindow: number = 60000 // 1 minute default
    ): boolean {
        const key = `${userId}:${actionType}`;
        const now = Date.now();
        
        // Get existing actions for this user/action
        const actions = this.actions.get(key) || [];
        
        // Remove actions outside the time window
        const recentActions = actions.filter(timestamp => now - timestamp < timeWindow);
        
        // Check if limit exceeded
        if (recentActions.length >= maxActions) {
            return false;
        }
        
        // Add current action
        recentActions.push(now);
        this.actions.set(key, recentActions);
        
        // Clean up old entries periodically (every 5 minutes)
        if (Math.random() < 0.01) { // 1% chance on each check
            this.cleanup(now);
        }
        
        return true;
    }
    
    /**
     * Clean up old entries
     */
    private cleanup(now: number): void {
        const maxAge = 300000; // 5 minutes
        for (const [key, actions] of this.actions.entries()) {
            const recentActions = actions.filter(timestamp => now - timestamp < maxAge);
            if (recentActions.length === 0) {
                this.actions.delete(key);
            } else {
                this.actions.set(key, recentActions);
            }
        }
    }
    
    /**
     * Get remaining actions for a user
     */
    getRemaining(
        userId: string, 
        actionType: string, 
        maxActions: number = 10, 
        timeWindow: number = 60000
    ): number {
        const key = `${userId}:${actionType}`;
        const now = Date.now();
        const actions = this.actions.get(key) || [];
        const recentActions = actions.filter(timestamp => now - timestamp < timeWindow);
        return Math.max(0, maxActions - recentActions.length);
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Check rate limit for posts (10 posts per minute)
 */
export function checkPostRateLimit(userId: string): { allowed: boolean; remaining?: number; error?: string } {
    const allowed = rateLimiter.isAllowed(userId, 'post', 10, 60000); // 10 posts per minute
    if (!allowed) {
        const remaining = rateLimiter.getRemaining(userId, 'post', 10, 60000);
        return { 
            allowed: false, 
            remaining,
            error: 'You are posting too quickly. Please wait a moment before posting again.' 
        };
    }
    return { allowed: true };
}

/**
 * Check rate limit for comments (20 comments per minute)
 */
export function checkCommentRateLimit(userId: string): { allowed: boolean; remaining?: number; error?: string } {
    const allowed = rateLimiter.isAllowed(userId, 'comment', 20, 60000); // 20 comments per minute
    if (!allowed) {
        const remaining = rateLimiter.getRemaining(userId, 'comment', 20, 60000);
        return { 
            allowed: false, 
            remaining,
            error: 'You are commenting too quickly. Please wait a moment before commenting again.' 
        };
    }
    return { allowed: true };
}

