/**
 * Username Generator
 * 
 * Generates Reddit-style random usernames (e.g., "unicornstar45", "mountainhiker12")
 * These are unique identifiers for users that don't reveal personal information.
 */

// Common words for username generation (Reddit-inspired)
const ADJECTIVES = [
    'cool', 'swift', 'bright', 'brave', 'calm', 'clever', 'daring', 'gentle',
    'happy', 'jolly', 'kind', 'lively', 'mighty', 'noble', 'proud', 'quick',
    'radiant', 'silent', 'smooth', 'tough', 'witty', 'zealous', 'bold', 'fierce',
    'graceful', 'heroic', 'jovial', 'keen', 'loyal', 'merry', 'nifty', 'peppy',
    'quirky', 'robust', 'serene', 'tidy', 'vivid', 'warm', 'zesty', 'active',
    'breezy', 'cosmic', 'dazzling', 'eager', 'fancy', 'gigantic', 'harmonious',
    'infinite', 'jubilant', 'kaleidoscopic', 'luminous', 'majestic', 'nimble',
    'optimistic', 'peaceful', 'quantum', 'resilient', 'stellar', 'tranquil',
    'unified', 'vibrant', 'whimsical', 'xenial', 'youthful', 'zenith'
];

const NOUNS = [
    'star', 'moon', 'sun', 'ocean', 'river', 'mountain', 'forest', 'valley',
    'cloud', 'wind', 'storm', 'rain', 'snow', 'fire', 'earth', 'sky',
    'bird', 'eagle', 'hawk', 'wolf', 'lion', 'tiger', 'bear', 'deer',
    'dolphin', 'whale', 'shark', 'turtle', 'butterfly', 'dragon', 'phoenix',
    'unicorn', 'pegasus', 'griffin', 'knight', 'warrior', 'wizard', 'ranger',
    'explorer', 'traveler', 'adventurer', 'pioneer', 'champion', 'hero', 'legend',
    'sage', 'scholar', 'artist', 'musician', 'poet', 'writer', 'thinker',
    'dreamer', 'seeker', 'wanderer', 'hiker', 'climber', 'runner', 'swimmer',
    'surfer', 'sailor', 'pilot', 'captain', 'commander', 'leader', 'guide',
    'mentor', 'teacher', 'student', 'friend', 'ally', 'partner', 'companion',
    'guardian', 'protector', 'defender', 'keeper', 'watcher', 'observer',
    'discoverer', 'creator', 'builder', 'maker', 'designer', 'architect',
    'engineer', 'scientist', 'researcher', 'explorer', 'investigator', 'detective',
    'philosopher', 'visionary', 'innovator', 'pioneer', 'trailblazer', 'pathfinder'
];

/**
 * Generate a random Reddit-style username
 * Format: [adjective][noun][number] (e.g., "coolstar42", "bravemountain15")
 * 
 * @param existingUsernames Optional set of existing usernames to avoid duplicates
 * @returns A unique username string
 */
export async function generateUsername(existingUsernames?: Set<string>): Promise<string> {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
        // Randomly select adjective and noun
        const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        
        // Add random number (0-9999) - sometimes include it, sometimes not
        const includeNumber = Math.random() > 0.3; // 70% chance of including number
        const number = includeNumber ? Math.floor(Math.random() * 10000) : null;
        
        // Construct username
        const username = number !== null 
            ? `${adjective}${noun}${number}`
            : `${adjective}${noun}`;

        // Check if it's unique (if existingUsernames provided)
        if (!existingUsernames || !existingUsernames.has(username.toLowerCase())) {
            return username.toLowerCase();
        }

        attempts++;
    }

    // Fallback: if we can't generate a unique one, add timestamp
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${adjective}${noun}${timestamp}`.toLowerCase();
}

/**
 * Check if a username is already taken in Firestore
 * This is used during user creation to ensure uniqueness
 */
export async function isUsernameTaken(username: string, db: any): Promise<boolean> {
    try {
        const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('usernameLower', '==', username.toLowerCase()),
            limit(1)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.warn('Error checking username availability:', error);
        // If check fails, assume it's available (will be caught during creation)
        return false;
    }
}

/**
 * Generate a unique username that doesn't exist in Firestore
 */
export async function generateUniqueUsername(db: any): Promise<string> {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const username = await generateUsername();
        const taken = await isUsernameTaken(username, db);
        
        if (!taken) {
            return username;
        }

        attempts++;
    }

    // Fallback: add random suffix
    const baseUsername = await generateUsername();
    const randomSuffix = Math.floor(Math.random() * 1000000);
    return `${baseUsername}${randomSuffix}`;
}

