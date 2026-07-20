/* eslint-env jest */
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
  };
});

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

// Mock react-native-youtube-iframe
jest.mock('react-native-youtube-iframe', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => {
  let cache = {};
  return {
    setItem: jest.fn((key, value) => {
      cache[key] = value;
      return Promise.resolve(null);
    }),
    getItem: jest.fn((key) => {
      return Promise.resolve(cache[key] || null);
    }),
    removeItem: jest.fn((key) => {
      delete cache[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      cache = {};
      return Promise.resolve(null);
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createNativeStackNavigator: () => {
      return {
        Navigator: ({ children }) => React.createElement(View, null, children),
        Screen: ({ component: Component, name }) => {
          if (name === 'Home') {
            return React.createElement(Component, { navigation: { navigate: jest.fn() }, route: { params: {} } });
          }
          return null;
        },
      };
    },
  };
});

jest.mock('@react-navigation/native', () => {
  return {
    NavigationContainer: ({ children }) => children,
  };
});

// Mock useLiveChannelResolver to prevent asynchronous network requests in tests
jest.mock('./src/hooks/useLiveChannelResolver', () => ({
  useLiveChannelResolver: () => ({
    videoId: 'mock-video-id',
    isLoading: false,
    isError: false,
    isOffline: false,
  }),
}));