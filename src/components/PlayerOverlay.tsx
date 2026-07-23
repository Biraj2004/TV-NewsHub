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
  programTitle?: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onBack: () => void;
}

// Minimal White Vector Icons
function PauseIcon({ color = '#ffffff' }: { color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 4, height: 16, backgroundColor: color, borderRadius: 2, marginRight: 4 }} />
      <View style={{ width: 4, height: 16, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

function PlayIcon({ color = '#ffffff' }: { color?: string }) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 14,
        borderTopWidth: 9,
        borderBottomWidth: 9,
        borderLeftColor: color,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        marginLeft: 3,
      }}
    />
  );
}

export function PlayerOverlay({
  isVisible,
  channelId,
  channelName,
  channelLogo,
  language,
  programTitle,
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
          <View style={{ justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.channelName}>{channelName}</Text>
              <StatusBadge type="live" inline />
            </View>
            {programTitle ? (
              <Text style={styles.programTitle} numberOfLines={1}>
                {programTitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.languageText}>{language}</Text>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          {/* Prev Channel */}
          <Pressable
            onPress={onPrevChannel}
            style={({ focused }: { focused: boolean }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.icon}>‹</Text>
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={onTogglePlay}
            style={({ focused }: { focused: boolean }) => [
              styles.playBtn,
              focused && styles.playBtnFocused,
            ]}
          >
            {({ focused }: { focused: boolean }) =>
              isPlaying ? (
                <PauseIcon color={focused ? '#0f0f12' : '#ffffff'} />
              ) : (
                <PlayIcon color={focused ? '#0f0f12' : '#ffffff'} />
              )
            }
          </Pressable>

          {/* Next Channel */}
          <Pressable
            onPress={onNextChannel}
            style={({ focused }: { focused: boolean }) => [styles.btn, focused && styles.btnFocused]}
          >
            <Text style={styles.icon}>›</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Back to Grid */}
          <Pressable
            onPress={onBack}
            style={({ focused }: { focused: boolean }) => [styles.btn, styles.backBtn, focused && styles.backBtnFocused]}
          >
            <Text style={styles.backIcon}>✕</Text>
            <Text style={styles.backLabel}>Grid</Text>
          </Pressable>
        </View>

        <Text style={styles.helpText}>
          {'‹ ›  Switch channel  ·  OK  Show controls  ·  ✕  Back to grid'}
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
    backgroundColor: 'rgba(11, 11, 13, 0.92)',
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
  programTitle: {
    color: '#e0e0e5',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    maxWidth: 550,
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
    backgroundColor: 'rgba(11, 11, 13, 0.92)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  btnFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.08 }],
  },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
    marginHorizontal: 12,
  },
  playBtnFocused: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
  },
  backBtn: {
    width: 72,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  backBtnFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.06 }],
  },
  icon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  backLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  helpText: {
    color: '#8a8a8f',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
