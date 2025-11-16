import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Simple mapping of mood keys to emojis
// You can change the emojis or keys here
const moodOptions = [
  { key: 'rad', emoji: '😁' },
  { key: 'good', emoji: '😊' },
  { key: 'meh', emoji: '😐' },
  { key: 'bad', emoji: '😟' },
  { key: 'awful', emoji: '😢' },
];

export const MoodSelection = ({ selectedMood, onSelectMood }) => {
  return (
    <View style={styles.moodSelectorContainer}>
      {moodOptions.map((mood) => (
        <TouchableOpacity
          key={mood.key}
          style={[
            styles.moodOption,
            selectedMood === mood.key && styles.moodOptionSelected,
          ]}
          onPress={() => onSelectMood(mood.key)}
        >
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  moodSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  moodOption: {
    padding: 10,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  moodOptionSelected: {
    backgroundColor: '#F472B6', // Highlight selected mood
    borderColor: '#F9A8D4',
    borderWidth: 2,
    transform: [{ scale: 1.1 }], // Make it slightly larger
  },
  moodEmoji: {
    fontSize: 30,
  },
});