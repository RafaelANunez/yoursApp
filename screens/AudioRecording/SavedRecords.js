import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  Pressable, 
  Alert, 
  TouchableOpacity,
  StatusBar 
} from 'react-native';
import { Audio } from 'expo-av';
// --- FIX: Use legacy import for compatibility with SDK 54 ---
import * as FileSystem from 'expo-file-system/legacy'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const CORAL_COLOR = '#FF6B6B';

const metaKeyFor = (fileUri) => `record_meta:${fileUri}`;

export const SavedRecords = ({ navigation }) => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [playingUri, setPlayingUri] = useState(null);
  const soundRef = useRef(new Audio.Sound());

  useEffect(() => {
    // Initial Load
    loadFiles();

    // Poll for new files (refresh list if a new recording is saved)
    const interval = setInterval(loadFiles, 2000);

    return () => {
      clearInterval(interval);
      unloadSound();
    };
  }, []);

  const unloadSound = async () => {
    try {
      await soundRef.current.unloadAsync();
    } catch (error) {}
  };

  const loadFiles = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        setFiles([]);
        return;
      }

      const names = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      const list = names.map((name) => ({
        name,
        uri: RECORDINGS_DIR + name,
      })).reverse(); // Show newest first

      setFiles(list);

      // Load metadata
      const metaEntries = {};
      for (const item of list) {
        const key = metaKeyFor(item.uri);
        const json = await AsyncStorage.getItem(key);
        if (json) metaEntries[item.uri] = JSON.parse(json);
      }
      setMetadata(metaEntries);
    } catch (error) {
      console.error('Error loading files', error);
    }
  };

  const playPause = async (uri) => {
    try {
      // If clicking the currently playing file, stop it
      if (playingUri === uri) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        setPlayingUri(null);
        return;
      }

      // Stop any other playing sound
      if (playingUri) {
        await soundRef.current.unloadAsync();
      }

      // Play new file
      await soundRef.current.loadAsync({ uri }, { shouldPlay: true });
      setPlayingUri(uri);
      
      soundRef.current.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingUri(null);
          soundRef.current.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Playback failed', error);
      setPlayingUri(null);
    }
  };

  const parseRecordingDate = (filename) => {
    // Format: HH:MM:SS_MM-DD-YYYY.mp3
    try {
      const base = filename.replace('.mp3', '');
      const [timePart, datePart] = base.split('_');
      if (!timePart || !datePart) return 'Unknown Date';
      return `${datePart.replace(/-/g, '/')} • ${timePart}`;
    } catch (e) {
      return 'Unknown Date';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'suspicious': return '#8B5CF6';
      default: return '#E5E7EB'; // Grey for regular
    }
  };

  const updateMetadata = async (uri, key, value) => {
    const newMeta = { ...(metadata[uri] || {}), [key]: value };
    await AsyncStorage.setItem(metaKeyFor(uri), JSON.stringify(newMeta));
    setMetadata(prev => ({ ...prev, [uri]: newMeta }));
  };

  const handleDelete = (uri) => {
    Alert.alert(
      'Delete Recording',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(uri);
              await AsyncStorage.removeItem(metaKeyFor(uri));
              loadFiles(); // Refresh list immediately
            } catch (error) {
              console.error('Delete failed', error);
            }
          },
        },
      ]
    );
  };

  const handleEditName = (uri, currentName) => {
    Alert.prompt(
      'Rename Recording',
      null,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: text => updateMetadata(uri, 'displayName', text) }
      ],
      'plain-text',
      currentName
    );
  };

  const handleSetSeverity = (uri) => {
    Alert.alert(
      'Set Priority',
      'Flag this recording based on urgency:',
      [
        { text: '🔴 Danger', onPress: () => updateMetadata(uri, 'severity', 'danger') },
        { text: '🟠 Warning', onPress: () => updateMetadata(uri, 'severity', 'warning') },
        { text: '🟣 Suspicious', onPress: () => updateMetadata(uri, 'severity', 'suspicious') },
        { text: '⚪ Regular', onPress: () => updateMetadata(uri, 'severity', 'regular') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const meta = metadata[item.uri] || {};
    const severityColor = getSeverityColor(meta.severity);
    const isPlaying = playingUri === item.uri;
    const displayName = meta.displayName || item.name;

    return (
      <View style={styles.card}>
        {/* Severity Strip */}
        <View style={[styles.severityStrip, { backgroundColor: severityColor }]} />
        
        <View style={styles.cardContent}>
          
          {/* Top Row: Play Button & Info */}
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.playButtonActive]} 
              onPress={() => playPause(item.uri)}
            >
              <Ionicons 
                name={isPlaying ? "stop" : "play"} 
                size={20} 
                color={isPlaying ? CORAL_COLOR : "#fff"} 
              />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.date}>{parseRecordingDate(item.name)}</Text>
            </View>
            
            {/* Severity Badge (Icon) */}
            {meta.severity && meta.severity !== 'regular' && (
               <Ionicons name="flag" size={16} color={severityColor} style={{marginRight: 10}}/>
            )}
          </View>

          {/* Description (if exists) */}
          {meta.description ? (
            <Text style={styles.description} numberOfLines={2}>{meta.description}</Text>
          ) : null}

          {/* Bottom Row: Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditName(item.uri, displayName)}>
              <Ionicons name="pencil-outline" size={16} color="#6B7280" />
              <Text style={styles.actionText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetSeverity(item.uri)}>
              <Ionicons name="flag-outline" size={16} color="#6B7280" />
              <Text style={styles.actionText}>Flag</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
               Alert.prompt('Add Note', 'Enter description:', [
                 { text: 'Cancel' }, 
                 { text: 'Save', onPress: t => updateMetadata(item.uri, 'description', t) }
               ], 'plain-text', meta.description)
            }}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.actionText}>Note</Text>
            </TouchableOpacity>

            <View style={{flex: 1}} /> 
            
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.uri)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        data={files}
        keyExtractor={(item) => item.uri}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mic-off-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubText}>Swipe left to start recording</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Card Styles
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  severityStrip: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  
  // Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CORAL_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: CORAL_COLOR,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // Description
  description: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 12,
    marginLeft: 56, // Align with text start
  },
  
  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});