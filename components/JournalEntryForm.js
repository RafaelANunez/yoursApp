import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export const JournalEntryForm = ({ visible, entry, onClose, onSave, templateData }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setNotes(entry.notes || '');
    } else if (templateData) {
      setTitle(templateData.title);
      setNotes(templateData.notes);
    } else {
      setTitle('');
      setNotes('');
    }
  }, [entry, templateData, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your entry.');
      return;
    }
    onSave({ title: title.trim(), notes: notes.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.formModal}>
          <Text style={styles.formTitle}>
            {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </Text>

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

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      formModal: {
        width: '90%',
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
});