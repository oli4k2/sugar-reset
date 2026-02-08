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
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { looviColors } from '../components/LooviBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIGNATURE_WIDTH = SCREEN_WIDTH - (spacing.screen.horizontal * 2);
const SIGNATURE_HEIGHT = 200;

interface SignatureFieldProps {
    onSignatureChange?: (hasSignature: boolean) => void;
    onBegin?: () => void;
    onEnd?: () => void;
}

export default function SignatureField({ onSignatureChange, onBegin, onEnd }: SignatureFieldProps) {
    const [paths, setPaths] = useState<Array<{ path: string; key: string }>>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const pathKeyRef = useRef(0);
    const currentPathRef = useRef<string>('');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:42',message:'onPanResponderGrant called',data:{hasOnBegin:!!onBegin},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
                // #endregion
                onBegin?.();
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:44',message:'onBegin called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
                // #endregion
                const { locationX, locationY } = evt.nativeEvent;
                // Clamp coordinates to signature area bounds
                const x = Math.max(0, Math.min(locationX, SIGNATURE_WIDTH));
                const y = Math.max(0, Math.min(locationY, SIGNATURE_HEIGHT));
                const newPath = `M${x},${y}`;
                currentPathRef.current = newPath;
                setCurrentPath(newPath);
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:49',message:'currentPath set',data:{newPath,pathLength:newPath.length,refPath:currentPathRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8',runId:'post-fix'})}).catch(()=>{});
                // #endregion
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                // Clamp coordinates to signature area bounds
                const x = Math.max(0, Math.min(locationX, SIGNATURE_WIDTH));
                const y = Math.max(0, Math.min(locationY, SIGNATURE_HEIGHT));
                const updatedPath = currentPathRef.current ? `${currentPathRef.current} L${x},${y}` : `M${x},${y}`;
                currentPathRef.current = updatedPath;
                setCurrentPath(updatedPath);
            },
            onPanResponderRelease: () => {
                const pathToSave = currentPathRef.current;
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:61',message:'onPanResponderRelease called',data:{currentPathLength:currentPath.length,refPathLength:pathToSave.length,hasOnEnd:!!onEnd},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H6',runId:'post-fix'})}).catch(()=>{});
                // #endregion
                onEnd?.();
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:63',message:'onEnd called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
                // #endregion
                if (pathToSave && pathToSave.length > 2) {
                    // #region agent log
                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:64',message:'Path check passed, adding to paths',data:{pathToSave:pathToSave.substring(0,50),pathLength:pathToSave.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6,H7',runId:'post-fix'})}).catch(()=>{});
                    // #endregion
                    const newPath = {
                        path: pathToSave,
                        key: `path-${pathKeyRef.current++}`,
                    };
                    setPaths((prev) => [...prev, newPath]);
                    currentPathRef.current = '';
                    setCurrentPath('');
                    // #region agent log
                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:70',message:'Calling onSignatureChange(true)',data:{hasCallback:!!onSignatureChange},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8',runId:'post-fix'})}).catch(()=>{});
                    // #endregion
                    onSignatureChange?.(true);
                } else {
                    // #region agent log
                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:72',message:'Path check FAILED, discarding',data:{pathToSave:pathToSave.substring(0,50),pathLength:pathToSave.length,hasPath:!!pathToSave},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6,H9',runId:'post-fix'})}).catch(()=>{});
                    // #endregion
                    currentPathRef.current = '';
                    setCurrentPath('');
                }
            },
            onPanResponderTerminate: () => {
                onEnd?.();
                currentPathRef.current = '';
                setCurrentPath('');
            },
        })
    ).current;

    const handleReset = () => {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignatureField.tsx:82',message:'handleReset called',data:{pathsCount:paths.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H7',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        setPaths([]);
        currentPathRef.current = '';
        setCurrentPath('');
        pathKeyRef.current = 0;
        onSignatureChange?.(false);
    };

    const hasSignature = paths.length > 0 || currentPath.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Sign your promise</Text>
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
            <View style={styles.signatureContainer} {...panResponder.panHandlers}>
                <Svg
                    width={SIGNATURE_WIDTH}
                    height={SIGNATURE_HEIGHT}
                    style={styles.svg}
                >
                    {paths.map((pathData) => (
                        <Path
                            key={pathData.key}
                            d={pathData.path}
                            stroke={looviColors.text.primary}
                            strokeWidth={2}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {currentPath && (
                        <Path
                            d={currentPath}
                            stroke={looviColors.text.primary}
                            strokeWidth={2}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </Svg>
                {!hasSignature && (
                    <View style={styles.placeholder}>
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
        height: SIGNATURE_HEIGHT,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
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
