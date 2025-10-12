import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import { ContactFormModal } from '../components/ContactFormModal';
import { ContactImportModal } from '../components/ContactImportModal';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { ContactIcon, EditIcon, DeleteIcon, ImportIcon } from '../components/icons';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const ContactsPage = ({ onBack }) => {
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useEmergencyContacts();
  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const handleAddContact = () => {
    setEditingContact(null);
    setFormVisible(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormVisible(true);
  };

  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData);
      } else {
        await addContact(contactData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact.');
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContact(contact.id)
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.fullPage}>
        <PageHeader title="Emergency Contacts" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <Text>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Emergency Contacts" onBack={onBack} />

      <View style={styles.contactsContainer}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <ContactIcon color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No emergency contacts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add trusted contacts who can be reached in case of emergency
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactItem}>
                <View style={styles.contactItemContent}>
                  <View style={styles.contactAvatar}>
                    <ContactIcon color="#F9A8D4" />
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactItemName}>{item.name}</Text>
                    <Text style={styles.contactItemPhone}>{item.phone}</Text>
                    {item.relationship && (
                      <Text style={styles.contactItemRelationship}>{item.relationship}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditContact(item)}
                  >
                    <EditIcon />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteContact(item)}
                  >
                    <DeleteIcon />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.contactsActions}>
          <TouchableOpacity style={styles.importButton} onPress={() => setImportVisible(true)}>
            <ImportIcon color="#4B5563" />
            <Text style={styles.importButtonText}>Import from Device</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.floatingActionButton} onPress={handleAddContact}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ContactFormModal
        visible={formVisible}
        contact={editingContact}
        onClose={() => setFormVisible(false)}
        onSave={handleSaveContact}
      />

      <ContactImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
      },
      pageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        textAlign: 'center',
      },
      contactsContainer: {
        flex: 1,
        padding: 20,
      },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      emptyStateText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
      },
      emptyStateSubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: '80%',
      },
      contactItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      contactItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      contactAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      contactDetails: {
        flex: 1,
      },
      contactItemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
      },
      contactItemPhone: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
      },
      contactItemRelationship: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 2,
      },
      contactActions: {
        flexDirection: 'row',
      },
      actionButton: {
        padding: 8,
        marginLeft: 8,
      },
      contactsActions: {
        marginTop: 16,
        alignItems: 'center',
      },
      importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
      },
      importButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
      },
      floatingActionButton: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F9A8D4', // pink-300
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
      },
      fabText: {
        color: 'white',
        fontSize: 30,
        lineHeight: 34,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
});