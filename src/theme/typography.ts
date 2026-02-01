/**
 * SugarReset Typography System
 * 
 * Clean, modern typography with clear hierarchy.
 * Uses system fonts with custom weights for consistency.
 */

import { Platform, TextStyle } from 'react-native';

// Font Families (referencing the names from App.tsx/expo-google-fonts)
const fonts = {
    heading: {
        regular: 'DMSans_400Regular',
        medium: 'DMSans_500Medium',
        semibold: 'DMSans_600SemiBold',
        bold: 'DMSans_700Bold',
    },
    body: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_600SemiBold',
    },
    rounded: {
        regular: 'Outfit_400Regular',
        medium: 'Outfit_500Medium',
        semibold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
        extrabold: 'Outfit_800ExtraBold',
    },
};

export const typography = {
    // Expose raw font map if needed
    fonts,

    // Font sizes (rem-like scaling)
    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        md: 17,
        lg: 20,
        xl: 24,
        '2xl': 28,
        '3xl': 34,
        '4xl': 42,
        '5xl': 56,
    },

    // Line heights (in pixels)
    lineHeights: {
        tight: 18,
        normal: 24,
        relaxed: 28,
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
        widest: 2,
    },

    // Pre-defined text styles
    styles: {
        // Display - Large/Hero
        display: {
            fontFamily: fonts.heading.bold,
            fontSize: 56,
            letterSpacing: -1,
            lineHeight: 62,
        } as TextStyle,

        // Headings - Outfit
        h1: {
            fontFamily: fonts.heading.bold,
            fontSize: 34,
            letterSpacing: -0.5,
            lineHeight: 41,
        } as TextStyle,
        h2: {
            fontFamily: fonts.heading.semibold,
            fontSize: 28,
            letterSpacing: -0.3,
            lineHeight: 34,
        } as TextStyle,
        h3: {
            fontFamily: fonts.heading.semibold,
            fontSize: 24,
            letterSpacing: 0,
            lineHeight: 30,
        } as TextStyle,
        h4: {
            fontFamily: fonts.heading.semibold,
            fontSize: 20,
            letterSpacing: 0,
            lineHeight: 26,
        } as TextStyle,

        // Body - Inter
        body: {
            fontFamily: fonts.body.regular,
            fontSize: 15,
            letterSpacing: 0,
            lineHeight: 22,
        } as TextStyle,
        bodyMedium: {
            fontFamily: fonts.body.medium,
            fontSize: 15,
            letterSpacing: 0,
            lineHeight: 22,
        } as TextStyle,
        bodySm: {
            fontFamily: fonts.body.regular,
            fontSize: 13,
            letterSpacing: 0,
            lineHeight: 18,
        } as TextStyle,

        // Labels & Captions - Inter
        label: {
            fontFamily: fonts.body.medium,
            fontSize: 13,
            letterSpacing: 0.5,
            lineHeight: 17,
        } as TextStyle,
        caption: {
            fontFamily: fonts.body.regular,
            fontSize: 11,
            letterSpacing: 0.3,
            lineHeight: 15,
        } as TextStyle,

        // Metrics - Outfit
        metric: {
            fontFamily: fonts.heading.semibold,
            fontSize: 42,
            letterSpacing: -0.5,
            lineHeight: 48,
        } as TextStyle,
        metricLabel: {
            fontFamily: fonts.body.medium,
            fontSize: 11,
            letterSpacing: 1,
            lineHeight: 14,
        } as TextStyle,
    },
} as const;

export type Typography = typeof typography;
