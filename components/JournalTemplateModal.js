import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export const JournalTemplateModal = ({ visible, onClose, onSelectTemplate }) => (
  <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.templateModal}>
        <Text style={styles.formTitle}>New Journal Entry</Text>
        <Text style={styles.templateSubtitle}>Select a template to get started:</Text>

        <TouchableOpacity style={styles.templateButton} onPress={() => onSelectTemplate('incident')}>
          <Text style={styles.templateButtonText}>Incident Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.templateButton} onPress={() => onSelectTemplate('journey')}>
          <Text style={styles.templateButtonText}>Returning from Point A to B</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.templateButton} onPress={() => onSelectTemplate('meeting')}>
          <Text style={styles.templateButtonText}>Meeting with a Person</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.templateButton} onPress={() => onSelectTemplate('interaction')}>
          <Text style={styles.templateButtonText}>Interaction with a Person</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.templateButton} onPress={() => onSelectTemplate('blank')}>
          <Text style={styles.templateButtonText}>Blank Entry</Text>
        </TouchableOpacity>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      templateModal: {
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
      templateSubtitle: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
      },
      templateButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        borderRadius: 8,
        marginBottom: 12,
      },
      templateButtonText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
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
});