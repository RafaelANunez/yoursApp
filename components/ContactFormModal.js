import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export const ContactFormModal = ({ visible, contact, onClose, onSave }) => {
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [relationship, setRelationship] = useState(contact?.relationship || '');

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setRelationship(contact.relationship || '');
    } else {
      setName('');
      setPhone('');
      setRelationship('');
    }
  }, [contact, visible]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number.');
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.formModal}>
          <Text style={styles.formTitle}>
            {contact ? 'Edit Contact' : 'Add Emergency Contact'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <TextInput
            style={styles.input}
            placeholder="Relationship (optional)"
            placeholderTextColor="#9CA3AF"
            value={relationship}
            onChangeText={setRelationship}
            maxLength={30}
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