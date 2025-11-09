// rafaelanunez/yoursapp/yoursApp-c_merge/components/JournalEntryForm.js

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { DeleteIcon } from './Icons'; // Assuming you have a DeleteIcon in Icons.js

export const JournalEntryForm = ({ visible, entry, onClose, onSave, templateData }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]); // <-- New state for attachments
  const [recording, setRecording] = useState(); // <-- New state for audio recording

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setNotes(entry.notes || '');
      setAttachments(entry.attachments || []); // <-- Load existing attachments
    } else if (templateData) {
      setTitle(templateData.title);
      setNotes(templateData.notes);
      setAttachments([]); // <-- Reset attachments for template
    } else {
      setTitle('');
      setNotes('');
      setAttachments([]); // <-- Reset attachments for new entry
    }
  }, [entry, templateData, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your entry.');
      return;
    }
    // <-- Pass attachments to the save handler
    onSave({ title: title.trim(), notes: notes.trim(), attachments });
    onClose();
  };

  // --- New Media Handlers ---

  const handlePickMedia = async (mediaType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your media library.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newAttachment = {
        uri: result.assets[0].uri,
        type: mediaType, // 'image' or 'video'
      };
      setAttachments(prev => [...prev, newAttachment]);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to use the microphone.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    const newAttachment = {
      uri: uri,
      type: 'audio',
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const removeAttachment = (uri) => {
    setAttachments(prev => prev.filter(att => att.uri !== uri));
  };

  // --- Helper to render attachments ---
  const renderAttachments = () => {
    return attachments.map((att, index) => (
      <View key={index} style={styles.attachmentChip}>
        {att.type === 'image' && <Image source={{ uri: att.uri }} style={styles.attachmentPreview} />}
        <Text style={styles.attachmentText} numberOfLines={1}>
          {att.type}: {att.uri.split('/').pop()}
        </Text>
        <TouchableOpacity onPress={() => removeAttachment(att.uri)} style={styles.removeAttButton}>
           {/* Assuming you have a small DeleteIcon or similar */}
           <Text style={{color: 'red', fontWeight: 'bold'}}>X</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.formModal}>
          <Text style={styles.formTitle}>
            {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </Text>

          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <TextInput
              style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
              placeholder="Add notes..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline={true}
            />

            {/* --- New Attachment Section --- */}
            <View style={styles.mediaButtonsContainer}>
              <TouchableOpacity style={styles.mediaButton} onPress={() => handlePickMedia('image')}>
                <Text style={styles.mediaButtonText}>Add Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={() => handlePickMedia('video')}>
                <Text style={styles.mediaButtonText}>Add Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={recording ? stopRecording : startRecording}>
                <Text style={styles.mediaButtonText}>{recording ? 'Stop Recording' : 'Record Audio'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.attachmentList}>
              {renderAttachments()}
            </View>
            {/* --- End New Section --- */}

          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Add new styles to your StyleSheet ---
const styles = StyleSheet.create({
    // ... (keep all your existing styles)
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      formModal: {
        width: '90%',
        maxHeight: '90%', // <-- Added maxHeight for scrollview
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        elevation: 10,
      },
      formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      },
      input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
        color: '#1F2937',
      },
      formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 16, // <-- Added padding
        borderTopWidth: 1, // <-- Added border
        borderTopColor: '#E5E7EB',
      },
      cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
      },
      cancelButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
      },
      saveButton: {
        backgroundColor: '#F472B6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginLeft: 8,
      },
      saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
      
    // --- New Styles ---
    mediaButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    mediaButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    mediaButtonText: {
        color: '#1F2937',
        fontWeight: '600'
    },
    attachmentList: {
        marginBottom: 16,
    },
    attachmentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 8,
        marginBottom: 8,
    },
    attachmentPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    attachmentText: {
        flex: 1,
        color: '#374151',
    },
    removeAttButton: {
        padding: 4,
        marginLeft: 8,
    }
});