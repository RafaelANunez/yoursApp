import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  SectionList,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';




// --- SVG Icons (Converted for React Native) ---
const MenuIcon = ({ color = '#555' }) => (
  <View style={{ width: 24, height: 24, justifyContent: 'space-around' }}>
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

const JournalIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M8 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 8V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TimerIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SettingsIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15L19.4 15C19.7712 14.8986 20.1257 14.7551 20.4598 14.573L20.4598 14.573C20.6214 14.4821 20.7683 14.3721 20.9 14.24L22 12L20.5 9L19.5402 9.42705C19.2317 9.24486 18.8997 9.10137 18.55 9L18 7H16L15.4402 7.57295C15.1003 7.89863 14.7177 8.16913 14.3 8.37L13 7L11 7L10.3 8.37C9.88229 8.16913 9.49973 7.89863 9.1598 7.57295L8.6 7L6.6 7L6.1 9C5.70027 9.10137 5.36826 9.24486 5.0598 9.42705L4.1 9L2.6 12L3.7 14.24C3.83171 14.3721 3.97858 14.4821 4.1402 14.573L4.1402 14.573C4.47427 14.7551 4.8288 14.8986 5.2 15L5.2 15L6.1 18H8.6L9.1598 17.427C9.49973 17.1014 9.88229 16.8309 10.3 16.63L11 18H13L14.3 16.63C14.7177 16.8309 15.1003 17.1014 15.4402 17.427L16 18H18L18.55 15C18.8997 14.8986 19.2317 14.7551 19.5402 14.573L19.4 15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = ({ color = '#333' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ContactIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PhoneIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.04981 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59544 1.99532 8.06428 2.16718 8.43018 2.48363C8.79608 2.80008 9.03318 3.23954 9.10999 3.72C9.25523 4.68007 9.52015 5.62273 9.89999 6.53C10.0177 6.88792 10.0385 7.27691 9.96073 7.65088C9.88297 8.02485 9.70517 8.36811 9.44999 8.64L8.08999 10C9.513 12.4135 11.5865 14.4870 14 15.91L15.36 14.55C15.6319 14.2948 15.9751 14.117 16.3491 14.0393C16.7231 13.9615 17.1121 13.9823 17.47 14.1C18.3773 14.4798 19.3199 14.7448 20.28 14.89C20.7658 14.9687 21.2094 15.2093 21.5265 15.5789C21.8437 15.9484 22.0122 16.4221 21.01 16.92H22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ color = '#555' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.49998C18.8978 2.10216 19.4374 1.87866 20 1.87866C20.5626 1.87866 21.1022 2.10216 21.5 2.49998C21.8978 2.89781 22.1213 3.43737 22.1213 3.99998C22.1213 4.56259 21.8978 5.10216 21.5 5.49998L12 15L8 16L9 12L18.5 2.49998Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeleteIcon = ({ color = '#EF4444' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ImportIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 10L12 15L17 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// --- Autofill Context ---
const AutofillContext = React.createContext();

const useAutofill = () => {
  const context = React.useContext(AutofillContext);
  if (!context) {
    throw new Error('useAutofill must be used within an AutofillProvider');
  }
  return context;
};

const AutofillProvider = ({ children }) => {
  const [people, setPeople] = React.useState([]);
  const [locations, setLocations] = React.useState([]);

  const PEOPLE_STORAGE_KEY = '@autofill_people';
  const LOCATIONS_STORAGE_KEY = '@autofill_locations';

  React.useEffect(() => {
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


// --- Journal Context ---
const JournalContext = React.createContext();

const useJournal = () => {
  const context = React.useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

const JournalProvider = ({ children }) => {
  const [entries, setEntries] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const STORAGE_KEY = '@journal_entries';

  React.useEffect(() => {
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
      // Sort by date before saving
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
      date: entry.date || new Date().toISOString(), // Use provided date or now
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


// --- Emergency Contacts Context ---
const EmergencyContactsContext = React.createContext();

const useEmergencyContacts = () => {
  const context = React.useContext(EmergencyContactsContext);
  if (!context) {
    throw new Error('useEmergencyContacts must be used within an EmergencyContactsProvider');
  }
  return context;
};

const EmergencyContactsProvider = ({ children }) => {
  const [contacts, setContacts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const STORAGE_KEY = '@emergency_contacts';

  React.useEffect(() => {
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

// --- Reusable Components ---
const AppHeader = ({ onMenuPress, title }) => (
  <View style={styles.appHeader}>
    <TouchableOpacity onPress={onMenuPress} style={styles.headerButton}>
      <MenuIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerSpacer} />
  </View>
);

const PageHeader = ({ title, onBack }) => (
  <View style={styles.appHeader}>
    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
      <Text style={styles.backButtonText}>‹</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerSpacer} />
  </View>
);

// --- Page Components ---
const PageContainer = ({ children }) => (
  <View style={styles.pageContainer}>{children}</View>
);

const HomePage = () => (
  <PageContainer>
    <Text style={styles.homeTitle}>Welcome to Yours</Text>
    <Text style={styles.homeSubtitle}>You are in a safe space.</Text>
  </PageContainer>
);

const JournalTemplateModal = ({ visible, onClose, onSelectTemplate }) => (
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

const IncidentReportForm = ({ visible, entry, onClose, onSave }) => {
  const { people, locations, addPerson, addLocation } = useAutofill();
  const [incidentDate, setIncidentDate] = React.useState(new Date());
  const [personName, setPersonName] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [incidentType, setIncidentType] = React.useState('');
  const [severity, setSeverity] = React.useState('regular');
  const [description, setDescription] = React.useState('');

  const [nameSuggestions, setNameSuggestions] = React.useState([]);
  const [locationSuggestions, setLocationSuggestions] = React.useState([]);

  const incidentTypes = [
    'Physical altercation', 'Verbal conflict', 'Bullying or harassment',
    'Vandalism', 'Safety violation', 'Other'
  ];
  const severityLevels = {
    danger: { color: '#FECACA', name: 'Danger' }, // red-200
    warning: { color: '#FEF08A', name: 'Warning' }, // yellow-200
    suspicious: { color: '#E5E7EB', name: 'Suspicious' }, // gray-200
    regular: { color: 'white', name: 'Regular Note' },
  };

  React.useEffect(() => {
    if (entry) {
      setIncidentDate(new Date(entry.date));
      setPersonName(entry.personName || '');
      setRelationship(entry.relationship || '');
      setLocation(entry.location || '');
      setIncidentType(entry.incidentType || '');
      setSeverity(entry.severity || 'regular');
      setDescription(entry.description || '');
    } else {
      // Reset form
      setIncidentDate(new Date());
      setPersonName('');
      setRelationship('');
      setLocation('');
      setIncidentType('');
      setSeverity('regular');
      setDescription('');
    }
  }, [entry, visible]);
  
  const handleNameChange = (text) => {
    setPersonName(text);
    if (text.length > 1) {
      const filtered = people.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));
      setNameSuggestions(filtered);
    } else {
      setNameSuggestions([]);
    }
  };
  
  const handleLocationChange = (text) => {
      setLocation(text);
      if (text.length > 1) {
          const filtered = locations.filter(l => l.toLowerCase().includes(text.toLowerCase()));
          setLocationSuggestions(filtered)
      } else {
          setLocationSuggestions([]);
      }
  }

  const handleSave = () => {
    if (!personName.trim() || !incidentType) {
      Alert.alert('Required Fields', 'Please fill in the person\'s name and the type of incident.');
      return;
    }
    const reportData = {
      title: `Incident with ${personName}`,
      date: incidentDate.toISOString(),
      personName: personName.trim(),
      relationship: relationship.trim(),
      location: location.trim(),
      incidentType,
      severity,
      description: description.trim(),
      isIncidentReport: true,
    };
    onSave(reportData);
    // Add to autofill
    addPerson({ name: reportData.personName, relationship: reportData.relationship });
    addLocation(reportData.location);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <ScrollView style={{width: '100%'}} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1}}>
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>
              {entry ? 'Edit Incident Report' : 'New Incident Report'}
            </Text>

            <Text style={styles.label}>Date of Incident</Text>
            {/* Basic text input for date for simplicity. A date picker would be better in a real app */}
            <TextInput
              style={styles.input}
              value={incidentDate.toLocaleDateString()}
              onChangeText={(text) => setIncidentDate(new Date(text))}
              placeholder="MM/DD/YYYY"
            />

            <Text style={styles.label}>Full Name of Person</Text>
            <TextInput style={styles.input} placeholder="e.g., John Doe" value={personName} onChangeText={handleNameChange} />
             {nameSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {nameSuggestions.map((p, i) => (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => {
                            setPersonName(p.name);
                            if(p.relationships.length > 0) setRelationship(p.relationships[0])
                            setNameSuggestions([]);
                        }}>
                           <Text>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Relationship to Person</Text>
            <TextInput style={styles.input} placeholder="e.g., Neighbor, Colleague" value={relationship} onChangeText={setRelationship} />

            <Text style={styles.label}>Location of Incident</Text>
            <TextInput style={styles.input} placeholder="e.g., 123 Main St, Anytown" value={location} onChangeText={handleLocationChange} />
            {locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {locationSuggestions.map((l, i) => (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => {
                            setLocation(l);
                            setLocationSuggestions([]);
                        }}>
                           <Text>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Type of Incident</Text>
            <View style={styles.pickerContainer}>
                {incidentTypes.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.pickerButton, incidentType === type && styles.pickerButtonSelected]}
                        onPress={() => setIncidentType(type)}
                    >
                        <Text style={styles.pickerButtonText}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Severity Level</Text>
             <View style={styles.pickerContainer}>
                {Object.keys(severityLevels).map(level => (
                    <TouchableOpacity
                        key={level}
                        style={[
                          styles.pickerButton,
                          { backgroundColor: severityLevels[level].color, borderWidth: 1, borderColor: '#D1D5DB' },
                          severity === level && styles.pickerButtonSelected
                        ]}
                        onPress={() => setSeverity(level)}
                    >
                        <Text style={styles.pickerButtonText}>{severityLevels[level].name}</Text>
                    </TouchableOpacity>
                ))}
            </View>


            <Text style={styles.label}>Description of Incident</Text>
            <TextInput
              style={[styles.input, { height: 150, textAlignVertical: 'top' }]}
              placeholder="Describe what happened..."
              value={description}
              onChangeText={setDescription}
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
        </ScrollView>
      </View>
    </Modal>
  );
};


const JournalEntryForm = ({ visible, entry, onClose, onSave, templateData }) => {
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
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
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <TextInput
            style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
            placeholder="Add notes..."
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

const JournalPage = ({ onBack }) => {
  const { entries, isLoading, addEntry, updateEntry, deleteEntry } = useJournal();
  const [formVisible, setFormVisible] = React.useState(false);
  const [incidentFormVisible, setIncidentFormVisible] = React.useState(false);
  const [templateModalVisible, setTemplateModalVisible] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState(null);
  const [templateData, setTemplateData] = React.useState(null);

  const groupedEntries = React.useMemo(() => {
    if (isLoading || entries.length === 0) return [];
    
    const groups = entries.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});

    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date]
    }));
  }, [entries, isLoading]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setTemplateData(null);
    setTemplateModalVisible(true);
  };

  const handleSelectTemplate = (templateType) => {
    setTemplateModalVisible(false);

    if (templateType === 'incident') {
      setEditingEntry(null);
      setIncidentFormVisible(true);
      return;
    }

    let data = { title: '', notes: '' };
    switch (templateType) {
      case 'journey':
        data = {
          title: 'Journey Log',
          notes: 'From: [Point A]\nTo: [Point B]\n\nNotes:\n',
        };
        break;
      case 'meeting':
        data = {
          title: 'Meeting Log',
          notes: 'Met with: [Person\'s Name]\nLocation: [Location]\n\nNotes:\n',
        };
        break;
      case 'interaction':
        data = {
          title: 'Interaction Log',
          notes: 'Interaction with: [Person\'s Name]\nOutcome: [Good/Mild/Bad]\n\nNotes:\n',
        };
        break;
      default: // blank
        break;
    }
    setTemplateData(data);
    setFormVisible(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    if (entry.isIncidentReport) {
      setIncidentFormVisible(true);
    } else {
      setTemplateData(null);
      setFormVisible(true);
    }
  };

  const handleSaveEntry = async (entryData) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, entryData);
      } else {
        await addEntry(entryData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save the journal entry.');
    } finally {
        setFormVisible(false);
        setIncidentFormVisible(false);
    }
  };

  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };
  
  const getSeverityColor = (severity) => {
      const colors = {
        danger: '#FECACA',
        warning: '#FEF08A',
        suspicious: '#E5E7EB',
        regular: 'white'
      };
      return colors[severity] || 'white';
  }

  if (isLoading) {
    return (
      <View style={styles.fullPage}>
        <PageHeader title="My Journal" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <Text>Loading journal...</Text>
        </View>
      </View>
    );
  }

  const renderJournalItem = ({ item }) => (
      <View style={[styles.journalItem, {backgroundColor: getSeverityColor(item.severity)}]}>
        <View style={styles.journalItemContent}>
          <Text style={styles.journalItemTitle}>{item.title}</Text>
          <Text style={styles.journalItemDate}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
           {item.isIncidentReport ? (
              <>
                <Text style={styles.incidentDetail}><Text style={{fontWeight: 'bold'}}>Person: </Text>{item.personName} ({item.relationship})</Text>
                <Text style={styles.incidentDetail}><Text style={{fontWeight: 'bold'}}>Location: </Text>{item.location}</Text>
                <Text style={styles.incidentDetail}><Text style={{fontWeight: 'bold'}}>Incident: </Text>{item.incidentType}</Text>
                <Text style={styles.journalItemNotes} numberOfLines={3}>{item.description}</Text>
              </>
           ) : (
              <Text style={styles.journalItemNotes} numberOfLines={3}>{item.notes}</Text>
           )}

        </View>
        <View style={styles.journalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditEntry(item)}
          >
            <EditIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteEntry(item)}
          >
            <DeleteIcon />
          </TouchableOpacity>
        </View>
      </View>
  )

  return (
    <View style={styles.fullPage}>
      <PageHeader title="My Journal" onBack={onBack} />

      <View style={styles.journalContainer}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <JournalIcon color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Your journal is empty</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first entry to log incidents and keep a timeline of events.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={groupedEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderJournalItem}
            renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity style={styles.floatingActionButton} onPress={handleAddEntry}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <JournalTemplateModal
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <JournalEntryForm
        visible={formVisible}
        entry={editingEntry}
        templateData={templateData}
        onClose={() => setFormVisible(false)}
        onSave={handleSaveEntry}
      />

      <IncidentReportForm
        visible={incidentFormVisible}
        entry={editingEntry}
        onClose={() => setIncidentFormVisible(false)}
        onSave={handleSaveEntry}
      />
    </View>
  );
};


const PanicPage = ({ onBack }) => {
  const { contacts } = useEmergencyContacts();
  const pressTimeout = React.useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulseAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );
  const handlePressIn = () => {
    pulseAnimation.start();
    pressTimeout.current = setTimeout(() => {
      triggerPanicAlert();
    }, 3000); // 3 seconds
  };

  const handlePressOut = () => {
    pulseAnimation.stop();
    scaleAnim.setValue(1);
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current);
    }
  };

  const triggerPanicAlert = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add emergency contacts in the settings to use the panic button.'
      );
      return;
    }

    // 1. Get Location
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied.');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 2. Prepare Message
      const message = `Emergency! I need help. My current location is: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const recipients = contacts.map(c => c.phone);

      // 3. Send SMS
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(recipients, message);
        console.log('SMS sending result:', result);
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
      }
    } catch (error) {
      console.error("Failed to get location or send alert:", error);
      Alert.alert('Error', 'Could not get your location or send SMS. Please try again.');
    }
  };

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Panic Mode" onBack={onBack} />
      <PageContainer>
        <Text style={styles.panicText}>In case of emergency, press and hold for 3 seconds.</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.sosButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.panicSubtext}>This will alert your emergency contacts and share your location.</Text>
      </PageContainer>
    </View>
  );
};

const TimerPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Safety Timer" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>Set a timer for your safety. We'll check on you.</Text>
    </PageContainer>
  </View>
);

const SettingsPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Settings" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>App settings and options will be here.</Text>
    </PageContainer>
  </View>
);

const ContactFormModal = ({ visible, contact, onClose, onSave }) => {
  const [name, setName] = React.useState(contact?.name || '');
  const [phone, setPhone] = React.useState(contact?.phone || '');
  const [relationship, setRelationship] = React.useState(contact?.relationship || '');

  React.useEffect(() => {
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
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <TextInput
            style={styles.input}
            placeholder="Relationship (optional)"
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

const ContactImportModal = ({ visible, onClose }) => {
  const [availableContacts, setAvailableContacts] = React.useState([]);
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { addContact, importFromDevice } = useEmergencyContacts();

  React.useEffect(() => {
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

const ContactsPage = ({ onBack }) => {
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useEmergencyContacts();
  const [formVisible, setFormVisible] = React.useState(false);
  const [importVisible, setImportVisible] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState(null);

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

const SideMenu = ({ isOpen, onClose, onNavigate }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isOpen}
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.sideMenu}>
            <TouchableOpacity onPress={onClose} style={styles.sideMenuCloseButton}>
                <CloseIcon />
            </TouchableOpacity>
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: "https://placehold.co/100x100/F8C8DC/333333?text=User" }}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>Jessica Jones</Text>
            </View>
            <View style={styles.sideMenuNav}>
                <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('Contacts')}>
                    <ContactIcon color="#374151" />
                    <Text style={styles.sideMenuLinkText}>Emergency Contacts</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Pressable>
  </Modal>
);

// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = React.useState('Home');
  const [isMenuOpen, setMenuOpen] = React.useState(false);

  const renderPage = () => {
    const goHome = () => setCurrentPage('Home');

    switch (currentPage) {
      case 'Journal': return <JournalPage onBack={goHome} />;
      case 'Panic': return <PanicPage onBack={goHome} />;
      case 'Timer': return <TimerPage onBack={goHome} />;
      case 'Settings': return <SettingsPage onBack={goHome} />;
      case 'Contacts': return <ContactsPage onBack={goHome} />;
      default: return <HomePage />;
    }
  };

  const handleMenuNavigation = (page) => {
    setMenuOpen(false);
    // In React Native, navigation is usually more instant
    setCurrentPage(page);
  };

  return (
    <AutofillProvider>
        <EmergencyContactsProvider>
          <JournalProvider>
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
              {currentPage === 'Home' && <AppHeader onMenuPress={() => setMenuOpen(true)} title="Yours" />}

              <View style={styles.contentArea}>
                {renderPage()}
              </View>

              {currentPage === 'Home' && (
                <View style={styles.bottomNav}>
                  <TouchableOpacity style={styles.navButton} onPress={() => setCurrentPage('Journal')}>
                    <JournalIcon />
                    <Text style={styles.navButtonText}>Journal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton} onPress={() => setCurrentPage('Panic')}>
                    <AlertIcon />
                    <Text style={styles.navButtonText}>Panic</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton} onPress={() => setCurrentPage('Timer')}>
                    <TimerIcon />
                    <Text style={styles.navButtonText}>Timer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navButton} onPress={() => setCurrentPage('Settings')}>
                    <SettingsIcon />
                    <Text style={styles.navButtonText}>Settings</Text>
                  </TouchableOpacity>
                </View>
              )}

              <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} onNavigate={handleMenuNavigation}/>
            </SafeAreaView>
          </JournalProvider>
        </EmergencyContactsProvider>
    </AutofillProvider>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8', // Equivalent to body background-color
  },
  contentArea: {
    flex: 1,
  },
  fullPage: {
    flex: 1,
  },
  // Headers
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E6', // pink-100
    backgroundColor: '#FEF2F2', // rose-50
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
  },
  headerButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  backButtonText: {
    fontSize: 30,
    color: '#4B5563', // gray-600
    lineHeight: 32,
  },
  // Page Styles
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    textAlign: 'center',
  },
  pageText: {
    fontSize: 16,
    color: '#6B7280', // gray-500
  },
  homeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
    marginBottom: 8,
  },
  homeSubtitle: {
    fontSize: 18,
    color: '#4B5563', // gray-600
  },
  // Panic Page
  panicText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EF4444', // red-500
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosButtonText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  panicSubtext: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  // FAB
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
  // Bottom Navigation
  bottomNav: {
    height: 80,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6', // pink-100
    backgroundColor: 'white',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    marginTop: 4,
  },
  // Side Menu
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75%',
    maxWidth: 300,
    backgroundColor: 'white',
    padding: 20,
    elevation: 10,
  },
  sideMenuCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
  },
  profileContainer: {
    marginTop: 64,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sideMenuNav: {
    marginTop: 20,
  },
  sideMenuLink: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideMenuLinkText: {
    textAlign: 'left',
    fontSize: 18,
    color: '#374151',
    marginLeft: 16,
  },
    // Contacts Page
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
    // Modal & Form Styles
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
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 6,
  },
  pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 8,
      marginBottom: 16,
  },
  pickerButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      alignItems: 'center',
  },
  pickerButtonSelected: {
      borderColor: '#F472B6',
      borderWidth: 2,
  },
  pickerButtonText: {
      fontSize: 14,
      color: '#374151'
  },
  suggestionsContainer: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      marginTop: -12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB'
  },
  suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB'
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
  disabledButton: {
    backgroundColor: '#FBCFE8',
  },

  // Import Modal
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Journal Page
  journalContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
      backgroundColor: '#FFF8F8',
      paddingTop: 16,
      paddingBottom: 8,
  },
  journalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journalItemContent: {
    flex: 1,
  },
  journalItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  journalItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  journalItemNotes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  },
  incidentDetail: {
      fontSize: 14,
      color: '#4B5563',
      marginBottom: 2,
  },
  journalActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  // Template Modal
  templateModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 10,
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
});