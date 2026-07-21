import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DegradedStatusBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        ⚠️ Having trouble checking live status — showing last known info
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(138, 138, 143, 0.1)',
    borderWidth: 1,
    borderColor: '#3a3a3e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 32,
    marginBottom: 16,
  },
  text: {
    color: '#c9c9cd',
    fontSize: 13,
    fontWeight: '500',
  },
});
