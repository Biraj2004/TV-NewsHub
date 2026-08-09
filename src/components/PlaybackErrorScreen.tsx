import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface PlaybackErrorScreenProps {
  channelName: string;
  onReturnToGrid: () => void;
}

export function PlaybackErrorScreen({ channelName, onReturnToGrid }: PlaybackErrorScreenProps) {
  return (
    <View style={styles.errorOverlayContainer}>
      <View style={styles.errorCard}>
        <View style={styles.errorBadgeContainer}>
          <Text style={styles.errorIcon}>📡</Text>
        </View>

        <Text style={styles.errorTitle}>{channelName} Offline</Text>

        <Text style={styles.errorMessage}>
          All playback sources for this channel are currently unreachable. Please try watching a different channel.
        </Text>

        <Pressable
          hasTVPreferredFocus={true}
          onPress={onReturnToGrid}
          style={({ focused }: { focused: boolean }) => [
            styles.errorButton,
            focused && styles.errorButtonFocused,
          ]}
        >
          {({ focused }: { focused: boolean }) => (
            <Text style={[styles.errorButtonText, focused && styles.errorButtonTextFocused]}>
              Return to Channel Grid
            </Text>
          )}
        </Pressable>

        <Text style={styles.errorHintText}>
          Use ← / → on D-Pad to Switch Channels
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 13, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1a1a1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e2e34',
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  errorBadgeContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(238, 77, 77, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#9e9ea7',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  errorButton: {
    backgroundColor: '#2b2b32',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3e3e48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonFocused: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorButtonTextFocused: {
    color: '#0b0b0d',
    fontWeight: '700',
  },
  errorHintText: {
    marginTop: 20,
    color: '#6e6e76',
    fontSize: 13,
    fontWeight: '500',
  },
});
