import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable } from 'react-native';
import { localLogos } from '../utils/logoHelper';
import { StatusBadge } from './StatusBadge';

interface PlayerOverlayProps {
  isVisible: boolean;
  channelId: string;
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
  channelId,
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
      duration: isVisible ? 180 : 280,
      useNativeDriver: true,
    }).start();
  }, [isVisible, opacityAnim]);

  const localLogoSource = localLogos[channelId];

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAnim }]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.channelInfo}>
          {localLogoSource ? (
            <Image source={localLogoSource} style={styles.logo} resizeMode="contain" />
          ) : channelLogo ? (
            <Image source={{ uri: channelLogo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>{channelName[0]}</Text>
            </View>
          )}
          <Text style={styles.channelName}>{channelName}</Text>
          <StatusBadge type="live" inline />
        </View>
        <Text style={styles.languageText}>{language}</Text>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          {/* Prev Channel */}
          <Pressable
            onPress={onPrevChannel}
            style={({ focused }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.icon}>{'◀◀'}</Text>
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={onTogglePlay}
            style={({ focused }) => [styles.btn, styles.playBtn, focused && styles.playBtnFocused]}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>

          {/* Next Channel */}
          <Pressable
            onPress={onNextChannel}
            style={({ focused }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.icon}>{'▶▶'}</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Back to Grid */}
          <Pressable
            onPress={onBack}
            style={({ focused }) => [styles.btn, styles.backBtn, focused && styles.backBtnFocused]}
          >
            <Text style={styles.backIcon}>✕</Text>
            <Text style={styles.backLabel}>Grid</Text>
          </Pressable>
        </View>

        <Text style={styles.helpText}>
          {'◀ ▶  Switch channel  ·  OK  Show controls  ·  ✕  Back to grid'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 36,
    backgroundColor: 'rgba(11, 11, 13, 0.9)',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1c1c20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoPlaceholderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
  },
  languageText: {
    color: '#8a8a8f',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 13, 0.9)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  btnFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ scale: 1.08 }],
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    marginHorizontal: 12,
  },
  playBtnFocused: {
    backgroundColor: '#e0e0e0',
    transform: [{ scale: 1.1 }],
  },
  backBtn: {
    width: 68,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  backBtnFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ scale: 1.06 }],
  },
  icon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -1,
  },
  playIcon: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  backLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  helpText: {
    color: '#6b6b70',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
