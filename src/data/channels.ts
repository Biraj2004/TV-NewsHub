import indiaChannels from './countries/india.json';
import bangladeshChannels from './countries/bangladesh.json';

export interface Channel {
  id: string;
  name: string;
  language: string;
  country: string;
  logo: string;
  youtubeChannelId: string;
}

// Flat list containing all channels from all countries
const allChannels: Channel[] = [
  ...(indiaChannels as Channel[]),
  ...(bangladeshChannels as Channel[]),
];

export default allChannels;
