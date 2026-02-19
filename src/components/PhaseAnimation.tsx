/**
 * PhaseAnimation – Growing organic blob animation for sugar-reset phases.
 *
 * 13 distinct phases that grow in size and complexity as the user progresses:
 *   Phase 0  : Day 0   – Tiny seed (1 layer)
 *   Phase 1  : Day 1   – Small sprout (2 layers)
 *   Phase 2  : Day 2   – Growing (2 layers, bigger)
 *   Phase 3  : Day 3   – Expanding (3 layers)
 *   Phase 4  : Day 5   – Blooming (3 layers, larger)
 *   Phase 5  : Day 7   – Radiant (4 layers)
 *   Phase 6  : Day 10  – Flourishing (4 layers, richer)
 *   Phase 7  : Day 14  – Vibrant (5 layers)
 *   Phase 8  : Day 21  – Majestic (5 layers, complex)
 *   Phase 9  : Day 30  – Transcendent (6 layers, full bloom)
 *   Phase 10 : Day 45  – Luminous (6 layers, crystalline)
 *   Phase 11 : Day 60  – Celestial (7 layers, ethereal)
 *   Phase 12 : Day 90+ – Ascended (7 layers, plan complete)
 *
 * Each blob layer spins independently via Animated.View with useNativeDriver: true
 * so the animation is silky smooth even when the JS thread is busy.
 *
 * Every phase includes a "liquid glass" highlight overlay that gives the blobs
 * a glossy, frosted-glass appearance.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, G } from 'react-native-svg';
import { looviColors } from './LooviBackground';

// ─── Colour palette (matches app theme) ─────────────────────────────
const PALETTE = {
    coral:     looviColors.coralOrange,   // #E8A87C
    coralDark: '#D97B66',
    sage:      looviColors.accent.success, // #7FB069
    sageDark:  '#5E9A47',
    cream:     '#E8D5C4',                  // warmer cream, more visible against light backgrounds
    lavender:  '#C4B5E0',
    sky:       '#87CEEB',
    gold:      '#F5D76E',
    rose:      '#E8B4C8',
    mint:      '#A8E6CF',
    pearl:     '#F0EAF7',
    aurora:    '#7EC8E3',
};

// ─── Blob path generator ─────────────────────────────────────────────
// grainSeed adds a second harmonic for organic, flower-petal-like texture
const generateBlob = (radius: number, lobes: number, intensity: number, grainSeed: number = 0): string => {
    let d = '';
    const points = 180;
    for (let i = 0; i <= points; i++) {
        const theta = (i * 2 * Math.PI) / points;
        // Primary shape
        let r = radius + intensity * Math.sin(lobes * theta);
        // Grain / petal texture: high-frequency micro-variation
        if (grainSeed > 0) {
            r += grainSeed * Math.sin((lobes * 2 + 3) * theta + 0.7);
            r += (grainSeed * 0.5) * Math.cos((lobes * 3 + 1) * theta + 1.3);
        }
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d + ' Z';
};

// ─── Layer descriptor ────────────────────────────────────────────────
interface BlobLayer {
    radius: number;
    lobes: number;
    intensity: number;
    color: string;
    opacity: number;
    /** Duration of one full rotation in ms */
    speed: number;
    /** true ⇒ clockwise, false ⇒ counter-clockwise */
    clockwise: boolean;
    /** Grain/texture intensity (0 = smooth, 1-4 = subtle to heavy petal texture) */
    grain?: number;
}

