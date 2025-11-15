import { RecordingIcon, StopRecordingIcon } from '../../components/Icons'; // Assuming icons are in ../components/Icons.js
import { View, Text, StyleSheet,SafeAreaView, Pressable } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
  useAudioPlayer,
  audioSource
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';

export const RecordAudio = () => {

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const player = useAudioPlayer(audioSource);

  const startRecording = async () => 
  {
    console.log("Preparing to record");
    await audioRecorder.prepareToRecordAsync();
    console.log("prepared")
    audioRecorder.record({forDuration: 5});
    console.log("Recording started");
  }
  const stopRecording = async () =>
  {
    if (recorderState.isRecording){
      await audioRecorder.stop();
      console.log("Recording stopped");
      const source = await audioRecorder.getURI();
      const fileName = 'recording_' + Date.now() + Time.now() + '.mp3';

      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
      await FileSystem.moveAsync({
        from: source,
        to: FileSystem.documentDirectory + 'recordings/' + fileName
      });
      
    }
  }

  return (
    <SafeAreaView>
      <View style={styles.recordingButtonContainer}>
          {/* <RecordingIcon color='#F87171' height={200} width={200} /> */}
          <Pressable
          alignItems='center'
          onPress={() => recorderState.isRecording ? stopRecording() : startRecording()
          }
          style={({pressed}) => [
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
                {recorderState.isRecording ? 'Stop Recording' : 'Start Recording' }
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