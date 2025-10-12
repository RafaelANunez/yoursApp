import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

const EmergencyContactsContext = createContext();

export const useEmergencyContacts = () => {
  const context = useContext(EmergencyContactsContext);
  if (!context) {
    throw new Error('useEmergencyContacts must be used within an EmergencyContactsProvider');
  }
  return context;
};

export const EmergencyContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const STORAGE_KEY = '@emergency_contacts';

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContacts = async (newContacts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw error;
    }
  };

  const addContact = async (contact) => {
    const newContact = {
      id: Date.now().toString(),
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || '',
      createdAt: new Date().toISOString(),
    };
    const updatedContacts = [...contacts, newContact];
    await saveContacts(updatedContacts);
  };

  const updateContact = async (id, updatedContact) => {
    const updatedContacts = contacts.map((contact) =>
      contact.id === id
        ? { ...contact, ...updatedContact, updatedAt: new Date().toISOString() }
        : contact
    );
    await saveContacts(updatedContacts);
  };

  const deleteContact = async (id) => {
    const updatedContacts = contacts.filter((contact) => contact.id !== id);
    await saveContacts(updatedContacts);
  };

  const importFromDevice = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to import them.');
        return [];
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      return data
        .filter((contact) => contact.name && contact.phoneNumbers?.length > 0)
        .map((contact) => ({
          name: contact.name,
          phone: contact.phoneNumbers[0].number,
          relationship: '',
        }));
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert('Error', 'Failed to import contacts from device.');
      return [];
    }
  };

  const value = {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    importFromDevice,
  };

  return (
    <EmergencyContactsContext.Provider value={value}>
      {children}
    </EmergencyContactsContext.Provider>
  );
};