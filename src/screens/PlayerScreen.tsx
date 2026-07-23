import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, BackHandler, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { ConsentSafeYouTubePlayer } from '../components/ConsentSafeYouTubePlayer';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PlayerOverlay } from '../components/PlayerOverlay';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useLiveChannelResolver } from '../hooks/useLiveChannelResolver';
import { setLastWatchedChannel } from '../utils/storage';
import { sanitizeUrl } from '../utils/sanitize';
import { useTVEventHandler } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

/**
 * Build the HLS player HTML shell. streamUrl is sanitized before injection
 * to prevent XSS via malformed or hijacked CDN URLs.
 */
const getHlsHtml = (rawStreamUrl: string) => {
  const streamUrl = sanitizeUrl(rawStreamUrl);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; background: #000 !important; }
      html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; display: flex; justify-content: center; align-items: center; }
      video { width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; object-fit: contain; background: #000; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  </head>
  <body>
    <video id="video" autoplay playsinline webkit-playsinline></video>
    <script>
      var video = document.getElementById('video');
      var videoSrc = '${streamUrl}';
      if (Hls.isSupported()) {
        var hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          if (hls.levels && hls.levels.length > 0) {
            hls.currentLevel = hls.levels.length - 1; // Force highest quality (1080p)
          }
          video.play();
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.addEventListener('loadedmetadata', function() {
          video.play();
        });
      }
    </script>
  </body>
  </html>
`;
};

/**
 * Build the embed iframe HTML shell. embedUrl is sanitized before injection.
 */
const getEmbedHtml = (rawEmbedUrl: string) => {
  const embedUrl = sanitizeUrl(rawEmbedUrl);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; background: #000 !important; }
      html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; display: flex; justify-content: center; align-items: center; }
      iframe { width: 100vw !important; height: 100vh !important; max-width: 100vw !important; max-height: 100vh !important; border: none !important; object-fit: contain !important; }
    </style>
  </head>
  <body>
    <iframe src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100vw; height:100vh;"></iframe>
  </body>
  </html>
`;
};

export function PlayerScreen({ route, navigation }: Props) {
  const { filteredChannels, initialIndex } = route.params;
  // useWindowDimensions updates if the window size changes (unlike module-level Dimensions.get)
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const currentChannel = filteredChannels[currentIndex];

  // Resolve current channel videoId & videoTitle (skipped for Tier 1/2 channels)
  const { videoId, videoTitle, isLoading, isError } = useLiveChannelResolver(
    currentChannel.streamUrl || currentChannel.embedUrl ? null : (currentChannel.youtubeChannelId || null)
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Overlay Timer Hook — auto-hide after 4 seconds of no select/center press
  const { isVisible, showOverlay, hideOverlay } = useIdleTimer(4000);

  // Reset state when channel index changes
  useEffect(() => {
    setPlaybackError(null);
    setIsPlaying(true);
    setLastWatchedChannel(currentChannel.id);
    hideOverlay();
  }, [currentIndex, currentChannel, hideOverlay]);

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

  // TV Remote: show overlay on select/center; navigate channels on left/right
  useTVEventHandler((event) => {
    if (!event) return;
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
  });

  const hasDirectSource = !!(currentChannel.streamUrl || currentChannel.embedUrl);
  const isOffline = !hasDirectSource && (isError || (!isLoading && !videoId));
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
    setPlaybackError('Playback error or channel offline.');
  };

  return (
    <View style={styles.container}>
      {/* Video Player Section */}
      <View style={styles.playerWrapper}>
        {currentChannel.streamUrl ? (
          /* Tier 1: Direct 1080p HLS .m3u8 Feed */
          <WebView
            key={currentChannel.id}
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
            onError={() => setPlaybackError('HLS stream loading error.')}
          />
        ) : currentChannel.embedUrl ? (
          /* Tier 2: Official Channel Web Embed */
          <WebView
            key={currentChannel.id}
            source={{ html: getEmbedHtml(currentChannel.embedUrl) }}
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
            onError={() => setPlaybackError('Embed loading error.')}
          />
        ) : videoId && !hasError ? (
          /* Tier 3: Resolved YouTube Live Stream */
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
              controls: false,
              cc_load_policy: 0,
              modestbranding: 1,
              rel: false,
              preventFullScreen: true,
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

      {/* Controls Overlay — zIndex 2 so it sits above the focusGrabber (zIndex 1) */}
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
  // WebView fills the absolute playerWrapper; flex:1 + percentage dimensions
  // must be applied as separate named styles so StyleSheet can handle them
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