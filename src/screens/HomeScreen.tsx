import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, Dimensions, AppState, AppStateStatus } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CountryTabs } from '../components/CountryTabs';
import { LanguageTabs } from '../components/LanguageTabs';
import { ChannelTile, Channel } from '../components/ChannelTile';
import { getLastWatchedChannel, setLastWatchedChannel } from '../utils/storage';
import channelsData from '../data/channels';
import { BrandLogo } from '../components/BrandLogo';
import { NoInternetScreen } from '../components/NoInternetScreen';
import { EmptyState } from '../components/EmptyState';
import { DegradedStatusBanner } from '../components/DegradedStatusBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = (SCREEN_WIDTH - 144) / 5;
const TILE_HEIGHT = TILE_WIDTH * (11 / 16);

/**
 * Right-edge fade overlay — single absolutely-positioned View instead of 20.
 * Uses a pre-computed StyleSheet entry so it is never recreated on re-render.
 */
function RightEdgeFade() {
  return <View style={styles.rightEdgeFade} pointerEvents="none" />;
}

// Reusable horizontal channel row component
interface ChannelRowProps {
  channels: Channel[];
  rowIndex: number;
  onChannelPress: (channel: Channel, videoId: string) => void;
  onTileFocus: (colIndex: number) => void;
  preferredFocusColIndex: number | null;
  onLiveCheckError?: () => void;
}

const ChannelRow = React.memo(({
  channels,
  onChannelPress,
  onTileFocus,
  preferredFocusColIndex,
  onLiveCheckError,
}: ChannelRowProps) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = (colIndex: number) => {
    onTileFocus(colIndex);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Scroll carriage: focused tile shows 1 tile visible to its left (index >= 2)
    let targetOffset = 0;
    if (colIndex >= 2) {
      targetOffset = (colIndex - 1) * (TILE_WIDTH + 16);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.rowWrapper}>
      <FlatList
        ref={flatListRef}
        data={channels}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.rowList}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const hasPreferredFocus = preferredFocusColIndex === index;

          return (
            <ChannelTile
              channel={item}
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
              hasTVPreferredFocus={hasPreferredFocus}
              onPress={onChannelPress}
              onFocus={() => handleFocus(index)}
              onLiveCheckError={onLiveCheckError}
            />
          );
        }}
      />
      <RightEdgeFade />
    </View>
  );
});

let globalHasProcessAutoLaunched = false;

