import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView, Platform } from 'react-native';
import { RecordIcon } from '../components/Icons'; // Assuming icons are in ../components/Icons.js
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';

export default function AudioRecordingScreen() { [navigation] }
{
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const player = useAudioPlayer(audioSource);

  const startRecording = async () => 
  {
    await audioRecorder.prepareToRecordAsync();
    recorderState.isRecording == true;
    audioRecorder.record();
  }
  const stopRecording = async () =>
  {
    if (recorderState.isRecording){
      await audioRecorder.stop();
      const source = await audioRecorder.getURI();
      const fileName = 'recording_' + Date.now() + '.mp3';

      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
      await FileSystem.moveAsync({
        from: source,
        to: FileSystem.documentDirectory + 'recordings/' + fileName
      });
      
      recorderState.isRecording == false;
    }
  }
}