// ─── Phase definitions ───────────────────────────────────────────────
// Later phases rotate more slowly (higher speed values) for a majestic feel.
// Grain increases with phase for organic petal/flower texture.
const PHASE_CONFIGS: BlobLayer[][] = [
    // Phase 0 – Tiny seed (Day 0) — coral tones, less transparent
    [
        { radius: 24, lobes: 3, intensity: 5, color: PALETTE.coral, opacity: 0.8, speed: 12000, clockwise: true, grain: 0 },
        { radius: 20, lobes: 4, intensity: 3, color: PALETTE.cream, opacity: 0.65, speed: 16000, clockwise: false, grain: 0 },
    ],
    // Phase 1 – Small sprout (Day 1) — coral/cream, less transparent
    [
        { radius: 28, lobes: 4, intensity: 6, color: PALETTE.coral, opacity: 0.75, speed: 11000, clockwise: true, grain: 0 },
        { radius: 32, lobes: 3, intensity: 5, color: PALETTE.cream, opacity: 0.6, speed: 15000, clockwise: false, grain: 0 },
    ],
    // Phase 2 – Growing (Day 2)
    [
        { radius: 35, lobes: 5, intensity: 8, color: PALETTE.coral, opacity: 0.65, speed: 10000, clockwise: true, grain: 0.5 },
        { radius: 40, lobes: 3, intensity: 7, color: PALETTE.sage, opacity: 0.5, speed: 14000, clockwise: false, grain: 0 },
    ],
    // Phase 3 – Expanding (Day 3)
    [
        { radius: 38, lobes: 5, intensity: 10, color: PALETTE.coral, opacity: 0.7, speed: 10000, clockwise: true, grain: 0.8 },
        { radius: 44, lobes: 3, intensity: 9, color: PALETTE.sage, opacity: 0.55, speed: 14000, clockwise: false, grain: 0.5 },
        { radius: 48, lobes: 4, intensity: 6, color: PALETTE.cream, opacity: 0.4, speed: 17000, clockwise: true, grain: 0 },
    ],
    // Phase 4 – Blooming (Day 5)
    [
        { radius: 42, lobes: 5, intensity: 12, color: PALETTE.coral, opacity: 0.7, speed: 12000, clockwise: true, grain: 1 },
        { radius: 48, lobes: 4, intensity: 10, color: PALETTE.sage, opacity: 0.6, speed: 15000, clockwise: false, grain: 0.8 },
        { radius: 54, lobes: 3, intensity: 8, color: PALETTE.cream, opacity: 0.45, speed: 18000, clockwise: true, grain: 0 },
    ],
    // Phase 5 – Radiant (Day 7)
    [
        { radius: 40, lobes: 6, intensity: 12, color: PALETTE.coralDark, opacity: 0.65, speed: 14000, clockwise: true, grain: 1.2 },
        { radius: 48, lobes: 5, intensity: 14, color: PALETTE.coral, opacity: 0.6, speed: 17000, clockwise: false, grain: 1 },
        { radius: 54, lobes: 3, intensity: 10, color: PALETTE.sage, opacity: 0.55, speed: 20000, clockwise: true, grain: 0.5 },
        { radius: 60, lobes: 4, intensity: 8, color: PALETTE.cream, opacity: 0.4, speed: 24000, clockwise: false, grain: 0 },
    ],
    // Phase 6 – Flourishing (Day 10)
    [
        { radius: 42, lobes: 6, intensity: 14, color: PALETTE.coralDark, opacity: 0.7, speed: 16000, clockwise: true, grain: 1.5 },
        { radius: 50, lobes: 5, intensity: 16, color: PALETTE.coral, opacity: 0.6, speed: 19000, clockwise: false, grain: 1.2 },
        { radius: 56, lobes: 4, intensity: 12, color: PALETTE.sage, opacity: 0.55, speed: 22000, clockwise: true, grain: 0.8 },
        { radius: 64, lobes: 3, intensity: 10, color: PALETTE.lavender, opacity: 0.4, speed: 26000, clockwise: false, grain: 0.5 },
    ],
    // Phase 7 – Vibrant (Day 14)
    [
        { radius: 38, lobes: 7, intensity: 12, color: PALETTE.coralDark, opacity: 0.65, speed: 18000, clockwise: true, grain: 2 },
        { radius: 46, lobes: 6, intensity: 16, color: PALETTE.coral, opacity: 0.6, speed: 21000, clockwise: false, grain: 1.5 },
        { radius: 54, lobes: 5, intensity: 14, color: PALETTE.sage, opacity: 0.55, speed: 24000, clockwise: true, grain: 1 },
        { radius: 62, lobes: 4, intensity: 10, color: PALETTE.lavender, opacity: 0.45, speed: 28000, clockwise: false, grain: 0.8 },
        { radius: 68, lobes: 3, intensity: 8, color: PALETTE.cream, opacity: 0.35, speed: 32000, clockwise: true, grain: 0.5 },
    ],
    // Phase 8 – Majestic (Day 21)
    [
        { radius: 36, lobes: 8, intensity: 10, color: PALETTE.gold, opacity: 0.55, speed: 22000, clockwise: true, grain: 2.5 },
        { radius: 44, lobes: 7, intensity: 14, color: PALETTE.coralDark, opacity: 0.65, speed: 26000, clockwise: false, grain: 2 },
        { radius: 52, lobes: 5, intensity: 16, color: PALETTE.coral, opacity: 0.6, speed: 30000, clockwise: true, grain: 1.5 },
        { radius: 60, lobes: 4, intensity: 12, color: PALETTE.sage, opacity: 0.5, speed: 34000, clockwise: false, grain: 1 },
        { radius: 68, lobes: 3, intensity: 10, color: PALETTE.lavender, opacity: 0.4, speed: 38000, clockwise: true, grain: 0.5 },
    ],
    // Phase 9 – Transcendent (Day 30)
    [
        { radius: 32, lobes: 8, intensity: 8, color: PALETTE.gold, opacity: 0.5, speed: 26000, clockwise: true, grain: 3 },
        { radius: 40, lobes: 7, intensity: 14, color: PALETTE.coralDark, opacity: 0.6, speed: 30000, clockwise: false, grain: 2.5 },
        { radius: 48, lobes: 6, intensity: 16, color: PALETTE.coral, opacity: 0.6, speed: 34000, clockwise: true, grain: 2 },
        { radius: 56, lobes: 5, intensity: 14, color: PALETTE.sage, opacity: 0.55, speed: 38000, clockwise: false, grain: 1.5 },
        { radius: 64, lobes: 4, intensity: 12, color: PALETTE.lavender, opacity: 0.45, speed: 42000, clockwise: true, grain: 1 },
        { radius: 72, lobes: 3, intensity: 10, color: PALETTE.sky, opacity: 0.35, speed: 48000, clockwise: false, grain: 0.5 },
    ],
    // Phase 10 – Luminous (Day 45) — crystalline, adding rose & mint
    [
        { radius: 30, lobes: 9, intensity: 8, color: PALETTE.gold, opacity: 0.5, speed: 30000, clockwise: true, grain: 3 },
        { radius: 38, lobes: 7, intensity: 14, color: PALETTE.coralDark, opacity: 0.6, speed: 34000, clockwise: false, grain: 2.5 },
        { radius: 46, lobes: 6, intensity: 16, color: PALETTE.coral, opacity: 0.55, speed: 38000, clockwise: true, grain: 2 },
        { radius: 54, lobes: 5, intensity: 14, color: PALETTE.rose, opacity: 0.5, speed: 42000, clockwise: false, grain: 1.8 },
        { radius: 62, lobes: 4, intensity: 12, color: PALETTE.sage, opacity: 0.45, speed: 46000, clockwise: true, grain: 1.2 },
        { radius: 70, lobes: 3, intensity: 10, color: PALETTE.mint, opacity: 0.35, speed: 52000, clockwise: false, grain: 0.8 },
    ],
    // Phase 11 – Celestial (Day 60) — ethereal, adding pearl & aurora
    [
        { radius: 28, lobes: 9, intensity: 8, color: PALETTE.gold, opacity: 0.5, speed: 34000, clockwise: true, grain: 3.5 },
        { radius: 36, lobes: 8, intensity: 12, color: PALETTE.coralDark, opacity: 0.55, speed: 38000, clockwise: false, grain: 3 },
        { radius: 44, lobes: 7, intensity: 16, color: PALETTE.coral, opacity: 0.55, speed: 42000, clockwise: true, grain: 2.5 },
        { radius: 52, lobes: 6, intensity: 14, color: PALETTE.rose, opacity: 0.5, speed: 46000, clockwise: false, grain: 2 },
        { radius: 60, lobes: 5, intensity: 12, color: PALETTE.pearl, opacity: 0.45, speed: 50000, clockwise: true, grain: 1.5 },
        { radius: 68, lobes: 4, intensity: 10, color: PALETTE.aurora, opacity: 0.4, speed: 54000, clockwise: false, grain: 1 },
        { radius: 76, lobes: 3, intensity: 8, color: PALETTE.mint, opacity: 0.3, speed: 60000, clockwise: true, grain: 0.5 },
    ],
    // Phase 12 – Ascended (Day 90+) — plan complete, most complex & grand
    [
        { radius: 26, lobes: 10, intensity: 8, color: PALETTE.gold, opacity: 0.55, speed: 38000, clockwise: true, grain: 4 },
        { radius: 34, lobes: 8, intensity: 12, color: PALETTE.coralDark, opacity: 0.55, speed: 42000, clockwise: false, grain: 3.5 },
        { radius: 42, lobes: 7, intensity: 16, color: PALETTE.coral, opacity: 0.55, speed: 46000, clockwise: true, grain: 3 },
        { radius: 50, lobes: 6, intensity: 14, color: PALETTE.rose, opacity: 0.5, speed: 50000, clockwise: false, grain: 2.5 },
        { radius: 58, lobes: 5, intensity: 12, color: PALETTE.lavender, opacity: 0.45, speed: 54000, clockwise: true, grain: 2 },
        { radius: 66, lobes: 4, intensity: 10, color: PALETTE.pearl, opacity: 0.4, speed: 58000, clockwise: false, grain: 1.5 },
        { radius: 74, lobes: 3, intensity: 8, color: PALETTE.aurora, opacity: 0.35, speed: 64000, clockwise: true, grain: 1 },
    ],
];

