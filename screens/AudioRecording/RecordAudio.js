import { RecordingIcon, StopRecordingIcon } from '../../components/Icons'; // Assuming icons are in ../components/Icons.js
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { File, Directory, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';

export const RecordAudio = () => {

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioDirectory = FileSystem.documentDirectory + 'recordings/';

  const startRecording = async () => 
  {
    console.log("Preparing to record");
    await audioRecorder.prepareToRecordAsync();
    console.log("prepared")
    audioRecorder.record({ forDuration: 10 });
    console.log("Recording started");
  }

  const stopRecording = async () =>
  {
    await audioRecorder.stop();
    console.log("Recording stopped");
    const audioFileUri = await getDate() + '.mp3';
    console.log("saving recording as: ", audioFileUri);
    console.log(audioRecorder.uri);
    const fileUri = audioRecorder.uri;
    const destinationUri = audioDirectory + audioFileUri;
    
    try {
      // Ensure the recordings directory exists
      await FileSystem.makeDirectoryAsync(audioDirectory, { intermediates: true });
      
      // Copy the file from temporary location to recordings directory
      await FileSystem.copyAsync({
        from: fileUri,
        to: destinationUri,
      });
      console.log("File saved to: ", destinationUri);
      
      // Delete the original temporary file
      await FileSystem.deleteAsync(fileUri);
      console.log("Temporary file deleted");
    } catch (error) {
      console.error("Error saving recording: ", error);
    }
  }

  const getDate = () => 
  {
    const date = new Date();
    const recordingDate = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '_' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear();
    console.log(recordingDate);
    return recordingDate;
  }

  return (
    <SafeAreaView>
      <View style={styles.recordingButtonContainer}>
          {/* <RecordingIcon color='#F87171' height={200} width={200} /> */}
          <Pressable
            alignItems='center'
            onPress={() => recorderState.isRecording ? stopRecording() : startRecording()}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.5 : 1.0,
              },
              styles.recordingIcon,
            ]}
          >
            {recorderState.isRecording ?
              <StopRecordingIcon color='#F87171' height={200} width={200} /> 
              : 
              <RecordingIcon color='#F87171' height={200} width={200} />}
            <View style={styles.recordingButton}>
              <Text style={styles.recordingButtonText}> 
                { recorderState.isRecording ? 'Stop Recording' : 'Start Recording' }
              </Text> 
            </View>
          </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  recordingButton: {
    backgroundColor: '#F87171', 
    borderRadius: 25,
    height: 50,
    marginTop: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    //marginBottom: 20,
  },
  recordingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: '20%',
  },
  recordingButtonContainer: {
    justifyContent: 'center',
    marginVertical: '50%',
    paddingHorizontal: '20%',
  },
  recordingIcon: {
    color: '#F87171',
    height: '100%',
    width: '100%',
    marginBottom: '20%',
  },
})
