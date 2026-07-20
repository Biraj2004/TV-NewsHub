import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CountryTabs } from '../components/CountryTabs';
import { LanguageTabs } from '../components/LanguageTabs';
import { ChannelTile, Channel } from '../components/ChannelTile';
import { getLastWatchedChannel, setLastWatchedChannel } from '../utils/storage';
import channelsData from '../data/channels';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation, route }: Props) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [lastWatchedName, setLastWatchedName] = useState<string>('None');
  const [checkedAutoLaunch, setCheckedAutoLaunch] = useState<boolean>(false);

  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  const allChannels: Channel[] = channelsData as Channel[];

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
          // 600,000 milliseconds = 10 minutes
          if (timeDiff < 600000 && !checkedAutoLaunch) {
            setCheckedAutoLaunch(true);
            
            // Build the filtered list to allow left/right D-pad switching inside Player
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

  // Filter channels based on selected language
  const filteredChannels = channelsByCountry.filter(
    (c) => selectedLanguage === 'All' || c.language === selectedLanguage
  );

  const handleChannelPress = async (channel: Channel, _resolvedVideoId: string) => {
    // Save to AsyncStorage
    await setLastWatchedChannel(channel.id);
    setLastWatchedName(channel.name);

    const index = filteredChannels.findIndex((c) => c.id === channel.id);

    navigation.navigate('Player', {
      channelId: channel.id,
      filteredChannels: filteredChannels,
      initialIndex: index >= 0 ? index : 0,
    });
  };

  const focusTargetId = route.params?.focusChannelId;

  if (!checkedAutoLaunch) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>📺 NewsHub</Text>
        <View style={styles.headerRight}>
          <Text style={styles.lastWatched}>Last Watched: {lastWatchedName}</Text>
          <Text style={styles.clock}>{timeStr}</Text>
        </View>
      </View>

      {/* Country Row */}
      <CountryTabs
        countries={countries}
        selectedCountry={selectedCountry}
        onSelectCountry={(c) => {
          setSelectedCountry(c);
          setSelectedLanguage('All');
        }}
      />

      {/* Language Row */}
      <LanguageTabs
        languages={languages}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      {/* 5-Column Grid */}
      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        numColumns={5}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item, index }) => {
          // Focus the previously watched channel when returning from PlayerScreen
          const hasPreferredFocus = focusTargetId
            ? item.id === focusTargetId
            : index === 0;

          return (
            <ChannelTile
              channel={item}
              hasTVPreferredFocus={hasPreferredFocus}
              onPress={handleChannelPress}
            />
          );
        }}
      />

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
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0b0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  gridContent: {
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  footerHelp: {
    color: '#6b6b70',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
