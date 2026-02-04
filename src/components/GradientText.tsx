/**
 * GradientText Component
 * 
 * Creates text with a modern gradient effect using SVG.
 * Supports multi-line text by splitting words based on estimated width.
 */

import React from 'react';
import { View, StyleSheet, TextStyle, Dimensions } from 'react-native';
import Svg, { Text as SvgText, TSpan, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GradientTextProps {
    text: string;
    colors?: string[];
    fontSize?: number;
    fontWeight?: TextStyle['fontWeight'];
    fontStyle?: TextStyle['fontStyle'];
    style?: any;
    maxWidth?: number;
}

export function GradientText({
    text,
    colors = ['#E8A87C', '#A8D8E8'], // Coral to sky blue
    fontSize = 36,
    fontWeight = '800',
    fontStyle = 'normal',
    style,
    maxWidth,
}: GradientTextProps) {
    const availableWidth = maxWidth || SCREEN_WIDTH - 60;
    const lineHeight = fontSize * 1.3;
    
    // More accurate chars per line estimate (depends on font weight and size)
    // For Outfit/Inter bold, roughly 0.6 of fontSize per char average
    const charsPerLine = Math.floor(availableWidth / (fontSize * 0.6));
    
    const splitLines = text.split('\n');
    const lines: string[] = [];
    
    splitLines.forEach(lineText => {
        const words = lineText.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + word).length > charsPerLine && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }
    });

    const svgHeight = lines.length * lineHeight + (fontSize * 0.2); // Add some buffer

    return (
        <View style={[styles.container, style, { width: availableWidth, height: svgHeight }]}>
            <Svg height={svgHeight} width={availableWidth} viewBox={`0 0 ${availableWidth} ${svgHeight}`}>
                <Defs>
                    <LinearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        {colors.map((color, index) => (
                            <Stop
                                key={index}
                                offset={`${(index / (colors.length - 1)) * 100}%`}
                                stopColor={color}
                            />
                        ))}
                    </LinearGradient>
                </Defs>
                <SvgText
                    fill="url(#textGradient)"
                    fontSize={fontSize}
                    fontWeight={fontWeight as string}
                    fontStyle={fontStyle}
                    x={availableWidth / 2}
                    y={fontSize}
                    textAnchor="middle"
                >
                    {lines.map((line, index) => (
                        <TSpan
                            key={index}
                            x={availableWidth / 2}
                            dy={index === 0 ? 0 : lineHeight}
                        >
                            {line}
                        </TSpan>
                    ))}
                </SvgText>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default GradientText;
