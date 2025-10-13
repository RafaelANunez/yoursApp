import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmergencyContactsContext = createContext();

export const useEmergencyContacts = () => {
  const ctx = useContext(EmergencyContactsContext);
  if (!ctx) throw new Error('Must be used within provider');
  return ctx;
};

export const EmergencyContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const STORAGE_KEY = '@emergency_contacts';

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setContacts(JSON.parse(stored));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const saveContacts = async (newContacts) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  // addContact, updateContact, deleteContact, importFromDevice...
  const value = { contacts, isLoading, addContact: async ()=>{}, updateContact: async ()=>{}, deleteContact: async ()=>{}, importFromDevice: async ()=>[] };

  return <EmergencyContactsContext.Provider value={value}>{children}</EmergencyContactsContext.Provider>;
};
