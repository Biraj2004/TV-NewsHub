import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_WATCHED_KEY = '@newshub:last_watched_channel_id';
const LAST_WATCHED_TIME_KEY = '@newshub:last_watched_time';

// Save the channel ID and the current time
export async function setLastWatchedChannel(channelId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_WATCHED_KEY, channelId);
    await AsyncStorage.setItem(LAST_WATCHED_TIME_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving last watched channel:', error);
  }
}

// Get the channel ID and the saved timestamp
export async function getLastWatchedChannel(): Promise<{ id: string; timestamp: number } | null> {
  try {
    const id = await AsyncStorage.getItem(LAST_WATCHED_KEY);
    const timeStr = await AsyncStorage.getItem(LAST_WATCHED_TIME_KEY);
    if (id && timeStr) {
      return { id, timestamp: parseInt(timeStr, 10) };
    }
  } catch (error) {
    console.error('Error reading last watched channel:', error);
  }
  return null;
}
