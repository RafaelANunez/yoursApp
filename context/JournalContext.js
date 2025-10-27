import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // Import useAuth

const JournalContext = createContext();

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

export const JournalProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MODIFIED: Get user from AuthContext ---
  const { user } = useAuth();
  // State to hold the user-specific storage key
  const [storageKey, setStorageKey] = useState(null);

  // --- MODIFIED: Set storage key based on user ---
  useEffect(() => {
    if (user?.email) {
      // If user is logged in, set their unique storage key
      setStorageKey(`@${user.email}_journal_entries`);
    } else {
      // User logged out, clear the key and any loaded data
      setStorageKey(null);
      setEntries([]);
      setIsLoading(false);
    }
  }, [user]); // This effect re-runs when the user logs in or out

  // --- MODIFIED: Load entries only when storageKey is set ---
  useEffect(() => {
    if (storageKey) {
      // Once the storageKey is set, load the entries from it
      loadEntries();
    }
  }, [storageKey]); // This effect re-runs when the storageKey changes

  const loadEntries = async () => {
    if (!storageKey) return; // Guard against running before key is set
    
    setIsLoading(true);
    try {
      // Use the dynamic, user-specific key
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries([]); // Set to empty array if nothing is stored for this user
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (newEntries) => {
    if (!storageKey) return; // Guard against running if no user is logged in
    
    try {
      const sortedEntries = newEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Use the dynamic, user-specific key
      await AsyncStorage.setItem(storageKey, JSON.stringify(sortedEntries));
      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error saving journal entries:', error);
      throw error;
    }
  };

  // --- (No changes needed below, as they all rely on 'saveEntries') ---

  const addEntry = async (entry) => {
    const newEntry = {
      id: Date.now().toString(),
      ...entry,
      date: entry.date || new Date().toISOString(),
    };
    const updatedEntries = [...entries, newEntry];
    await saveEntries(updatedEntries);
  };

  const updateEntry = async (id, updatedEntry) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === id
        ? { ...entry, ...updatedEntry, updatedAt: new Date().toISOString() }
        : entry
    );
    await saveEntries(updatedEntries);
  };

  const deleteEntry = async (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    await saveEntries(updatedEntries);
  };

  const value = {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
};