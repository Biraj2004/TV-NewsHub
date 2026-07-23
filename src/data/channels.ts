import indiaChannels from './countries/india.json';
import bangladeshChannels from './countries/bangladesh.json';

export interface Channel {
  id: string;
  name: string;
  language: string;
  country: string;
  logo: string;
  youtubeChannelId?: string;
  streamUrl?: string; // Direct HLS (.m3u8) feed (e.g. 1080p Akamai/CloudFront CDN)
  embedUrl?: string;  // Web embed feed
}

// Flat list containing all channels from all countries
const allChannels: Channel[] = [
  ...(indiaChannels as Channel[]),
  ...(bangladeshChannels as Channel[]),
];

export default allChannels;
