import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export type BadgeType = 'live' | 'offline' | 'checking';

interface StatusBadgeProps {
  type: BadgeType;
  inline?: boolean;
}

export function StatusBadge({ type, inline = false }: StatusBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (type === 'checking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [type, pulseAnim]);

  const dotStyle = [
    styles.dot,
    type === 'live' && styles.dotLive,
    type === 'offline' && styles.dotOffline,
    type === 'checking' && styles.dotChecking,
    type === 'checking' && { opacity: pulseAnim },
  ];

  const containerStyle = [
    styles.container,
    !inline && styles.containerAbsolute,
    type === 'live' && styles.containerLive,
    type === 'offline' && styles.containerOffline,
    type === 'checking' && styles.containerChecking,
  ];

  const textStyle = [
    styles.text,
    type === 'live' && styles.textLive,
    type === 'offline' && styles.textOffline,
    type === 'checking' && styles.textChecking,
  ];

  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <View style={containerStyle}>
      <Animated.View style={dotStyle} />
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  containerAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  containerLive: {
    backgroundColor: 'rgba(29, 158, 111, 0.15)',
  },
  containerOffline: {
    backgroundColor: 'rgba(226, 72, 72, 0.15)',
  },
  containerChecking: {
    backgroundColor: 'rgba(138, 138, 143, 0.15)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dotLive: {
    backgroundColor: '#33d17a',
  },
  dotOffline: {
    backgroundColor: '#e24848',
  },
  dotChecking: {
    backgroundColor: '#c9c9cd',
  },
  text: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textLive: {
    color: '#5fd6a6',
  },
  textOffline: {
    color: '#f09595',
  },
  textChecking: {
    color: '#c9c9cd',
  },
});
