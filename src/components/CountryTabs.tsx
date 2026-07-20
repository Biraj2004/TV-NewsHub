import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface CountryTabsProps {
  countries: string[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

export function CountryTabs({ countries, selectedCountry, onSelectCountry }: CountryTabsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Country</Text>
      {countries.map((country, index) => {
        const isSelected = country === selectedCountry;
        
        let flag = '🌐';
        if (country === 'India') flag = '🇮🇳';
        if (country === 'Bangladesh') flag = '🇧🇩';

        return (
          <Pressable
            key={country}
            hasTVPreferredFocus={index === 0}
            onPress={() => onSelectCountry(country)}
            style={({ focused }) => [
              styles.pill,
              isSelected && styles.pillSelected,
              focused && styles.pillFocused,
            ]}
          >
            {({ focused }) => (
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.pillTextSelected,
                  focused && styles.pillTextFocused,
                ]}
              >
                {flag} {country}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  label: {
    color: '#6b6b70',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 12,
  },
  pill: {
    backgroundColor: '#2a2a2e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: '#ffffff',
  },
  pillFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  pillText: {
    color: '#c9c9cd',
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#111111',
  },
  pillTextFocused: {
    color: '#ffffff',
  },
});
