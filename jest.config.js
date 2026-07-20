module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-tvos|@react-navigation|react-native-safe-area-context|react-native-webview)/)',
  ],
};
