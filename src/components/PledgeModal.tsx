import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, RadialGradient, Stop, G, Circle } from 'react-native-svg';
import LooviBackground, { looviColors } from './LooviBackground';

/**
 * PledgeModal - "The Daily Contract"
 * 
 * Design Philosophy:
 * - Matches app aesthetic (Clean, Loovi colors).
 * - High-end "Ceremonial" feel.
 * - Under-screen sensor metaphor.
 * - Full-screen immersive experience.
 * 
 * Performance: Spinning blob rotations use Animated.View wrappers with
 * useNativeDriver: true so the UI thread handles them at 60 fps without
 * blocking the JS thread (which runs haptics & state changes).
 */

interface PledgeModalProps {
    visible: boolean;
    onClose: () => void;
    onPledgeComplete: () => void;
}

const BUTTON_SIZE = 80;
const DURATION = 1700;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Using app-matching colors from looviColors theme
const PLEDGE_COLORS = {
    coral: looviColors.coralOrange,      // Primary coral accent (#E8A87C)
    sage: looviColors.accent.success,    // Sage green (#7FB069)
    cream: looviColors.warmBeige,        // Warm beige (#F2E4D8)
    white: '#FFFFFF',
};

// --- GEOMETRY GENERATOR ---
const generateBlob = (radius: number, lobes: number, intensity: number) => {
    let d = '';
    const points = 360;
    for (let i = 0; i <= points; i++) {
        const theta = (i * Math.PI) / 180;
        const r = radius + (intensity * Math.sin(lobes * theta));
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        if (i === 0) d += `M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
    }
    d += ' Z';
    return d;
};

export const PledgeModal: React.FC<PledgeModalProps> = ({ visible, onClose, onPledgeComplete }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Animation Drivers
    const progressDriver = useRef(new Animated.Value(0)).current;

    // Continuous Spinners – driven on the native thread (useNativeDriver: true)
    const spin1 = useRef(new Animated.Value(0)).current;
    const spin2 = useRef(new Animated.Value(0)).current;
    const spin3 = useRef(new Animated.Value(0)).current;

    // Reactivity (these drive scale/translate on the lotus container which is non-native because of SVG)
    const elasticScale = useRef(new Animated.Value(0.5)).current;
    const tensionDriver = useRef(new Animated.Value(0)).current;
    const sensorLightDriver = useRef(new Animated.Value(0)).current;
    const glowFlicker = useRef(new Animated.Value(0)).current;
    const lensBloomDriver = useRef(new Animated.Value(0)).current;

    // Swipe to dismiss
    const swipePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 && !isCompleted) {
                    onClose();
                }
            },
        })
    ).current;

    // Success Animations – use native driver for smooth crossfade
    const flashAnim = useRef(new Animated.Value(0)).current;
    const rewardOpacity = useRef(new Animated.Value(0)).current;
    const rewardTranslateY = useRef(new Animated.Value(40)).current;
    const hapticTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Geometry
    const blobCoral = generateBlob(100, 5, 20);
    const blobSage = generateBlob(105, 3, 25);
    const blobCream = generateBlob(110, 4, 15);

    useEffect(() => {
        if (visible) {
            resetState();
            startVibrantMotion();
        }
    }, [visible]);

    const resetState = () => {
        setIsHolding(false);
        setIsCompleted(false);
        progressDriver.setValue(0);
        lensBloomDriver.setValue(0);

        tensionDriver.setValue(0);
        elasticScale.setValue(0.5);
        sensorLightDriver.setValue(0);

        // Reset Success
        flashAnim.setValue(0);
        rewardOpacity.setValue(0);
        rewardTranslateY.setValue(40);
    };

    const startVibrantMotion = () => {
        // Spinning animations on native thread for smooth 60 fps rotation
        Animated.loop(Animated.timing(spin1, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(spin3, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })).start();

        // Glow flicker is subtle & infrequent – keep on JS thread (drives opacity on SVG)
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowFlicker, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(glowFlicker, { toValue: 0.4, duration: 1200, useNativeDriver: false }),
            ])
        ).start();
    };

    const runHapticLoop = () => {
        if (!startTimeRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const p = Math.min(elapsed / DURATION, 1);
        // Gentler haptic timing: less frequent to avoid JS-thread stalls
        const delay = Math.max(150, 350 * (1 - p) + 150);

        if (p >= 1) return;
        if (p > 0.8) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else if (p > 0.4) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        hapticTimeoutRef.current = setTimeout(runHapticLoop, delay);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                if (isCompleted) return;
                setIsHolding(true);
                startTimeRef.current = Date.now();
                runHapticLoop();

                // 1. Elastic Growth 
                Animated.timing(elasticScale, {
                    toValue: 2.8,
                    duration: DURATION,
                    easing: Easing.out(Easing.poly(5)),
                    useNativeDriver: false,
                }).start();

                // 2. Jitter – slower intervals for smoother feel
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(tensionDriver, { toValue: 1, duration: 120, useNativeDriver: false }),
                        Animated.timing(tensionDriver, { toValue: -1, duration: 120, useNativeDriver: false }),
                    ])
                ).start();

                // 3. Sensor Flash
                Animated.timing(sensorLightDriver, {
                    toValue: 1,
                    duration: 100,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }).start();

                // 4. Bloom
                Animated.timing(lensBloomDriver, {
                    toValue: 1,
                    duration: DURATION,
                    easing: Easing.quad,
                    useNativeDriver: false,
                }).start();

                Animated.timing(progressDriver, {
                    toValue: 1,
                    duration: DURATION,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }).start(({ finished }) => {
                    if (finished) handleSuccess();
                });
            },
            onPanResponderRelease: () => cancelPledge(),
            onPanResponderTerminate: () => cancelPledge(),
        })
    ).current;

    const cancelPledge = () => {
        if (isCompleted) return;
        setIsHolding(false);
        if (hapticTimeoutRef.current) clearTimeout(hapticTimeoutRef.current);
        startTimeRef.current = 0;

        tensionDriver.stopAnimation();
        tensionDriver.setValue(0);

        Animated.parallel([
            Animated.timing(progressDriver, { toValue: 0, duration: 400, useNativeDriver: false }),
            Animated.spring(elasticScale, { toValue: 0.5, friction: 8, tension: 20, useNativeDriver: false }),
            Animated.timing(lensBloomDriver, { toValue: 0, duration: 400, useNativeDriver: false }),
            Animated.timing(sensorLightDriver, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
    };

    const handleSuccess = () => {
        if (hapticTimeoutRef.current) clearTimeout(hapticTimeoutRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Switch to completed state FIRST (renders success content behind flash)
        setIsCompleted(true);

        // Brief flash then smooth crossfade reveal (no white glitch)
        Animated.sequence([
            // Quick flash to white
            Animated.timing(flashAnim, {
                toValue: 1,
                duration: 120,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            // Small hold so the success UI is fully mounted
            Animated.delay(50),
            // Fade flash out while sliding in reward content
            Animated.parallel([
                Animated.timing(flashAnim, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(rewardOpacity, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.spring(rewardTranslateY, {
                    toValue: 0,
                    friction: 14,
                    tension: 50,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };


    // --- INTERPOLATIONS ---
    const jitterX = tensionDriver.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });
    const jitterY = tensionDriver.interpolate({ inputRange: [-1, 1], outputRange: [-1, 1] });

    // Spin interpolations (native-driver compatible)
    const spinRotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const spinRotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
    const spinRotate3 = spin3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    // Shared blob SVG renderer – each blob is wrapped in its own Animated.View for native rotation
    const renderBlobLayer = (
        blobPath: string,
        gradId: string,
        color: string,
        rotation: Animated.AnimatedInterpolation<string>,
        opacity: number = 1,
    ) => (
        <Animated.View
            style={{
                position: 'absolute',
                width: 400,
                height: 400,
                transform: [{ rotate: rotation }],
            }}
        >
            <Svg width="400" height="400" viewBox="-200 -200 400 400">
                <Defs>
                    <RadialGradient id={gradId} cx="0%" cy="0%" rx="100%" ry="100%" fx="0%" fy="0%" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor={color} stopOpacity="0.8" />
                        <Stop offset="1" stopColor={color} stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Path d={blobPath} fill={`url(#${gradId})`} opacity={opacity} />
            </Svg>
        </Animated.View>
    );


    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.container} {...swipePanResponder.panHandlers}>
                <LooviBackground variant="coralTop">
                    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                        {/* Content Container */}
                        <View style={styles.content}>

                            {/* --- HEADER --- */}
                            {!isCompleted && (
                                <View style={styles.header}>
                                    <View style={styles.iconBadge}>
                                        <Feather name="sun" size={20} color={looviColors.accent.primary} />
                                    </View>
                                    <Text style={styles.title}>Morning Pledge</Text>
                                    <Text style={styles.subtitle}>Set your intention for the day.</Text>
                                </View>
                            )}

                            {/* --- PROMISE TEXT --- */}
                            {!isCompleted && (
                                <View style={styles.promiseContainer}>
                                    <View style={styles.promiseBox}>
                                        <Text style={styles.promiseText}>
                                            "I choose <Text style={styles.promiseHighlight}>clarity</Text> over sugar."
                                        </Text>
                                        <Text style={styles.promiseSubtext}>
                                            This is a contract with myself.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* --- SENSOR SEAL (Bottom) --- */}
                            {!isCompleted && (
                                <View style={styles.sensorArea}>
                                    {/* Line & Label */}
                                    <View style={styles.signatureContainer}>
                                        <View style={styles.signatureLine} />
                                        <Text style={styles.sealLabel}>HOLD TO SEAL</Text>
                                    </View>

                                    <View style={styles.hub}>

                                        {/* LOTUS AURA (Underneath) – each blob rotated via native-driver Animated.View */}
                                        <Animated.View style={[
                                            styles.lotusContainer,
                                            {
                                                opacity: elasticScale.interpolate({ inputRange: [0.5, 0.7, 1], outputRange: [0.6, 1, 1] }),
                                                transform: [{ scale: elasticScale }, { translateX: jitterX }, { translateY: jitterY }]
                                            }
                                        ]}>
                                            {renderBlobLayer(blobCoral, 'gradCoral', PLEDGE_COLORS.coral, spinRotate1)}
                                            {renderBlobLayer(blobSage, 'gradSage', PLEDGE_COLORS.sage, spinRotate2, 0.9)}
                                            {renderBlobLayer(blobCream, 'gradCream', PLEDGE_COLORS.cream, spinRotate3, 0.8)}
                                        </Animated.View>

                                        {/* ATMOSPHERIC GLOW */}
                                        <Animated.View style={{
                                            position: 'absolute',
                                            width: 300,
                                            height: 300,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            opacity: sensorLightDriver,
                                            transform: [{ scale: glowFlicker.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1.45] }) }]
                                        }}>
                                            <Svg height="300" width="300" viewBox="-150 -150 300 300">
                                                <Defs>
                                                    <RadialGradient id="sensorGlow" cx="0" cy="0" rx="150" ry="150" fx="0" fy="0" gradientUnits="userSpaceOnUse">
                                                        <Stop offset="0" stopColor="#FFF" stopOpacity="0.8" />
                                                        <Stop offset="0.3" stopColor="#FFF" stopOpacity="0.3" />
                                                        <Stop offset="0.6" stopColor="#00FFFF" stopOpacity="0.1" />
                                                        <Stop offset="1" stopColor="transparent" stopOpacity="0" />
                                                    </RadialGradient>
                                                </Defs>
                                                <Circle cx="0" cy="0" r="150" fill="url(#sensorGlow)" />
                                            </Svg>
                                        </Animated.View>

                                        {/* GLASS BUTTON */}
                                        <Animated.View
                                            {...panResponder.panHandlers}
                                            style={[
                                                styles.glassButton,
                                                {
                                                    backgroundColor: isHolding ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.95)'
                                                }
                                            ]}
                                        >
                                            <Animated.View style={[
                                                StyleSheet.absoluteFill,
                                                {
                                                    backgroundColor: '#FFF',
                                                    borderRadius: BUTTON_SIZE / 2,
                                                    opacity: sensorLightDriver,
                                                    shadowColor: "#00FFFF",
                                                    shadowOffset: { width: 0, height: 0 },
                                                    shadowOpacity: 1,
                                                    shadowRadius: 20,
                                                    elevation: 10,
                                                }
                                            ]} />
                                        </Animated.View>

                                        {/* BLOOM */}
                                        <Animated.View
                                            pointerEvents="none"
                                            style={[styles.bloomOverlay, {
                                                opacity: lensBloomDriver,
                                                transform: [{ scale: Animated.add(1, lensBloomDriver) }]
                                            }]}
                                        >
                                            <LinearGradient colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0)']} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
                                        </Animated.View>

                                    </View>

                                    {/* Cancel link */}
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={styles.cancelLink}
                                        hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
                                    >
                                        <Text style={styles.cancelLinkText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* --- SUCCESS CENTER (Centered, Integrated) --- */}
                            {isCompleted && (
                                <Animated.View style={[
                                    styles.successCenter,
                                    {
                                        opacity: rewardOpacity,
                                        transform: [{ translateY: rewardTranslateY }],
                                    }
                                ]}>
                                    <View style={styles.successSealContainer}>

                                        {/* Living Lotus Aura (Behind Seal) */}
                                        <View style={[
                                            styles.lotusContainer,
                                            {
                                                transform: [{ scale: 0.6 }],
                                                opacity: 0.8,
                                            }
                                        ]}>
                                            {renderBlobLayer(blobCoral, 'gradCoralS', PLEDGE_COLORS.coral, spinRotate1)}
                                            {renderBlobLayer(blobSage, 'gradSageS', PLEDGE_COLORS.sage, spinRotate2, 0.9)}
                                            {renderBlobLayer(blobCream, 'gradCreamS', PLEDGE_COLORS.cream, spinRotate3, 0.8)}
                                        </View>

                                        <View style={styles.glassButtonSuccess}>
                                            <View style={[
                                                StyleSheet.absoluteFill,
                                                {
                                                    backgroundColor: '#FFF',
                                                    borderRadius: BUTTON_SIZE / 2,
                                                    shadowColor: "#00FFFF",
                                                    shadowOffset: { width: 0, height: 0 },
                                                    shadowOpacity: 0.6,
                                                    shadowRadius: 20,
                                                    elevation: 10,
                                                }
                                            ]} />
                                            {/* Inner "Sealed" Indicator */}
                                            <View style={{
                                                width: BUTTON_SIZE * 0.4,
                                                height: BUTTON_SIZE * 0.4,
                                                borderRadius: BUTTON_SIZE * 0.2,
                                                backgroundColor: looviColors.accent.primary,
                                                opacity: 0.8
                                            }} />
                                        </View>
                                    </View>

                                    <Text style={styles.sealedTitle}>AGREEMENT SEALED</Text>

                                    <Text style={styles.sealedBody}>
                                        "A moment of clarity is worth more than a lifetime of sugar."
                                    </Text>

                                    <TouchableOpacity style={styles.doneButton} onPress={() => { onPledgeComplete(); onClose(); }}>
                                        <Text style={styles.doneButtonText}>Done</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            {/* --- FLASH OVERLAY --- */}
                            <Animated.View style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: 'white',
                                    opacity: flashAnim,
                                    zIndex: 100,
                                    pointerEvents: 'none',
                                }
                            ]} />
                        </View>


                    </SafeAreaView>
                </LooviBackground>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: SCREEN_WIDTH < 380 ? 22 : 26,
        fontWeight: '800',
        color: looviColors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: looviColors.text.tertiary,
    },
    promiseContainer: {
        paddingHorizontal: 24,
        alignItems: 'center',
        width: '100%',
    },
    promiseBox: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    promiseText: {
        fontSize: 32,
        fontWeight: '300',
        color: looviColors.text.primary,
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
    },
    promiseHighlight: {
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    promiseSubtext: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
    sensorArea: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.08,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        zIndex: 5,
    },
    signatureContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: 40,
        zIndex: 10,
    },
    signatureLine: {
        width: 140,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 12,
    },
    sealLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: looviColors.text.tertiary,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    hub: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    lotusContainer: {
        position: 'absolute',
        width: 400,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    glassButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: '#FFF',
        zIndex: 20,
    },
    bloomOverlay: {
        position: 'absolute',
        width: BUTTON_SIZE + 40,
        height: BUTTON_SIZE + 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
    },
    successCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        zIndex: 200,
        marginBottom: 60,
    },
    successSealContainer: {
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassButtonSuccess: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        backgroundColor: '#FFF',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    sealedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: looviColors.text.primary,
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    sealedBody: {
        fontSize: 18,
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 28,
        fontWeight: '500',
        opacity: 0.8,
    },
    doneButton: {
        backgroundColor: looviColors.text.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    doneButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 18,
    },
    cancelLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    cancelLinkText: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
});
