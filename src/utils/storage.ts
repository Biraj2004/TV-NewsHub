import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_WATCHED_KEY = '@newshub:last_watched_channel_id';
const LAST_WATCHED_TIME_KEY = '@newshub:last_watched_time';

/** Save channel ID and current timestamp */
export async function setLastWatchedChannel(channelId: string): Promise<void> {
  try {
    // Write timestamp first so that if a crash occurs mid-write,
    // the id key will be missing and getLastWatchedChannel returns null
    // rather than returning a stale id with a new timestamp.
    await AsyncStorage.setItem(LAST_WATCHED_TIME_KEY, Date.now().toString());
    await AsyncStorage.setItem(LAST_WATCHED_KEY, channelId);
  } catch (error) {
    console.error('Error saving last watched channel:', error);
  }
}

/** Read channel ID and saved timestamp */
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