// ─── Day → Phase mapping ─────────────────────────────────────────────
const DAY_THRESHOLDS = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90];

function getPhaseIndex(daysSugarFree: number): number {
    for (let i = DAY_THRESHOLDS.length - 1; i >= 0; i--) {
        if (daysSugarFree >= DAY_THRESHOLDS[i]) return i;
    }
    return 0;
}

// ─── Single spinning blob component ──────────────────────────────────
interface SpinningBlobProps {
    layer: BlobLayer;
    layerIndex: number;
    phaseIndex: number;
    containerSize: number;
}

const SpinningBlob = React.memo(({ layer, layerIndex, phaseIndex, containerSize }: SpinningBlobProps) => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const blobPath = useMemo(
        () => generateBlob(layer.radius, layer.lobes, layer.intensity, layer.grain ?? 0),
        [layer.radius, layer.lobes, layer.intensity, layer.grain]
    );

    // The SVG viewBox needs to be large enough for the blob
    const svgSize = (layer.radius + layer.intensity) * 2 + 20;
    const halfSvg = svgSize / 2;

    useEffect(() => {
        spinAnim.setValue(0);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: layer.speed,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Fade in when phase changes
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [phaseIndex]);

    const rotation = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: layer.clockwise ? ['0deg', '360deg'] : ['0deg', '-360deg'],
    });

    const gradientId = `phaseGrad_${phaseIndex}_${layerIndex}`;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: containerSize,
                height: containerSize,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, layer.opacity],
                }),
                transform: [{ rotate: rotation }],
            }}
        >
            <Svg width={containerSize} height={containerSize} viewBox={`${-halfSvg} ${-halfSvg} ${svgSize} ${svgSize}`}>
                <Defs>
                    <RadialGradient
                        id={gradientId}
                        cx="0%"
                        cy="0%"
                        rx="100%"
                        ry="100%"
                        fx="0%"
                        fy="0%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0" stopColor={layer.color} stopOpacity="1" />
                        <Stop offset="0.7" stopColor={layer.color} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={layer.color} stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Path d={blobPath} fill={`url(#${gradientId})`} />
            </Svg>
        </Animated.View>
    );
});

