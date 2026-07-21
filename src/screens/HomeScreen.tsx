import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CountryTabs } from '../components/CountryTabs';
import { LanguageTabs } from '../components/LanguageTabs';
import { ChannelTile, Channel } from '../components/ChannelTile';
import { getLastWatchedChannel, setLastWatchedChannel } from '../utils/storage';
import channelsData from '../data/channels';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = (SCREEN_WIDTH - 144) / 5;
const TILE_HEIGHT = TILE_WIDTH * (11 / 16);

// Helper component for right-edge fade overlay
function RightEdgeFade() {
  const segments = [];
  const fadeWidth = 40;
  const numSteps = 20;
  const stepWidth = fadeWidth / numSteps;

  for (let i = 0; i < numSteps; i++) {
    const opacity = (i / (numSteps - 1)) ** 1.5;
    segments.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: i * stepWidth,
          width: stepWidth,
          backgroundColor: '#0b0b0d',
          opacity: opacity,
        }}
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: fadeWidth,
        flexDirection: 'row',
        pointerEvents: 'none',
      }}
    >
      {segments}
    </View>
  );
}

// Reusable horizontal channel row component
interface ChannelRowProps {
  channels: Channel[];
  rowIndex: number;
  onChannelPress: (channel: Channel, videoId: string) => void;
  onTileFocus: (colIndex: number) => void;
  preferredFocusColIndex: number | null;
}

const ChannelRow = React.memo(({
  channels,
  onChannelPress,
  onTileFocus,
  preferredFocusColIndex,
}: ChannelRowProps) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = (colIndex: number) => {
    onTileFocus(colIndex);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Scroll carriage logic: focused tile lands with 1 tile visible to its left (index >= 2)
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
            />
          );
        }}
      />
      <RightEdgeFade />
    </View>
  );
});

export function HomeScreen({ navigation, route }: Props) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [lastWatchedName, setLastWatchedName] = useState<string>('None');
  const [checkedAutoLaunch, setCheckedAutoLaunch] = useState<boolean>(false);

  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  const allChannels: Channel[] = channelsData as Channel[];

  const verticalScrollRef = useRef<ScrollView>(null);
  const verticalScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      setTimeStr(
        date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).toLowerCase()
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle auto-launching the last watched channel if within 10 minutes
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
          if (timeDiff < 600000 && !checkedAutoLaunch) {
            setCheckedAutoLaunch(true);
            
            const countryFiltered = allChannels.filter((c) => c.country === matched.country);
            const langFiltered = countryFiltered.filter(
              (c) => matched.language === 'All' || c.language === matched.language
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
      setCheckedAutoLaunch(true);
    };

    checkLastWatched();

    return () => {
      isMounted = false;
    };
  }, [allChannels, checkedAutoLaunch, navigation]);

  // Determine available countries
  const countries = Array.from(new Set(allChannels.map((c) => c.country)));

  // Filter channels based on selected country
  const channelsByCountry = allChannels.filter((c) => c.country === selectedCountry);

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

    // Compute the filtered channels list for this channel's language row
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
          <Text style={styles.brandTitle}>📺 NewsHub</Text>
          <View style={styles.headerRight}>
            <Text style={styles.lastWatched}>Last Watched: {lastWatchedName}</Text>
            <Text style={styles.clock}>{timeStr}</Text>
          </View>
        </View>

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

        {/* Channels Rows */}
        {activeLanguages.map((lang, rowIndex) => {
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
              />
            </View>
          );
        })}
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
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0b0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastWatched: {
    color: '#8a8a8f',
    fontSize: 14,
    marginRight: 20,
  },
  clock: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsWrapper: {
    paddingHorizontal: 24,
  },
  rowContainer: {
    marginBottom: 24,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
    paddingVertical: 12,
  },
  footerHelp: {
    color: '#6b6b70',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
