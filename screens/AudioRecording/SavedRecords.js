import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EditIcon, DeleteIcon } from '../../components/Icons';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';


const metaKeyFor = (fileUri) => `record_meta:${fileUri}`;


export const SavedRecords = () => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [playingUri, setPlayingUri] = useState(null);
  const soundRef = useRef(new Audio.Sound());
  const [editingUri, setEditingUri] = useState(null);

  useEffect(() => {
    (async () => {
      await loadFiles();
    })();

      // Poll for new files every 2 seconds
  const interval = setInterval(async () => {
    await loadFiles();
  }, 2000);

  return () => {
    clearInterval(interval); // cleanup interval
    (async () => {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {}
    })();
  };
  }, []);

  const loadFiles = async () => {
    try{
      const dirExists = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if(!dirExists.exists){
        setFiles([]);
        return;
      }

      const names = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      const list = names.map((name) => ({
        name,
        uri: RECORDINGS_DIR + name,
      }));

      setFiles(list);

      //load metadata for all items
      const metaEntries = {};
      for (const item of list) {
        const key = metaKeyFor(item.uri);
        const json = await AsyncStorage.getItem(key);
        if(json) metaEntries[item.uri] = JSON.parse(json);
      }
      setMetadata(metaEntries);
    } catch (error) {
      console.error('Error loading files', error);
      setFiles([]);
    }
  };

  const playPause = async (uri) => {
    try {
      // if same file is playing -> pause/stop
      if (playingUri === uri) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        setPlayingUri(null);
        soundRef.current = new Audio.Sound();
        return;
      }

      // stop any existing sound
      if (playingUri) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (error) {}
        soundRef.current = new Audio.Sound();
        setPlayingUri(null);
      }

      // load and play new
      const status = await soundRef.current.loadAsync({ uri }, { shouldPlay: true });
      if (status.isLoaded) setPlayingUri(uri);
      //optional: listen to finish
      soundRef.current.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = new Audio.Sound();
          setPlayingUri(null);
        }
      });
    } catch (error) {
      console.error('playback error: ', error);
      Alert.alert('playback error: ', String(error));
    }
  };

  const saveMetadata = async (uri, meta) => {
    try {
      const key = metaKeyFor(uri);
      await AsyncStorage.setItem(key, JSON.stringify(meta));
      setMetadata((prev) => ({ ...prev, [uri]: meta }));
    } catch (error) {
      console.error('error saving metadata: ', error);
    }
  };

  const parseRecordingDate = (filename) => {
    // your naming in RecordAudio: H:M:S_M-D-YYYY.mp3
    // example: 14:30:45_11-16-2025.mp3
    try {
      const base = filename.replace('.mp3', '');
      const [timePart, datePart] = base.split('_');
      if (!timePart || !datePart) return null;
      const [h, m, s] = timePart.split(':').map((v) => parseInt(v, 10));
      const [month, day, year] = datePart.split('-').map((v) => parseInt(v, 10));
      const dt = new Date(year, month - 1, day, h, m, s);
      return dt.toLocaleString();
    } catch (e) {
      return null;
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      danger: '#FECACA',
      warning: '#FEF08A',
      suspicious: '#E5E7EB',
      regular: 'white'
    };
    return colors[severity] || 'white';
  };

  const deleteRecording = (uri) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording and its metadata?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the file
              await FileSystem.deleteAsync(uri);
              // Delete metadata
              const key = metaKeyFor(uri);
              await AsyncStorage.removeItem(key);
              // Update state
              setFiles((prev) => prev.filter((f) => f.uri !== uri));
              setMetadata((prev) => {
                const updated = { ...prev };
                delete updated[uri];
                return updated;
              });
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete the recording.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const meta = metadata[item.uri] || {};
    return(
      <View style={[styles.recordingItem, { backgroundColor: getSeverityColor(meta.severity) }]}>
        <View style={styles.recordingItemContent}>
          <Text style={styles.recordingItemTitle}>{meta.displayName || item.name}</Text>
          <Text style={styles.recordingItemDate}>{parseRecordingDate(item.name) || 'Unknown Date'}</Text>
          <Text style={styles.recordingItemNotes}>{meta.description || 'No description'}</Text>
        </View>
        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => playPause(item.uri)}
          >
            <Text style={styles.playButtonText}>{playingUri === item.uri ? '⏹' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.prompt(
                'Display Name',
                'Enter a display name',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: async (text) => {
                      const newMeta = { ...(metadata[item.uri] || {}), displayName: text };
                      await saveMetadata(item.uri, newMeta);
                    },
                  },
                ],
                'plain-text',
                meta.displayName || ''
              );
            }}
          >
            <Text style={styles.smallButtonText}>Name</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.prompt(
                'Description',
                'Add a description',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: async (text) => {
                      const newMeta = { ...(metadata[item.uri] || {}), description: text };
                      await saveMetadata(item.uri, newMeta);
                    },
                  },
                ],
                'plain-text',
                meta.description || ''
              );
            }}
          >
            <Text style={styles.smallButtonText}>Desc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const severities = ['danger', 'warning', 'suspicious', 'regular'];
              Alert.alert(
                'Set Severity',
                'Choose a severity level',
                [
                  ...severities.map((sev) => ({
                    text: sev.charAt(0).toUpperCase() + sev.slice(1),
                    onPress: async () => {
                      const newMeta = { ...(metadata[item.uri] || {}), severity: sev };
                      await saveMetadata(item.uri, newMeta);
                    },
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.smallButtonText}>Severity</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recordingIconActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              Alert.prompt(
                'Edit Recording',
                'Update display name or description',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: async (text) => {
                      const newMeta = { ...(metadata[item.uri] || {}), displayName: text };
                      await saveMetadata(item.uri, newMeta);
                    },
                  },
                ],
                'plain-text',
                meta.displayName || ''
              );
            }}
          >
            <EditIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => deleteRecording(item.uri)}
          >
            <DeleteIcon />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Saved Recordings</Text>
      <FlatList
        data={files}
        keyExtractor={(it) => it.uri}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No recordings yet</Text>}
        contentContainerStyle={files.length === 0 ? styles.emptyContainer : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, 
    padding: 16, 
    backgroundColor: '#f9f9f9' 
  },
  header: { 
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: '5%',
    textAlign: 'center',
  },
  recordingItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordingItemContent: {
    flex: 1,
  },
  recordingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recordingItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  recordingItemNotes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    marginRight: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F87171',
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  recordingIconActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
  },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});