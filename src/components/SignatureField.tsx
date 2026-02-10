/**
 * SignatureField
 * 
 * Allows users to draw/sign their signature on a canvas.
 */

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
    Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { looviColors } from '../components/LooviBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIGNATURE_WIDTH = SCREEN_WIDTH - (spacing.screen.horizontal * 2);
const CANVAS_HEIGHT = 300;

interface SignatureFieldProps {
    onSignatureChange?: (hasSignature: boolean) => void;
    onBegin?: () => void;
    onEnd?: () => void;
    label?: string;
}

export default function SignatureField({ onSignatureChange, onBegin, onEnd, label = 'Sign your promise' }: SignatureFieldProps) {
    const [paths, setPaths] = useState<Array<{ points: Array<{ x: number; y: number; width: number }>; key: string }>>([]);
    const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number; width: number }>>([]);
    const pathKeyRef = useRef(0);
    const currentPointsRef = useRef<Array<{ x: number; y: number; width: number }>>([]);
    const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                onBegin?.();
                const { locationX, locationY } = evt.nativeEvent;
                const x = Math.max(0, Math.min(locationX, SIGNATURE_WIDTH));
                const y = Math.max(0, Math.min(locationY, CANVAS_HEIGHT));

                const newPoint = { x, y, width: 3.5 };
                currentPointsRef.current = [newPoint];
                setCurrentPoints([newPoint]);
                lastPointRef.current = { x, y, time: Date.now() };
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const x = Math.max(0, Math.min(locationX, SIGNATURE_WIDTH));
                const y = Math.max(0, Math.min(locationY, CANVAS_HEIGHT));

                let width = 4.5;
                if (lastPointRef.current) {
                    const now = Date.now();
                    const timeDelta = Math.max(now - lastPointRef.current.time, 1);
                    const distance = Math.sqrt(
                        Math.pow(x - lastPointRef.current.x, 2) +
                        Math.pow(y - lastPointRef.current.y, 2)
                    );
                    const velocity = distance / timeDelta;

                    // Slower = thicker (like pressing harder), faster = thinner
                    // Very dramatic range for realistic handwriting effect
                    const targetWidth = Math.max(1, Math.min(7, 7 - velocity * 3.0));

                    // Smooth the width change to prevent jittery lines
                    const prevWidth = currentPointsRef.current.length > 0
                        ? currentPointsRef.current[currentPointsRef.current.length - 1].width
                        : 4.5;
                    width = prevWidth * 0.6 + targetWidth * 0.4;

                    lastPointRef.current = { x, y, time: now };
                }

                const newPoint = { x, y, width };
                currentPointsRef.current = [...currentPointsRef.current, newPoint];
                setCurrentPoints([...currentPointsRef.current]);
            },
            onPanResponderRelease: () => {
                onEnd?.();
                const pointsToSave = currentPointsRef.current;

                if (pointsToSave && pointsToSave.length > 1) {
                    const newPath = {
                        points: pointsToSave,
                        key: `path-${pathKeyRef.current++}`,
                    };
                    setPaths((prev) => [...prev, newPath]);
                    currentPointsRef.current = [];
                    setCurrentPoints([]);
                    lastPointRef.current = null;
                    onSignatureChange?.(true);
                } else {
                    currentPointsRef.current = [];
                    setCurrentPoints([]);
                    lastPointRef.current = null;
                }
            },
            onPanResponderTerminate: () => {
                onEnd?.();
                currentPointsRef.current = [];
                setCurrentPoints([]);
                lastPointRef.current = null;
            },
        })
    ).current;

    const handleReset = () => {
        setPaths([]);
        currentPointsRef.current = [];
        setCurrentPoints([]);
        pathKeyRef.current = 0;
        lastPointRef.current = null;
        onSignatureChange?.(false);
    };

    const hasSignature = paths.length > 0 || currentPoints.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                {hasSignature && (
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={20} color={looviColors.accent.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={[styles.signatureContainer, { backgroundColor: '#ffffff' }]} {...panResponder.panHandlers}>
                <Svg
                    width={SIGNATURE_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={styles.svg}
                    pointerEvents="none"
                >
                    {/* Render completed paths */}
                    {paths.map((pathData) => {
                        if (pathData.points.length === 0) return null;

                        return (
                            <React.Fragment key={pathData.key}>
                                {/* Render each segment with its width */}
                                {pathData.points.map((point, index) => {
                                    if (index === 0) {
                                        // First point - just a circle
                                        return (
                                            <Circle
                                                key={`${pathData.key}-${index}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={point.width / 2}
                                                fill="#1a1a2e"
                                            />
                                        );
                                    }

                                    const prevPoint = pathData.points[index - 1];
                                    return (
                                        <React.Fragment key={`${pathData.key}-${index}`}>
                                            {/* Line segment */}
                                            <Line
                                                x1={prevPoint.x}
                                                y1={prevPoint.y}
                                                x2={point.x}
                                                y2={point.y}
                                                stroke="#1a1a2e"
                                                strokeWidth={(prevPoint.width + point.width) / 2}
                                                strokeLinecap="round"
                                            />
                                            {/* Point circle for smooth joins */}
                                            <Circle
                                                cx={point.x}
                                                cy={point.y}
                                                r={point.width / 2}
                                                fill="#1a1a2e"
                                            />
                                        </React.Fragment>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}

                    {/* Render current drawing path */}
                    {currentPoints.length > 0 && (
                        <React.Fragment>
                            {currentPoints.map((point, index) => {
                                if (index === 0) {
                                    return (
                                        <Circle
                                            key={`current-${index}`}
                                            cx={point.x}
                                            cy={point.y}
                                            r={point.width / 2}
                                            fill="#1a1a2e"
                                        />
                                    );
                                }

                                const prevPoint = currentPoints[index - 1];
                                return (
                                    <React.Fragment key={`current-${index}`}>
                                        <Line
                                            x1={prevPoint.x}
                                            y1={prevPoint.y}
                                            x2={point.x}
                                            y2={point.y}
                                            stroke="#1a1a2e"
                                            strokeWidth={(prevPoint.width + point.width) / 2}
                                            strokeLinecap="round"
                                        />
                                        <Circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={point.width / 2}
                                            fill="#1a1a2e"
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    )}
                </Svg>
                {!hasSignature && (
                    <View style={styles.placeholder} pointerEvents="none">
                        <Text style={styles.placeholderText}>
                            Draw your signature here
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        width: '100%',
        position: 'relative',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    resetButton: {
        padding: spacing.xs,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginLeft: spacing.sm,
    },
    // Removed resetButtonText since we use an icon now
    signatureContainer: {
        width: SIGNATURE_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        opacity: 1, // Force opacity
        borderRadius: 16,
        borderWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    placeholder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
});
