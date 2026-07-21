import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useLiveChannelResolver } from '../hooks/useLiveChannelResolver';
import { localLogos } from '../utils/logoHelper';
import { StatusBadge, BadgeType } from './StatusBadge';

export interface Channel {
  id: string;
  name: string;
  language: string;
  country: string;
  logo: string;
  youtubeChannelId: string;
}

interface ChannelTileProps {
  channel: Channel;
  onPress: (channel: Channel, videoId: string) => void;
  hasTVPreferredFocus?: boolean;
  onFocus?: () => void;
  width?: number;
  height?: number;
  onLiveCheckError?: () => void;
}

export function ChannelTile({
  channel,
  onPress,
  hasTVPreferredFocus,
  onFocus,
  width,
  height,
  onLiveCheckError,
}: ChannelTileProps) {
  const { videoId, isLoading, isError } = useLiveChannelResolver(channel.youtubeChannelId);

  React.useEffect(() => {
    if (isError && onLiveCheckError) {
      onLiveCheckError();
    }
  }, [isError, onLiveCheckError]);

  if (isLoading) {
    // Skeleton placeholder card during load
    return (
      <View style={[styles.tile, width !== undefined && { width, flex: 0 }, height !== undefined && { height }, styles.skeleton]}>
        <View style={styles.skeletonLogo} />
        <View style={styles.skeletonText} />
        <StatusBadge type="checking" />
      </View>
    );
  }

  const isOffline = !isLoading && !isError && !videoId;
  const localLogoSource = localLogos[channel.id];

  let badgeType: BadgeType | undefined = undefined;
  if (isLoading) {
    badgeType = 'checking';
  } else if (!isError) {
    badgeType = videoId ? 'live' : 'offline';
  }

  return (
    <Pressable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={onFocus}
      onPress={() => {
        if (!isOffline) {
          onPress(channel, videoId || '');
        }
      }}
      style={({ focused }) => [
        styles.tile,
        width !== undefined && { width, flex: 0 },
        height !== undefined && { height },
        focused && styles.tileFocused,
        isOffline && styles.tileOffline,
      ]}
    >
      {({ focused }) => (
        <View style={styles.contentContainer}>
          {localLogoSource ? (
            <View style={styles.logoContainer}>
              <Image source={localLogoSource} style={styles.logo} resizeMode="contain" />
            </View>
          ) : channel.logo ? (
            <View style={styles.logoContainer}>
              <Image source={{ uri: channel.logo }} style={styles.logo} resizeMode="contain" />
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>{channel.name[0]}</Text>
            </View>
          )}
          <Text style={[styles.name, focused && styles.nameFocused]}>{channel.name}</Text>
          
          {badgeType && <StatusBadge type={badgeType} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1c1c20',
    aspectRatio: 16 / 11,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2e2e32',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
    margin: 6,
    flex: 1,
  },
  tileFocused: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.05 }],
    backgroundColor: '#25252a',
  },
  tileOffline: {
    opacity: 0.6,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    padding: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2e2e32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoPlaceholderText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    color: '#c9c9cd',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  nameFocused: {
    color: '#ffffff',
  },
  // Skeleton Layout
  skeleton: {
    borderStyle: 'dashed',
    borderColor: '#3a3a40',
    backgroundColor: '#161618',
  },
  skeletonLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2a2a2e',
    marginBottom: 8,
  },
  skeletonText: {
    width: 80,
    height: 12,
    backgroundColor: '#2a2a2e',
    borderRadius: 4,
  },
});