export function HomeScreen({ navigation, route }: Props) {
  const isConnected = useNetworkStatus();
  const [isLiveCheckDegraded, setIsLiveCheckDegraded] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>('');
  const [lastWatchedName, setLastWatchedName] = useState<string>('None');
  const [checkedAutoLaunch, setCheckedAutoLaunch] = useState<boolean>(false);

  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  const allChannels: Channel[] = channelsData as Channel[];

  const verticalScrollRef = useRef<ScrollView>(null);
  const verticalScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clock — only ticks when app is in the foreground (performance: stops in background)
  useEffect(() => {
    const formatTime = () => {
      const date = new Date();
      setTimeStr(
        date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).toLowerCase()
      );
    };

    formatTime();
    let interval: ReturnType<typeof setInterval> | null = setInterval(formatTime, 1000);

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (!interval) {
          formatTime();
          interval = setInterval(formatTime, 1000);
        }
      } else {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, []);

  // Handle auto-launching the last watched channel ONCE per app process lifetime
  useEffect(() => {
    let isMounted = true;

    const checkLastWatched = async () => {
      const saved = await getLastWatchedChannel();
      if (!isMounted) return;

      if (saved) {
        const matched = allChannels.find((c) => c.id === saved.id);
        if (matched) {
          setLastWatchedName(matched.name);

          const timeDiff = Date.now() - saved.timestamp;
          if (timeDiff < 600000 && !globalHasProcessAutoLaunched) {
            globalHasProcessAutoLaunched = true;
            setCheckedAutoLaunch(true);

            const countryFiltered = allChannels.filter((c) => c.country === matched.country);
            const langFiltered = countryFiltered.filter(
              (c) => c.language === matched.language
            );
            const idx = langFiltered.findIndex((c) => c.id === matched.id);

            navigation.navigate('Player', {
              channelId: matched.id,
              filteredChannels: langFiltered.length > 0 ? langFiltered : countryFiltered,
              initialIndex: idx >= 0 ? idx : 0,
            });
            return;
          }
        }
      }
      globalHasProcessAutoLaunched = true;
      setCheckedAutoLaunch(true);
    };

    checkLastWatched();

    return () => {
      isMounted = false;
    };
  }, [allChannels, navigation]);

  // Derive available countries — memoized so Array.from(new Set()) is not called on every render
  const countries = useMemo(
    () => Array.from(new Set(allChannels.map((c) => c.country))),
    [allChannels],
  );

  // Filter channels based on selected country
  const channelsByCountry = useMemo(
    () => allChannels.filter((c) => c.country === selectedCountry),
    [allChannels, selectedCountry],
  );

  // Determine available languages for selected country
  const languages = useMemo(() => {
    return ['All', ...Array.from(new Set(channelsByCountry.map((c) => c.language)))];
  }, [channelsByCountry]);

  // Reset language to 'All' if the selected language is not available in the new country
  useEffect(() => {
    if (!languages.includes(selectedLanguage)) {
      setSelectedLanguage('All');
    }
  }, [selectedCountry, languages, selectedLanguage]);

  const activeLanguages = useMemo(() => {
    if (selectedLanguage === 'All') {
      return languages.filter((l) => l !== 'All');
    }
    return [selectedLanguage];
  }, [selectedLanguage, languages]);

  const handleChannelPress = async (channel: Channel, _resolvedVideoId: string) => {
    await setLastWatchedChannel(channel.id);
    setLastWatchedName(channel.name);

    const channelsInRow = channelsByCountry.filter((c) => c.language === channel.language);
    const index = channelsInRow.findIndex((c) => c.id === channel.id);

    navigation.navigate('Player', {
      channelId: channel.id,
      filteredChannels: channelsInRow,
      initialIndex: index >= 0 ? index : 0,
    });
  };

  const focusTargetId = route.params?.focusChannelId;

  // Determine preferred focus row & col
  const preferredFocusInfo = useMemo(() => {
    if (!focusTargetId) {
      return { rowIndex: 0, colIndex: 0 };
    }
    for (let r = 0; r < activeLanguages.length; r++) {
      const lang = activeLanguages[r];
      const channelsInRow = channelsByCountry.filter((c) => c.language === lang);
      const col = channelsInRow.findIndex((c) => c.id === focusTargetId);
      if (col >= 0) {
        return { rowIndex: r, colIndex: col };
      }
    }
    return { rowIndex: 0, colIndex: 0 };
  }, [focusTargetId, activeLanguages, channelsByCountry]);

  // Auto-scroll vertical page on D-pad Up/Down row focus
  const handleTileFocus = (rowIndex: number, _colIndex: number) => {
    if (verticalScrollTimeoutRef.current) {
      clearTimeout(verticalScrollTimeoutRef.current);
    }

    const HEADER_HEIGHT = 160;
    const ROW_HEIGHT = 200;

    let targetY = 0;
    if (rowIndex > 0) {
      targetY = HEADER_HEIGHT + (rowIndex - 1) * ROW_HEIGHT;
    }

    verticalScrollTimeoutRef.current = setTimeout(() => {
      verticalScrollRef.current?.scrollTo({
        y: targetY,
        animated: true,
      });
    }, 80);
  };

  // Scroll vertical page to top when Country/Language tabs are focused
  const handleTabsFocus = () => {
    if (verticalScrollTimeoutRef.current) {
      clearTimeout(verticalScrollTimeoutRef.current);
    }
    verticalScrollTimeoutRef.current = setTimeout(() => {
      verticalScrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (verticalScrollTimeoutRef.current) {
        clearTimeout(verticalScrollTimeoutRef.current);
      }
    };
  }, []);

  const hasChannels = useMemo(() => {
    return channelsByCountry.some((c) => selectedLanguage === 'All' || c.language === selectedLanguage);
  }, [channelsByCountry, selectedLanguage]);

  if (isConnected === false) {
    return <NoInternetScreen />;
  }

  if (!checkedAutoLaunch) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={verticalScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <BrandLogo size={24} />
            <Text style={styles.brandTitle}>NewsHub</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.lastWatched}>Last Watched: {lastWatchedName}</Text>
            <Text style={styles.clock}>{timeStr}</Text>
          </View>
        </View>

        {/* Degraded Status Banner */}
        {isLiveCheckDegraded && <DegradedStatusBanner />}

        {/* Country Row */}
        <View style={styles.tabsWrapper}>
          <CountryTabs
            countries={countries}
            selectedCountry={selectedCountry}
            onFocus={handleTabsFocus}
            onSelectCountry={(c) => {
              setSelectedCountry(c);
              setSelectedLanguage('All');
            }}
          />
        </View>

        {/* Language Row */}
        <View style={styles.tabsWrapper}>
          <LanguageTabs
            languages={languages}
            selectedLanguage={selectedLanguage}
            onFocus={handleTabsFocus}
            onSelectLanguage={setSelectedLanguage}
          />
        </View>

        {/* Channels Rows or Empty State */}
        {hasChannels ? (
          activeLanguages.map((lang, rowIndex) => {
            const channelsInRow = channelsByCountry.filter((c) => c.language === lang);
            if (channelsInRow.length === 0) return null;

            const preferredFocusColIndex =
              preferredFocusInfo.rowIndex === rowIndex ? preferredFocusInfo.colIndex : null;

            return (
              <View key={lang} style={styles.rowContainer}>
                <Text style={styles.rowTitle}>{lang}</Text>
                <ChannelRow
                  channels={channelsInRow}
                  rowIndex={rowIndex}
                  onChannelPress={handleChannelPress}
                  onTileFocus={(colIndex) => handleTileFocus(rowIndex, colIndex)}
                  preferredFocusColIndex={preferredFocusColIndex}
                  onLiveCheckError={() => setIsLiveCheckDegraded(true)}
                />
              </View>
            );
          })
        ) : (
          <EmptyState language={selectedLanguage} country={selectedCountry} />
        )}
      </ScrollView>

      <Text style={styles.footerHelp}>
        Use D-pad arrows to navigate &nbsp;·&nbsp; Press Center (OK) to play
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0b0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 32,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastWatched: {
    color: '#8a8a8f',
    fontSize: 13,
    marginRight: 16,
  },
  clock: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsWrapper: {
    paddingHorizontal: 24,
  },
  rowContainer: {
    marginBottom: 10,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    paddingHorizontal: 32,
  },
  rowWrapper: {
    position: 'relative',
    width: '100%',
  },
  rowList: {
    overflow: 'visible',
  },
  rowContent: {
    paddingLeft: 32,
    paddingRight: 40,
    paddingVertical: 4,
  },
  // Single-element right-edge fade (replaces 20-View gradient loop)
  rightEdgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 48,
    backgroundColor: '#0b0b0d',
    opacity: 0.85,
  },
  footerHelp: {
    color: '#6b6b70',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
