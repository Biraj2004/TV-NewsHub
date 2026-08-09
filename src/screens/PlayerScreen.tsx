import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, BackHandler, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { ConsentSafeYouTubePlayer, ConsentSafeYouTubePlayerRef } from '../components/ConsentSafeYouTubePlayer';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Channel } from '../data/channels';
import { PlayerOverlay } from '../components/PlayerOverlay';
import { PlaybackErrorScreen } from '../components/PlaybackErrorScreen';
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

// Tier mapping:
// Tier 1: Primary direct HLS stream (streamUrl)
// Tier 2: Secondary HLS stream (m3uUrl) OR Web Embed (embedUrl)
// Tier 3: YouTube Live Resolver (youtubeChannelId)

function getInitialTier(ch: Channel) {
  if (ch.streamUrl) return 1;
  if (ch.m3uUrl || ch.embedUrl) return 2;
  if (ch.youtubeChannelId) return 3;
  return 1;
}

export function PlayerScreen({ route, navigation }: Props) {
  const { filteredChannels, initialIndex } = route.params;
  const { width, height } = useWindowDimensions();

  // Refs for WebViews
  const embedWebViewRef = useRef<WebView>(null);
  const ytPlayerRef = useRef<ConsentSafeYouTubePlayerRef>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const currentChannel = filteredChannels[currentIndex];

  const [activeTier, setActiveTier] = useState<number>(() => getInitialTier(currentChannel));

  const activeYoutubeChannelId = (activeTier === 3 && currentChannel.youtubeChannelId) ? currentChannel.youtubeChannelId : null;

  // Resolve live videoId ONLY when activeTier === 3
  const { videoId, videoTitle, isLoading, isError } = useLiveChannelResolver(activeYoutubeChannelId);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Overlay Timer Hook — auto-hide after 4 seconds of no select/center press
  const { isVisible, showOverlay, hideOverlay } = useIdleTimer(4000);

  const [tier1Retries, setTier1Retries] = useState<number>(0);
  const [tier2Retries, setTier2Retries] = useState<number>(0);

  // Reset state when channel index changes
  useEffect(() => {
    setPlaybackError(null);
    setIsPlaying(true);
    setTier1Retries(0);
    setTier2Retries(0);
    setActiveTier(getInitialTier(currentChannel));
    setLastWatchedChannel(currentChannel.id);
    hideOverlay();
  }, [currentIndex, currentChannel, hideOverlay]);

  // Fallback engine: advance to next tier on error after patient HLS retries
  const handleStreamError = useCallback((failedTier: number, errorMessage: string) => {
    if (__DEV__) {
      console.warn(`[PlayerScreen] Stream issue on Tier ${failedTier} (${errorMessage}) for channel ${currentChannel.name}`);
    }

    if (failedTier === 1) {
      if (tier1Retries < 2) {
        if (__DEV__) { console.log(`[PlayerScreen] Retrying Tier 1 HLS (Attempt ${tier1Retries + 1})...`); }
        setTier1Retries((r) => r + 1);
        return;
      }
      if (currentChannel.m3uUrl || currentChannel.embedUrl) {
        if (__DEV__) { console.log('[PlayerScreen] Falling back to Tier 2 (m3uUrl/embedUrl)...'); }
        setActiveTier(2);
        return;
      }
      if (currentChannel.youtubeChannelId) {
        if (__DEV__) { console.log('[PlayerScreen] Falling back to Tier 3 (YouTube)...'); }
        setActiveTier(3);
        return;
      }
    } else if (failedTier === 2) {
      if (tier2Retries < 2) {
        if (__DEV__) { console.log(`[PlayerScreen] Retrying Tier 2 HLS (Attempt ${tier2Retries + 1})...`); }
        setTier2Retries((r) => r + 1);
        return;
      }
      if (currentChannel.youtubeChannelId) {
        if (__DEV__) { console.log('[PlayerScreen] Tier 2 failed. Falling back to Tier 3 (YouTube)...'); }
        setActiveTier(3);
        return;
      }
    }

    setPlaybackError(errorMessage);
  }, [currentChannel, tier1Retries, tier2Retries]);

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
    if (activeTier === 2 && currentChannel.embedUrl) {
      embedWebViewRef.current?.injectJavaScript(EMBED_FORCE_PLAY_SCRIPT);
    } else if (activeTier === 3) {
      ytPlayerRef.current?.forcePlay();
      if (!isPlaying) {
        setIsPlaying(true);
      }
      if (!isVisible) {
        showOverlay();
      }
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      if (isVisible) {
        setIsPlaying((prev) => !prev);
      } else {
        showOverlay();
      }
    }
  }, [activeTier, currentChannel, isPlaying, isVisible, showOverlay]);

  // TV Remote controls
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
      if (activeTier === 2 && currentChannel.embedUrl) {
        embedWebViewRef.current?.injectJavaScript(EMBED_FORCE_PLAY_SCRIPT);
      } else if (activeTier === 3) {
        ytPlayerRef.current?.forcePlay();
      }
      handlePressScreen();
    }
  });

  const isOffline = activeTier === 3 && (isError || (!isLoading && !videoId));
  const hasError = playbackError || isOffline;

  // Auto-return to grid on ended or offline channels after 8 seconds
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        navigation.navigate('Home', { focusChannelId: currentChannel.id });
      }, 8000);
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
    handleStreamError(3, 'Playback error or channel offline.');
  };

  return (
    <View style={styles.container}>
      {/* Video Player Section */}
      <View style={styles.playerWrapper}>
        {activeTier === 1 && currentChannel.streamUrl ? (
          /* Tier 1: Primary Direct 1080p HLS .m3u8 Feed */
          <WebView
            key={`${currentChannel.id}-hls-t1-retry-${tier1Retries}`}
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
            onError={() => handleStreamError(1, 'Primary HLS stream loading error.')}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data && data.type === 'HLS_ERROR') {
                  handleStreamError(1, 'Primary HLS stream offline.');
                }
              } catch {}
            }}
          />
        ) : activeTier === 2 && currentChannel.m3uUrl ? (
          /* Tier 2A: Secondary Direct HLS .m3u8 Feed */
          <WebView
            key={`${currentChannel.id}-hls-t2-retry-${tier2Retries}`}
            source={{ html: getHlsHtml(currentChannel.m3uUrl) }}
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
            onError={() => handleStreamError(2, 'Secondary HLS stream loading error.')}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data && data.type === 'HLS_ERROR') {
                  handleStreamError(2, 'Secondary HLS stream offline.');
                }
              } catch {}
            }}
          />
        ) : activeTier === 2 && currentChannel.embedUrl ? (
          /* Tier 2B: Official Channel Web Embed */
          <WebView
            ref={embedWebViewRef as any}
            key={`${currentChannel.id}-embed-t2`}
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
            onError={() => handleStreamError(2, 'Embed loading error.')}
          />
        ) : activeTier === 3 && videoId && !hasError ? (
          /* Tier 3: Resolved YouTube Live Stream (Fallback) */
          <ConsentSafeYouTubePlayer
            ref={ytPlayerRef}
            height={height}
            width={width}
            play={isPlaying}
            videoId={videoId}
            mute={false}
            forceAndroidAutoplay={true}
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
              origin: 'https://www.youtube.com',
            } as any}
          />
        ) : (
          <View style={styles.loadingWrapper}>
            {activeTier === 3 && isLoading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : null}
          </View>
        )}
      </View>

      {/* Focus Grabber Overlay to retain TV Focus in React Native when playing */}
      {!hasError && (
        <Pressable
          hasTVPreferredFocus={true}
          onPress={handlePressScreen}
          style={styles.focusGrabber}
        />
      )}

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

      {/* Modern, Clean Fallback Screen component when all Tiers fail */}
      {hasError && (
        <PlaybackErrorScreen
          channelName={currentChannel.name}
          onReturnToGrid={handleBack}
        />
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
  focusGrabber: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});