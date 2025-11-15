import React, { useState } from 'react';
import { View, Text, StyleSheet,SafeAreaView, Pressable } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  audioSource
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';

export const SavedRecords = () => 
{

  return 
  (
    <SafeAreaView>
      <View>
        <Text> Saved Records Will Appear Here </Text>
      </View>
    </SafeAreaView>
  );

}