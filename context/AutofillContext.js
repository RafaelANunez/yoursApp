import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AutofillContext = createContext();

export const useAutofill = () => {
  const context = useContext(AutofillContext);
  if (!context) {
    throw new Error('useAutofill must be used within an AutofillProvider');
  }
  return context;
};

export const AutofillProvider = ({ children }) => {
  const [people, setPeople] = useState([]);
  const [locations, setLocations] = useState([]);

  const PEOPLE_STORAGE_KEY = '@autofill_people';
  const LOCATIONS_STORAGE_KEY = '@autofill_locations';

  useEffect(() => {
    loadAutofillData();
  }, []);

  const loadAutofillData = async () => {
    try {
      const storedPeople = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
      if (storedPeople) setPeople(JSON.parse(storedPeople));
      const storedLocations = await AsyncStorage.getItem(LOCATIONS_STORAGE_KEY);
      if (storedLocations) setLocations(JSON.parse(storedLocations));
    } catch (error) {
      console.error('Error loading autofill data:', error);
    }
  };

  const addPerson = async ({ name, relationship }) => {
    if (!name) return;
    const updatedPeople = [...people];
    const existingPerson = updatedPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingPerson) {
      if (relationship && !existingPerson.relationships.includes(relationship)) {
        existingPerson.relationships.push(relationship);
      }
    } else {
      updatedPeople.push({ name, relationships: relationship ? [relationship] : [] });
    }
    await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(updatedPeople));
    setPeople(updatedPeople);
  };

  const addLocation = async (location) => {
    if (!location || locations.includes(location)) return;
    const updatedLocations = [...locations, location];
    await AsyncStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updatedLocations));
    setLocations(updatedLocations);
  };

  const value = { people, locations, addPerson, addLocation };

  return (
    <AutofillContext.Provider value={value}>
      {children}
    </AutofillContext.Provider>
  );
};