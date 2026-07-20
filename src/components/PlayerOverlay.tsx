import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable } from 'react-native';

interface PlayerOverlayProps {
  isVisible: boolean;
  channelName: string;
  channelLogo: string;
  language: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onBack: () => void;
}

export function PlayerOverlay({
  isVisible,
  channelName,
  channelLogo,
  language,
  isPlaying,
  onTogglePlay,
  onNextChannel,
  onPrevChannel,
  onBack,
}: PlayerOverlayProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: isVisible ? 200 : 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, opacityAnim]);

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAnim }]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Top Bar Overlay */}
      <View style={styles.topBar}>
        <View style={styles.channelInfo}>
          {channelLogo ? (
            <Image source={{ uri: channelLogo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>{channelName[0]}</Text>
            </View>
          )}
          <Text style={styles.channelName}>{channelName}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.languageText}>{language}</Text>
      </View>

      {/* Bottom Bar Overlay */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          <Pressable
            onPress={onPrevChannel}
            style={({ focused }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.btnText}>⏮</Text>
          </Pressable>

          <Pressable
            onPress={onTogglePlay}
            style={({ focused }) => [styles.btn, styles.playBtn, focused && styles.btnFocused]}
          >
            <Text style={[styles.btnText, styles.playBtnText]}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onNextChannel}
            style={({ focused }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.btnText}>⏭</Text>
          </Pressable>

          <Pressable
            onPress={onBack}
            style={({ focused }) => [styles.btn, styles.backBtn, focused && styles.btnFocused]}
          >
            <Text style={styles.btnText}>↩ Grid</Text>
          </Pressable>
        </View>
        <Text style={styles.helpText}>
          Left / Right: Switch channel &nbsp;·&nbsp; OK / Center: Show Controls
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(11, 11, 13, 0.85)',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0b0b0d',
    marginRight: 14,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1c1c20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoPlaceholderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 72, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e24848',
    marginRight: 6,
  },
  liveText: {
    color: '#f09595',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  languageText: {
    color: '#8a8a8f',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomBar: {
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 13, 0.85)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 80,
    borderRadius: 16,
  },
  btnFocused: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playBtnText: {
    color: '#111111',
    fontSize: 20,
  },
  helpText: {
    color: '#8a8a8f',
    fontSize: 13,
  },
});
