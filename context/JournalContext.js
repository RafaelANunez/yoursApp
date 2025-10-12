import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const STORAGE_KEY = '@journal_entries';

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (newEntries) => {
    try {
      const sortedEntries = newEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortedEntries));
      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error saving journal entries:', error);
      throw error;
    }
  };

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