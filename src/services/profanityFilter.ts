/**
 * Profanity Filter Service
 * 
 * Detects and filters inappropriate language in community posts and comments.
 * Uses a comprehensive list of common profanity and offensive terms.
 */

// Common profanity words to filter (lowercase for case-insensitive matching)
const PROFANITY_LIST = [
    // Strong profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'fucks', 'motherfucker', 'motherfucking',
    'shit', 'shits', 'shitty', 'bullshit', 'horseshit',
    'ass', 'asshole', 'assholes', 'asses', 'dumbass', 'jackass', 'fatass',
    'bitch', 'bitches', 'bitchy', 'bitching',
    'damn', 'dammit', 'goddamn', 'goddammit',
    'hell', 'hellhole',
    'crap', 'crappy',
    'piss', 'pissed', 'pisses', 'pissing',
    'dick', 'dicks', 'dickhead', 'dickheads',
    'cock', 'cocks', 'cocksucker',
    'cunt', 'cunts',
    'bastard', 'bastards',
    'whore', 'whores', 'hoe', 'hoes', 'slut', 'sluts',

    // Slurs and hate speech (abbreviated to avoid full listing)
    'nigger', 'nigga', 'niggas',
    'fag', 'faggot', 'faggots', 'fags',
    'retard', 'retarded', 'retards',
    'spic', 'spics',
    'kike', 'kikes',
    'chink', 'chinks',

    // Other offensive terms
    'douche', 'douchebag', 'douchebags',
    'wanker', 'wankers',
    'twat', 'twats',
    'tits', 'titties', 'boobs',
    'penis', 'vagina', 'pussy',

    // Drug references that might be inappropriate
    'cocaine', 'heroin', 'meth', 'crack',

    // Insults and demeaning language
    'idiot', 'idiots', 'idiotic',
    'moron', 'morons', 'moronic',
    'stupid', 'dumb',
    'loser', 'losers',
    'pathetic',
    'scum', 'scumbag', 'scumbags',
    'creep', 'creepy', 'pervert', 'perverts', 'pedo', 'pedos',
    'suck', 'sucks',
    'stfu', 'gtfo', 'kys',
];

// Create regex patterns for each word (word boundary matching)
const PROFANITY_PATTERNS = PROFANITY_LIST.map(word => ({
    word,
    regex: new RegExp(`\\b${word}\\b`, 'gi')
}));

export const profanityFilter = {
    /**
     * Check if text contains profanity
     * Returns true if profanity is found
     */
    containsProfanity(text: string): boolean {
        if (!text || typeof text !== 'string') return false;

        const lowerText = text.toLowerCase();

        // Check each pattern
        for (const pattern of PROFANITY_PATTERNS) {
            if (pattern.regex.test(lowerText)) {
                // Reset regex lastIndex for next use
                pattern.regex.lastIndex = 0;
                return true;
            }
            // Reset regex lastIndex
            pattern.regex.lastIndex = 0;
        }

        return false;
    },

    /**
     * Get a list of profane words found in the text
     */
    findProfanity(text: string): string[] {
        if (!text || typeof text !== 'string') return [];

        const found: string[] = [];
        const lowerText = text.toLowerCase();

        for (const pattern of PROFANITY_PATTERNS) {
            if (pattern.regex.test(lowerText)) {
                found.push(pattern.word);
            }
            // Reset regex lastIndex
            pattern.regex.lastIndex = 0;
        }

        return [...new Set(found)]; // Remove duplicates
    },

    /**
     * Filter profanity from text by replacing with asterisks
     */
    filterProfanity(text: string): string {
        if (!text || typeof text !== 'string') return text;

        let filteredText = text;

        for (const pattern of PROFANITY_PATTERNS) {
            filteredText = filteredText.replace(pattern.regex, (match) => {
                // Replace with asterisks, keeping first and last letter
                if (match.length <= 2) return '*'.repeat(match.length);
                return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
            });
            // Reset regex lastIndex
            pattern.regex.lastIndex = 0;
        }

        return filteredText;
    },

    /**
     * Validate text and throw error if profanity is found
     * Returns the original text if clean
     */
    validateText(text: string, fieldName: string = 'content'): string {
        if (this.containsProfanity(text)) {
            throw new Error(`Your ${fieldName} contains inappropriate language. Please revise and try again.`);
        }
        return text;
    },
};

export default profanityFilter;
