import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CloseIcon } from './Icons';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';

export const ContactImportModal = ({ visible, onClose }) => {
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addContact, importFromDevice } = useEmergencyContacts();

  useEffect(() => {
    if (visible) {
      loadDeviceContacts();
    }
  }, [visible]);

  const loadDeviceContacts = async () => {
    setIsLoading(true);
    try {
      const contacts = await importFromDevice();
      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Error loading device contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContact = (index) => {
    setSelectedContacts(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const importSelected = async () => {
    try {
      for (const index of selectedContacts) {
        await addContact(availableContacts[index]);
      }
      Alert.alert('Success', `Imported ${selectedContacts.length} contact(s).`);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.importModal}>
          <View style={styles.importHeader}>
            <Text style={styles.formTitle}>Import Contacts</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading contacts...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={availableContacts}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.importContactItem,
                      selectedContacts.includes(index) && styles.selectedContactItem
                    ]}
                    onPress={() => toggleContact(index)}
                  >
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phone}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      selectedContacts.includes(index) && styles.checkedBox
                    ]} />
                  </TouchableOpacity>
                )}
                style={styles.contactsList}
              />

              <View style={styles.importActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, selectedContacts.length === 0 && styles.disabledButton]}
                  onPress={importSelected}
                  disabled={selectedContacts.length === 0}
                >
                  <Text style={styles.saveButtonText}>
                    Import ({selectedContacts.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
      importModal: {
        width: '90%',
        height: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
      },
      importHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      },
      formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      contactsList: {
        flex: 1,
      },
      importContactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      },
      selectedContactItem: {
        backgroundColor: '#FEF2F2',
      },
      contactInfo: {
        flex: 1,
      },
      contactName: {
        fontSize: 16,
      },
      contactPhone: {
        fontSize: 14,
        color: '#6B7280',
      },
      checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
      },
      checkedBox: {
        backgroundColor: '#F472B6',
        borderColor: '#F472B6',
      },
      importActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
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
      disabledButton: {
        backgroundColor: '#FBCFE8',
      },
});