import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConsentSafeYouTubePlayer } from '../components/ConsentSafeYouTubePlayer';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PlayerOverlay } from '../components/PlayerOverlay';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useLiveChannelResolver } from '../hooks/useLiveChannelResolver';
import { setLastWatchedChannel } from '../utils/storage';
import { useTVEventHandler } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const { width, height } = Dimensions.get('window');

export function PlayerScreen({ route, navigation }: Props) {
  const { filteredChannels, initialIndex } = route.params;

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const currentChannel = filteredChannels[currentIndex];

  // Resolve current channel videoId
  const { videoId, isLoading, isError } = useLiveChannelResolver(currentChannel.youtubeChannelId);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Overlay Timer Hook (4 seconds inactivity timeout)
  const { isVisible, showOverlay } = useIdleTimer(4000);

  // Reset state when channel index changes
  useEffect(() => {
    setPlaybackError(null);
    setIsPlaying(true);
    // Persist as last watched
    setLastWatchedChannel(currentChannel.id);
  }, [currentIndex, currentChannel]);

  // Navigate to previous channel
  const handlePrevChannel = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredChannels.length) % filteredChannels.length);
    showOverlay();
  }, [filteredChannels, showOverlay]);

  // Navigate to next channel
  const handleNextChannel = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredChannels.length);
    showOverlay();
  }, [filteredChannels, showOverlay]);

  // Handle hardware back button pressed
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home', { focusChannelId: currentChannel.id });
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentChannel, navigation]);

  // TV Remote button events listener using hook
  useTVEventHandler((event) => {
    if (event) {
      if (event.eventType === 'left' || event.eventType === 'dpadLeft') {
        handlePrevChannel();
      } else if (event.eventType === 'right' || event.eventType === 'dpadRight') {
        handleNextChannel();
      } else if (event.eventType === 'playPause') {
        setIsPlaying((prev) => !prev);
        showOverlay();
      } else if (event.eventType === 'select' || event.eventType === 'dpadCenter') {
        showOverlay();
      }
    }
  });

  const isOffline = isError || (!isLoading && !videoId);
  const hasError = playbackError || isOffline;

  // Auto-return to grid on ended or offline channels
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        navigation.navigate('Home', { focusChannelId: currentChannel.id });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasError, currentChannel, navigation]);

  const onPlayerStateChange = (state: string) => {
    if (state === 'ended') {
      setPlaybackError('Stream ended.');
    }
  };

  const onPlayerError = (_error: any) => {
    setPlaybackError('Playback error or channel offline.');
  };

  return (
    <View style={styles.container}>
      {/* YouTube Player */}
      <View style={styles.playerWrapper}>
        {videoId && !hasError ? (
          <ConsentSafeYouTubePlayer
            height={height}
            width={width}
            play={isPlaying}
            videoId={videoId}
            mute={false}
            onChangeState={onPlayerStateChange}
            onError={onPlayerError}
            playList={undefined}
            initialPlayerParams={{
              controls: false, // Hide default player chrome controls
              cc_load_policy: 0,
              modestbranding: 1,
              rel: false,
            } as any}
          />
        ) : (
          <View style={styles.loadingWrapper}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <View style={styles.offlineBox}>
                <Text style={styles.offlineEmoji}>📡</Text>
                <Text style={styles.offlineText}>Channel is Offline</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Focus Grabber Overlay to retain TV Focus in React Native */}
      <Pressable
        hasTVPreferredFocus={true}
        onPress={showOverlay}
        style={styles.focusGrabber}
      />

      {/* Controls Overlay */}
      <PlayerOverlay
        isVisible={isVisible && !hasError}
        channelId={currentChannel.id}
        channelName={currentChannel.name}
        channelLogo={currentChannel.logo}
        language={currentChannel.language}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onNextChannel={handleNextChannel}
        onPrevChannel={handlePrevChannel}
        onBack={() => navigation.navigate('Home', { focusChannelId: currentChannel.id })}
      />

      {/* Fallback Overlay for Offline/Errors */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>
            {playbackError || 'This channel is currently offline.'}
          </Text>
          <Text style={styles.errorSubtext}>Returning to grid in 5 seconds...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  playerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBox: {
    alignItems: 'center',
  },
  offlineEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  focusGrabber: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 13, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  errorText: {
    color: '#e24848',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#8a8a8f',
    fontSize: 16,
  },
});