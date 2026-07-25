import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrandLogo } from './BrandLogo';

export function NoInternetScreen() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerState}>
        <View style={styles.logoContainer}>
          <BrandLogo size={64} />
        </View>
        <Text style={styles.msg}>No internet connection</Text>
        <Text style={styles.sub}>
          NewsHub will reconnect automatically — no need to press anything
        </Text>
        <View style={styles.retryPill}>
          <Text style={styles.retryText}>Retrying{dots}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 480,
  },
  logoContainer: {
    marginBottom: 24,
  },
  msg: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    color: '#8a8a8f',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  retryPill: {
    borderWidth: 1,
    borderColor: '#3a3a3e',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  retryText: {
    color: '#c9c9cd',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