// ─── Liquid glass highlight overlay ──────────────────────────────────
// A glossy, frosted-glass highlight that slowly orbits over the blobs,
// giving a reflective "liquid glass" sheen.
interface GlassHighlightProps {
    phaseIndex: number;
    containerSize: number;
}

const GlassHighlight = React.memo(({ phaseIndex, containerSize }: GlassHighlightProps) => {
    const orbitAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slow orbit — highlight drifts around the blob surface
        Animated.loop(
            Animated.timing(orbitAnim, {
                toValue: 1,
                duration: 18000 + phaseIndex * 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Shimmer — opacity pulses gently
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [phaseIndex]);

    const rotation = orbitAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Glass highlight scales with the phase
    const highlightSize = 30 + phaseIndex * 5;
    const highlightOpacity = 0.18 + phaseIndex * 0.015; // subtle but grows

    const half = containerSize / 2;
    // Highlight ellipse is offset upward and to the left for a "light source from top-left" feel
    const offsetX = -highlightSize * 0.3;
    const offsetY = -highlightSize * 0.5;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: containerSize,
                height: containerSize,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [highlightOpacity * 0.6, highlightOpacity],
                }),
                transform: [{ rotate: rotation }],
            }}
        >
            <Svg width={containerSize} height={containerSize} viewBox={`${-half} ${-half} ${containerSize} ${containerSize}`}>
                <Defs>
                    <RadialGradient
                        id={`glass_${phaseIndex}`}
                        cx="50%"
                        cy="30%"
                        rx="50%"
                        ry="50%"
                    >
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.35" />
                        <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.08" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                    </RadialGradient>
                    <LinearGradient id={`glassEdge_${phaseIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
                        <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.05" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.15" />
                    </LinearGradient>
                </Defs>
                {/* Main glass highlight – elliptical "light reflection" */}
                <Ellipse
                    cx={offsetX}
                    cy={offsetY}
                    rx={highlightSize * 0.9}
                    ry={highlightSize * 0.55}
                    fill={`url(#glass_${phaseIndex})`}
                />
                {/* Secondary smaller specular dot */}
                <Ellipse
                    cx={offsetX + highlightSize * 0.2}
                    cy={offsetY + highlightSize * 0.15}
                    rx={highlightSize * 0.25}
                    ry={highlightSize * 0.15}
                    fill="#FFFFFF"
                    opacity={0.4}
                />
                {/* Subtle glass rim arc */}
                <Circle
                    cx={0}
                    cy={0}
                    r={highlightSize * 1.1}
                    fill="none"
                    stroke={`url(#glassEdge_${phaseIndex})`}
                    strokeWidth={1.5}
                    opacity={0.3}
                />
            </Svg>
        </Animated.View>
    );
});

