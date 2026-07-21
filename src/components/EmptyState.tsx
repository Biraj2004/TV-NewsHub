import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  language: string;
  country: string;
}

export function EmptyState({ language, country }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.msg}>No {language} channels yet for {country}</Text>
      <Text style={styles.sub}>Try a different language or switch back to another country</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 48,
    color: '#3a3a40',
    marginBottom: 16,
  },
  msg: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    color: '#8a8a8f',
    fontSize: 13,
    textAlign: 'center',
  },
});
