import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface LanguageTabsProps {
  languages: string[];
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
  onFocus?: () => void;
}

export function LanguageTabs({ languages, selectedLanguage, onSelectLanguage, onFocus }: LanguageTabsProps) {
  return (
    <View style={styles.container}>
      {languages.map((language) => {
        const isSelected = language === selectedLanguage;

        return (
          <Pressable
            key={language}
            onFocus={onFocus}
            onPress={() => onSelectLanguage(language)}
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
                {language}
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
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  pill: {
    backgroundColor: '#2a2a2e',
    paddingVertical: 4,
    paddingHorizontal: 14,
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