// ─── Center glow dot ─────────────────────────────────────────────────
const CenterGlow = React.memo(({ phaseIndex, containerSize }: { phaseIndex: number; containerSize: number }) => {
    const pulseAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // The center dot grows with the phase
    const dotRadius = 4 + phaseIndex * 1.2;
    const glowRadius = 12 + phaseIndex * 3;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: containerSize,
                height: containerSize,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pulseAnim,
            }}
        >
            <Svg width={containerSize} height={containerSize} viewBox={`${-containerSize / 2} ${-containerSize / 2} ${containerSize} ${containerSize}`}>
                <Defs>
                    <RadialGradient id="centerGlow" cx="0" cy="0" rx={String(glowRadius)} ry={String(glowRadius)} fx="0" fy="0" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <Stop offset="0.5" stopColor={PALETTE.coral} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={PALETTE.coral} stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Circle cx="0" cy="0" r={glowRadius} fill="url(#centerGlow)" />
                <Circle cx="0" cy="0" r={dotRadius} fill="rgba(255,255,255,0.85)" />
            </Svg>
        </Animated.View>
    );
});

// ─── Main component ──────────────────────────────────────────────────
interface PhaseAnimationProps {
    daysSugarFree: number;
    /** Overall size of the animation container (default 160) */
    size?: number;
}

export function PhaseAnimation({ daysSugarFree, size = 160 }: PhaseAnimationProps) {
    const phaseIndex = getPhaseIndex(daysSugarFree);
    const layers = PHASE_CONFIGS[phaseIndex];

    // Scale multiplier: phases grow from ~60% to 100% of the container
    const totalPhases = PHASE_CONFIGS.length - 1;
    const scaleFactor = 0.55 + (phaseIndex / totalPhases) * 0.45;
    const containerSize = Math.round(size * scaleFactor * 1.6); // extra room for blob radius + intensity

    return (
        <View style={[styles.wrapper, { width: size, height: size }]}>
            <View style={[styles.blobContainer, { width: containerSize, height: containerSize }]}>
                {layers.map((layer, idx) => (
                    <SpinningBlob
                        key={`${phaseIndex}_${idx}`}
                        layer={layer}
                        layerIndex={idx}
                        phaseIndex={phaseIndex}
                        containerSize={containerSize}
                    />
                ))}
                {/* Liquid glass highlight on top of blobs */}
                <GlassHighlight phaseIndex={phaseIndex} containerSize={containerSize} />
                <CenterGlow phaseIndex={phaseIndex} containerSize={containerSize} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    blobContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default PhaseAnimation;
