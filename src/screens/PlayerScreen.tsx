import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { ConsentSafeYouTubePlayer, ConsentSafeYouTubePlayerRef } from '../components/ConsentSafeYouTubePlayer';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PlayerOverlay } from '../components/PlayerOverlay';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useLiveChannelResolver } from '../hooks/useLiveChannelResolver';
import { setLastWatchedChannel } from '../utils/storage';
import { sanitizeUrl } from '../utils/sanitize';
import { useTVEventHandler } from 'react-native';
import {
  getHlsHtml,
  EMBED_AUTOPLAY_SCRIPT,
  EMBED_FORCE_PLAY_SCRIPT,
} from '../utils/playerScripts';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

export function PlayerScreen({ route, navigation }: Props) {
  const { filteredChannels, initialIndex } = route.params;
  const { width, height } = useWindowDimensions();

  // Refs for WebViews
  const embedWebViewRef = useRef<WebView>(null);
  const ytPlayerRef = useRef<ConsentSafeYouTubePlayerRef>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const currentChannel = filteredChannels[currentIndex];

  // Dynamic Tier Fallback State: if primary streamUrl/embedUrl fails, fallback to youtubeChannelId if available
  const [useYoutubeFallback, setUseYoutubeFallback] = useState<boolean>(false);

  const hasPrimaryDirectSource = !useYoutubeFallback && !!(currentChannel.streamUrl || currentChannel.embedUrl);
  const activeYoutubeChannelId = (!hasPrimaryDirectSource && currentChannel.youtubeChannelId) ? currentChannel.youtubeChannelId : null;

  // Resolve live videoId for Tier 3 / Fallback channels
  const { videoId, videoTitle, isLoading, isError } = useLiveChannelResolver(activeYoutubeChannelId);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Overlay Timer Hook — auto-hide after 4 seconds of no select/center press
  const { isVisible, showOverlay, hideOverlay } = useIdleTimer(4000);

  // Reset state when channel index changes
  useEffect(() => {
    setPlaybackError(null);
    setIsPlaying(true);
    setUseYoutubeFallback(false);
    setLastWatchedChannel(currentChannel.id);
    hideOverlay();
  }, [currentIndex, currentChannel, hideOverlay]);

  // Handle primary stream error: fallback to YouTube channel if present, else trigger playback error
  const handlePrimaryStreamError = useCallback((errorMessage: string) => {
    if (currentChannel.youtubeChannelId && !useYoutubeFallback) {
      if (__DEV__) { console.log('[PlayerScreen] Primary stream failed. Falling back to YouTube Live Resolver...'); }
      setUseYoutubeFallback(true);
    } else {
      setPlaybackError(errorMessage);
    }
  }, [currentChannel, useYoutubeFallback]);

  // Navigate to previous channel
  const handlePrevChannel = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredChannels.length) % filteredChannels.length);
  }, [filteredChannels]);

  // Navigate to next channel
  const handleNextChannel = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredChannels.length);
  }, [filteredChannels]);

  // Back navigation helper
  const handleBack = useCallback(() => {
    navigation.navigate('Home', { focusChannelId: currentChannel.id });
  }, [navigation, currentChannel]);

  // Handle hardware back button pressed
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  const handlePressScreen = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      if (isVisible) {
        setIsPlaying((prev) => !prev);
      } else {
        showOverlay();
      }
    }
  }, [isPlaying, isVisible, showOverlay]);

  // TV Remote: OK plays/pauses or shows controls; DOWN shows controls; UP hides controls; LEFT/RIGHT switches channel
  useTVEventHandler((event) => {
    if (!event) return;
    const { eventType } = event;

    if (eventType === 'left' || eventType === 'dpadLeft') {
      handlePrevChannel();
    } else if (eventType === 'right' || eventType === 'dpadRight') {
      handleNextChannel();
    } else if (eventType === 'down' || eventType === 'dpadDown') {
      showOverlay();
    } else if (eventType === 'up' || eventType === 'dpadUp') {
      hideOverlay();
    } else if (eventType === 'select' || eventType === 'dpadCenter' || eventType === 'playPause') {
      if (hasPrimaryDirectSource && currentChannel.embedUrl) {
        embedWebViewRef.current?.injectJavaScript(EMBED_FORCE_PLAY_SCRIPT);
      } else if (!hasPrimaryDirectSource) {
        ytPlayerRef.current?.forcePlay();
      }
      handlePressScreen();
    }
  });

  const isOffline = !hasPrimaryDirectSource && (isError || (!isLoading && !videoId));
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

  const onPlayerError = (error: unknown) => {
    if (__DEV__) { console.warn('[PlayerScreen] Playback error:', error); }
    handlePrimaryStreamError('Playback error or channel offline.');
  };

  return (
    <View style={styles.container}>
      {/* Video Player Section */}
      <View style={styles.playerWrapper}>
        {hasPrimaryDirectSource && currentChannel.streamUrl ? (
          /* Tier 1: Direct 1080p HLS .m3u8 Feed */
          <WebView
            key={`${currentChannel.id}-hls`}
            source={{ html: getHlsHtml(currentChannel.streamUrl) }}
            style={styles.webViewBase}
            containerStyle={styles.webViewContainer}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            scalesPageToFit={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onError={() => handlePrimaryStreamError('HLS stream loading error.')}
          />
        ) : hasPrimaryDirectSource && currentChannel.embedUrl ? (
          /* Tier 2: Official Channel Web Embed */
          <WebView
            ref={embedWebViewRef as any}
            key={`${currentChannel.id}-embed`}
            source={{ uri: sanitizeUrl(currentChannel.embedUrl) }}
            style={styles.webViewBase}
            containerStyle={styles.webViewContainer}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            scalesPageToFit={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            injectedJavaScript={EMBED_AUTOPLAY_SCRIPT}
            userAgent="Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1"
            onError={() => handlePrimaryStreamError('Embed loading error.')}
          />
        ) : videoId && !hasError ? (
          /* Tier 3: Resolved YouTube Live Stream (Primary or Fallback) */
          <ConsentSafeYouTubePlayer
            ref={ytPlayerRef}
            height={height}
            width={width}
            play={isPlaying}
            videoId={videoId}
            mute={false}
            onChangeState={onPlayerStateChange}
            onError={onPlayerError}
            playList={undefined}
            initialPlayerParams={{
              controls: false,
              cc_load_policy: 0,
              modestbranding: 1,
              rel: false,
              preventFullScreen: true,
              autoplay: 1,
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
        onPress={handlePressScreen}
        style={styles.focusGrabber}
      />

      {/* Controls Overlay */}
      <PlayerOverlay
        isVisible={isVisible && !hasError}
        channelId={currentChannel.id}
        channelName={currentChannel.name}
        channelLogo={currentChannel.logo}
        language={currentChannel.language}
        programTitle={videoTitle}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onNextChannel={handleNextChannel}
        onPrevChannel={handlePrevChannel}
        onBack={handleBack}
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
  webViewBase: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webViewContainer: {
    flex: 1,
    width: '100%' as unknown as number,
    height: '100%' as unknown as number,
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