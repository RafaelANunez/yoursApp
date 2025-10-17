import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import LocationHistoryPage from './components/LocationHistoryPage';

// Journey Sharing V2 Components
import JourneySharingPageV2 from './components/JourneySharing/JourneySharingPageV2';
import TrackAFriendPage from './components/JourneySharing/TrackAFriendPage';
import TrackingDetailPage from './components/JourneySharing/TrackingDetailPage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background location task name
const LOCATION_TASK_NAME = 'journey-sharing-location-update';
const LOCATION_HISTORY_TASK_NAME = 'location-history-tracking';

// Import location history utilities
const { addLocationPing, getLocationSettings, autoDeleteOldHistory } = require('./utils/locationHistoryStorage');

// Define background location history tracking task
TaskManager.defineTask(LOCATION_HISTORY_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location History tracking error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];

      // Check if tracking is still enabled
      const settings = await getLocationSettings();
      if (!settings.enabled) {
        // Stop tracking if disabled
        await Location.stopLocationUpdatesAsync(LOCATION_HISTORY_TASK_NAME);
        return;
      }

      // Add location ping
      await addLocationPing(location.coords.latitude, location.coords.longitude);

      // Run auto-delete check periodically (every 10 pings)
      if (Math.random() < 0.1) {
        await autoDeleteOldHistory();
      }
    }
  }
});

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

const EyeOffIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M1 1L23 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const MapPinIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HistoryIcon = ({ color = '#555' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 8V12L15 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.05 11C3.5 6.5 7.35 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C8.64 21 5.68 19.21 4.15 16.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 16H7V12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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

const JournalPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="My Journal" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>Your journal entries will appear here.</Text>
      <TouchableOpacity style={styles.floatingActionButton}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </PageContainer>
  </View>
);

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

const DiscreetModeSettingsPage = ({ onBack }) => {
  const [discreetModeEnabled, setDiscreetModeEnabled] = React.useState(false);
  const [sudokuScreenEnabled, setSudokuScreenEnabled] = React.useState(false);
  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = React.useState(false);
  const [bypassCode, setBypassCode] = React.useState('');
  const [isSettingBypassCode, setIsSettingBypassCode] = React.useState(false);
  const [newBypassCode, setNewBypassCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const DISCREET_MODE_KEY = '@discreet_mode_enabled';
  const SUDOKU_SCREEN_KEY = '@sudoku_screen_enabled';
  const BYPASS_CODE_KEY = '@bypass_code';
  const TWO_FINGER_TRIGGER_KEY = '@two_finger_trigger_enabled';

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [discreet, sudoku, code, twoFinger] = await Promise.all([
        AsyncStorage.getItem(DISCREET_MODE_KEY),
        AsyncStorage.getItem(SUDOKU_SCREEN_KEY),
        AsyncStorage.getItem(BYPASS_CODE_KEY),
        AsyncStorage.getItem(TWO_FINGER_TRIGGER_KEY),
      ]);
      setDiscreetModeEnabled(discreet === 'true');
      setSudokuScreenEnabled(sudoku === 'true');
      setBypassCode(code || '');
      setTwoFingerTriggerEnabled(twoFinger === 'true');
    } catch (error) {
      console.error('Error loading discreet mode settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiscreetMode = async (value) => {
    try {
      await AsyncStorage.setItem(DISCREET_MODE_KEY, value.toString());
      setDiscreetModeEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update discreet mode setting.');
    }
  };

  const toggleSudokuScreen = async (value) => {
    if (value && !bypassCode) {
      Alert.alert('Bypass Code Required', 'Please set a bypass code first before enabling the sudoku screen.');
      return;
    }
    try {
      await AsyncStorage.setItem(SUDOKU_SCREEN_KEY, value.toString());
      setSudokuScreenEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update sudoku screen setting.');
    }
  };

  const toggleTwoFingerTrigger = async (value) => {
    if (value && !bypassCode) {
      Alert.alert('Bypass Code Required', 'Please set a bypass code first before enabling the two-finger trigger.');
      return;
    }
    try {
      await AsyncStorage.setItem(TWO_FINGER_TRIGGER_KEY, value.toString());
      setTwoFingerTriggerEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update two-finger trigger setting.');
    }
  };

  const validateBypassCode = (code) => {
    if (code.length < 4 || code.length > 9) {
      return false;
    }
    return /^[1-9]+$/.test(code);
  };

  const handleSaveBypassCode = async () => {
    if (!validateBypassCode(newBypassCode)) {
      Alert.alert(
        'Invalid Code',
        'Bypass code must be 4-9 digits long and contain only numbers 1-9.'
      );
      return;
    }
    try {
      const isFirstTime = !bypassCode;
      await AsyncStorage.setItem(BYPASS_CODE_KEY, newBypassCode);
      setBypassCode(newBypassCode);

      // Auto-enable two-finger trigger when bypass code is set for the first time
      if (isFirstTime) {
        await AsyncStorage.setItem(TWO_FINGER_TRIGGER_KEY, 'true');
        setTwoFingerTriggerEnabled(true);
      }

      setNewBypassCode('');
      setIsSettingBypassCode(false);

      if (isFirstTime) {
        Alert.alert(
          'Success',
          'Bypass code has been set successfully.\n\nTwo-finger emergency trigger has been automatically enabled. You can disable it in settings if needed.'
        );
      } else {
        Alert.alert('Success', 'Bypass code has been updated successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save bypass code.');
    }
  };

  const handleBypassCodeChange = (text) => {
    const filtered = text.replace(/[^1-9]/g, '');
    if (filtered.length <= 9) {
      setNewBypassCode(filtered);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.fullPage}>
        <PageHeader title="Discreet Mode" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Discreet Mode" onBack={onBack} />
      <ScrollView style={styles.settingsContainer}>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>General Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Discreet Mode</Text>
              <Text style={styles.settingDescription}>
                Activate privacy features to disguise the app
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, discreetModeEnabled && styles.toggleActive]}
              onPress={() => toggleDiscreetMode(!discreetModeEnabled)}
            >
              <View style={[styles.toggleCircle, discreetModeEnabled && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Bypass Code</Text>

          {bypassCode ? (
            <View style={styles.bypassCodeDisplay}>
              <View style={styles.bypassCodeInfo}>
                <Text style={styles.settingLabel}>Current Code</Text>
                <Text style={styles.bypassCodeText}>{bypassCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeCodeButton}
                onPress={() => setIsSettingBypassCode(true)}
              >
                <Text style={styles.changeCodeButtonText}>Change Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noBypassCodeContainer}>
              <Text style={styles.noBypassCodeText}>
                Set a bypass code to enable sudoku screen
              </Text>
              <TouchableOpacity
                style={styles.setCodeButton}
                onPress={() => setIsSettingBypassCode(true)}
              >
                <Text style={styles.setCodeButtonText}>Set Bypass Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Sudoku Screen</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, !bypassCode && styles.disabledText]}>
                Show Sudoku Screen on Open
              </Text>
              <Text style={[styles.settingDescription, !bypassCode && styles.disabledText]}>
                Display a fake sudoku game when app opens
              </Text>
              {!bypassCode && (
                <Text style={styles.warningText}>
                  Set a bypass code to enable this feature
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                sudokuScreenEnabled && styles.toggleActive,
                !bypassCode && styles.toggleDisabled
              ]}
              onPress={() => toggleSudokuScreen(!sudokuScreenEnabled)}
              disabled={!bypassCode}
            >
              <View style={[
                styles.toggleCircle,
                sudokuScreenEnabled && styles.toggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Emergency Trigger</Text>

          <View style={styles.emergencyInfoBox}>
            <Text style={styles.emergencyInfoIcon}>🚨</Text>
            <Text style={styles.emergencyInfoTitle}>TWO-FINGER EMERGENCY TRIGGER</Text>
            <Text style={styles.emergencyInfoText}>
              When enabled, hold two fingers on the screen for 1 second from anywhere in the app to instantly show the sudoku screen.{'\n\n'}
              The sudoku will appear partially filled to look like you were playing a game. You can disable this feature at any time using the toggle below.
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, !bypassCode && styles.disabledText]}>
                Enable Two-Finger Trigger
              </Text>
              <Text style={[styles.settingDescription, !bypassCode && styles.disabledText]}>
                Hold two fingers for 1 second to trigger sudoku
              </Text>
              {!bypassCode && (
                <Text style={styles.warningText}>
                  Set a bypass code to enable this feature
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                twoFingerTriggerEnabled && styles.toggleActive,
                !bypassCode && styles.toggleDisabled
              ]}
              onPress={() => toggleTwoFingerTrigger(!twoFingerTriggerEnabled)}
              disabled={!bypassCode}
            >
              <View style={[
                styles.toggleCircle,
                twoFingerTriggerEnabled && styles.toggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isSettingBypassCode} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.formModal}>
            <Text style={styles.formTitle}>
              {bypassCode ? 'Change Bypass Code' : 'Set Bypass Code'}
            </Text>
            <Text style={styles.bypassCodeInstructions}>
              Enter a 4-9 digit code using numbers 1-9.{'\n'}
              You'll enter this code in the first row of the sudoku to access the app.
            </Text>
            <TextInput
              style={styles.bypassCodeInput}
              placeholder="Enter code (e.g., 1234)"
              value={newBypassCode}
              onChangeText={handleBypassCodeChange}
              keyboardType="number-pad"
              maxLength={9}
              autoFocus
            />
            <Text style={styles.bypassCodeLength}>
              {newBypassCode.length} / 9 digits
            </Text>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsSettingBypassCode(false);
                  setNewBypassCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !validateBypassCode(newBypassCode) && styles.disabledButton
                ]}
                onPress={handleSaveBypassCode}
                disabled={!validateBypassCode(newBypassCode)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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

// --- Journey Sharing Page ---
const JourneySharingPage = ({ onBack }) => {
  const { contacts } = useEmergencyContacts();
  const [isJourneyActive, setIsJourneyActive] = React.useState(false);
  const [updateInterval, setUpdateInterval] = React.useState(5);
  const [autoStopTime, setAutoStopTime] = React.useState(null);
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [journeyStartTime, setJourneyStartTime] = React.useState(null);
  const [lastUpdateTime, setLastUpdateTime] = React.useState(null);
  const [updateHistory, setUpdateHistory] = React.useState([]);
  const [nextUpdateIn, setNextUpdateIn] = React.useState(null);
  const [userName, setUserName] = React.useState('User');
  const [pendingUpdate, setPendingUpdate] = React.useState(null);
  const [discreetMode, setDiscreetMode] = React.useState(false);

  const updateTimerRef = React.useRef(null);
  const countdownTimerRef = React.useRef(null);
  const autoStopCheckRef = React.useRef(null);
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  const JOURNEY_STATE_KEY = '@journey_sharing_state';
  const USER_NAME_KEY = '@user_name';
  const PENDING_UPDATE_KEY = '@pending_journey_update';
  const JOURNEY_NOTIFICATION_ID = 'journey-sharing-update';

  React.useEffect(() => {
    loadJourneyState();
    loadUserName();
    loadDiscreetMode();
    loadPendingUpdate();
    setupNotificationListeners();

    return () => {
      clearAllTimers();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isJourneyActive) {
      startUpdateTimer();
      startCountdownTimer();
      if (autoStopTime) {
        checkAutoStop();
      }
    } else {
      clearAllTimers();
    }
  }, [isJourneyActive, updateInterval, autoStopTime]);

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem(USER_NAME_KEY);
      if (name) setUserName(name);
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const loadDiscreetMode = async () => {
    try {
      const mode = await AsyncStorage.getItem('@discreet_mode_enabled');
      setDiscreetMode(mode === 'true');
    } catch (error) {
      console.error('Error loading discreet mode:', error);
    }
  };

  const loadPendingUpdate = async () => {
    try {
      const pending = await AsyncStorage.getItem(PENDING_UPDATE_KEY);
      if (pending) {
        setPendingUpdate(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Error loading pending update:', error);
    }
  };

  const savePendingUpdate = async (update) => {
    try {
      if (update) {
        await AsyncStorage.setItem(PENDING_UPDATE_KEY, JSON.stringify(update));
        setPendingUpdate(update);
      } else {
        await AsyncStorage.removeItem(PENDING_UPDATE_KEY);
        setPendingUpdate(null);
      }
    } catch (error) {
      console.error('Error saving pending update:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data;
      if (data.type === 'journey_update') {
        await handleSendPendingUpdate();
      } else if (data.type === 'journey_end') {
        await handleStopJourney(true);
      }
    });
  };

  const loadJourneyState = async () => {
    try {
      const state = await AsyncStorage.getItem(JOURNEY_STATE_KEY);
      if (state) {
        const parsed = JSON.parse(state);
        if (parsed.isActive) {
          setIsJourneyActive(true);
          setUpdateInterval(parsed.updateInterval);
          setAutoStopTime(parsed.autoStopTime);
          setSelectedContacts(parsed.selectedContacts);
          setJourneyStartTime(parsed.startTime);
          setLastUpdateTime(parsed.lastUpdateTime);
          setUpdateHistory(parsed.updateHistory || []);
        }
      }
    } catch (error) {
      console.error('Error loading journey state:', error);
    }
  };

  const saveJourneyState = async (state) => {
    try {
      await AsyncStorage.setItem(JOURNEY_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving journey state:', error);
    }
  };

  const clearJourneyState = async () => {
    try {
      await AsyncStorage.removeItem(JOURNEY_STATE_KEY);
    } catch (error) {
      console.error('Error clearing journey state:', error);
    }
  };

  const clearAllTimers = () => {
    if (updateTimerRef.current) clearInterval(updateTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoStopCheckRef.current) clearInterval(autoStopCheckRef.current);
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const getSelectedContactObjects = () => {
    return contacts.filter(c => selectedContacts.includes(c.id));
  };

  const sendLocationMessageDirectly = async (isInitial = false, isFinal = false) => {
    // This opens the messaging app directly (used for initial and end messages only)
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      let message = '';
      if (isInitial) {
        message = `Hi, ${userName} is sharing their journey with you for safety. They are NOT in trouble - this is just a precaution.\n\nYou'll receive location updates every ${updateInterval} minute${updateInterval > 1 ? 's' : ''}.\n\nStarting location (${timestamp}):\n${mapsLink}`;
      } else if (isFinal) {
        message = `Journey sharing has ended. ${userName} has arrived safely.`;
      } else {
        message = `Location update at ${timestamp}:\n${mapsLink}`;
      }

      const recipients = getSelectedContactObjects().map(c => c.phone);

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(recipients, message);

        const updateEntry = {
          timestamp: new Date().toISOString(),
          type: isInitial ? 'start' : isFinal ? 'end' : 'update',
          time: timestamp
        };

        setUpdateHistory(prev => [...prev, updateEntry]);
        setLastUpdateTime(new Date().toISOString());

        if (isJourneyActive && !isFinal) {
          await saveJourneyState({
            isActive: true,
            updateInterval,
            autoStopTime,
            selectedContacts,
            startTime: journeyStartTime,
            lastUpdateTime: new Date().toISOString(),
            updateHistory: [...updateHistory, updateEntry]
          });
        }

        return true;
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
        return false;
      }
    } catch (error) {
      console.error('Error sending location message:', error);
      Alert.alert('Error', 'Failed to send location message. Please try again.');
      return false;
    }
  };

  const scheduleUpdateNotification = async () => {
    // This is called by the timer to schedule a notification (not send SMS directly)
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const updateData = {
        latitude,
        longitude,
        mapsLink,
        timestamp,
        createdAt: new Date().toISOString()
      };

      // Save as pending update
      await savePendingUpdate(updateData);

      // Schedule notification
      const contactCount = getSelectedContactObjects().length;
      const notificationContent = {
        title: discreetMode ? 'Action Required' : '📍 Location Update Ready',
        body: discreetMode ? 'Tap to continue' : `Tap to send your location update to ${contactCount} contact${contactCount > 1 ? 's' : ''}`,
        data: { type: 'journey_update', updateData },
        sound: !discreetMode,
        priority: discreetMode ? 'low' : 'high',
      };

      await Notifications.scheduleNotificationAsync({
        identifier: JOURNEY_NOTIFICATION_ID,
        content: notificationContent,
        trigger: null, // Show immediately
      });

      console.log('Update notification scheduled');
    } catch (error) {
      console.error('Error scheduling update notification:', error);
    }
  };

  const handleSendPendingUpdate = async () => {
    // Called when user taps notification or "Send Update Now" button
    if (!pendingUpdate) {
      Alert.alert('No Pending Update', 'There is no pending location update to send.');
      return;
    }

    const { mapsLink, timestamp } = pendingUpdate;
    const message = `Location update at ${timestamp}:\n${mapsLink}`;
    const recipients = getSelectedContactObjects().map(c => c.phone);

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(recipients, message);

        const updateEntry = {
          timestamp: new Date().toISOString(),
          type: 'update',
          time: timestamp
        };

        setUpdateHistory(prev => [...prev, updateEntry]);
        setLastUpdateTime(new Date().toISOString());
        await savePendingUpdate(null); // Clear pending update

        if (isJourneyActive) {
          await saveJourneyState({
            isActive: true,
            updateInterval,
            autoStopTime,
            selectedContacts,
            startTime: journeyStartTime,
            lastUpdateTime: new Date().toISOString(),
            updateHistory: [...updateHistory, updateEntry]
          });
        }

        // Clear the notification
        await Notifications.dismissNotificationAsync(JOURNEY_NOTIFICATION_ID);

        Alert.alert('Update Sent', 'Location update has been sent successfully.');
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
      }
    } catch (error) {
      console.error('Error sending pending update:', error);
      Alert.alert('Error', 'Failed to send location update. Please try again.');
    }
  };

  const startUpdateTimer = () => {
    if (updateTimerRef.current) clearInterval(updateTimerRef.current);

    updateTimerRef.current = setInterval(() => {
      scheduleUpdateNotification(); // Changed to schedule notification instead
    }, updateInterval * 60 * 1000);
  };

  const startCountdownTimer = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      if (lastUpdateTime) {
        const lastUpdate = new Date(lastUpdateTime);
        const now = new Date();
        const nextUpdate = new Date(lastUpdate.getTime() + updateInterval * 60 * 1000);
        const diff = nextUpdate - now;

        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setNextUpdateIn(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setNextUpdateIn('Sending...');
        }
      }
    }, 1000);
  };

  const checkAutoStop = () => {
    if (autoStopCheckRef.current) clearInterval(autoStopCheckRef.current);

    autoStopCheckRef.current = setInterval(() => {
      if (autoStopTime) {
        const now = new Date();
        const [hours, minutes] = autoStopTime.split(':');
        const stopTime = new Date();
        stopTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (now >= stopTime) {
          handleStopJourney(true);
        }
      }
    }, 30000); // Check every 30 seconds
  };

  const handleStartJourney = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one emergency contact to share your journey with.');
      return;
    }

    // Check notification permission
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    if (notificationStatus !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Journey Sharing requires notification permission to alert you when it\'s time to send location updates. Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Check location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Journey Sharing needs location access to share your location. Please enable location permissions in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Request background location permission
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      Alert.alert(
        'Background Location Recommended',
        'For Journey Sharing to work when the app is in the background, please enable "Allow all the time" for location access in your device settings. You can continue without this, but you\'ll need to keep the app open.',
        [{ text: 'OK' }]
      );
    }

    const startTime = new Date().toISOString();
    setJourneyStartTime(startTime);
    setIsJourneyActive(true);
    setLastUpdateTime(startTime);
    setUpdateHistory([]);

    await saveJourneyState({
      isActive: true,
      updateInterval,
      autoStopTime,
      selectedContacts,
      startTime,
      lastUpdateTime: startTime,
      updateHistory: []
    });

    // Send initial message directly (not via notification)
    await sendLocationMessageDirectly(true, false);
  };

  const handleStopJourney = async (isAutoStop = false) => {
    clearAllTimers();

    // Clear all journey-related notifications
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Send end message directly
    await sendLocationMessageDirectly(false, true);

    setIsJourneyActive(false);
    setJourneyStartTime(null);
    setLastUpdateTime(null);
    setUpdateHistory([]);
    setNextUpdateIn(null);
    await savePendingUpdate(null); // Clear any pending updates

    await clearJourneyState();

    if (!isAutoStop) {
      Alert.alert('Journey Ended', 'Journey sharing has been stopped and your contacts have been notified.');
    } else {
      Alert.alert('Journey Auto-Stopped', 'Journey sharing has ended at the scheduled time.');
    }
  };

  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderInitialState = () => (
    <ScrollView style={styles.journeyContainer}>
      <View style={styles.journeySection}>
        <Text style={styles.journeyBlurb}>
          Journey Sharing allows you to automatically share your location with trusted contacts at regular intervals. Perfect for dates, walking alone, or any situation where you want someone to know where you are.{'\n\n'}
          Your contacts will receive location updates via text message at the interval you choose.
        </Text>
      </View>

      <View style={styles.journeySection}>
        <Text style={styles.journeySectionTitle}>Settings</Text>

        <View style={styles.journeySettingItem}>
          <Text style={styles.journeyLabel}>Send location updates every:</Text>
          <View style={styles.intervalButtons}>
            {[1, 5, 10, 15, 30].map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalButton,
                  updateInterval === interval && styles.intervalButtonActive
                ]}
                onPress={() => setUpdateInterval(interval)}
              >
                <Text style={[
                  styles.intervalButtonText,
                  updateInterval === interval && styles.intervalButtonTextActive
                ]}>
                  {interval}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.journeySettingItem}>
          <Text style={styles.journeyLabel}>Automatically stop at: (Optional)</Text>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Text style={styles.timePickerButtonText}>
              {autoStopTime ? formatTimeForDisplay(autoStopTime) : 'Tap to set time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <View style={styles.timePickerContainer}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH:MM (24-hour format)"
                value={autoStopTime || ''}
                onChangeText={(text) => {
                  if (text.match(/^[0-9:]*$/)) {
                    setAutoStopTime(text);
                  }
                }}
                maxLength={5}
              />
              <TouchableOpacity
                style={styles.clearTimeButton}
                onPress={() => {
                  setAutoStopTime(null);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.clearTimeButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.journeySettingItem}>
          <Text style={styles.journeyLabel}>Share with:</Text>
          {contacts.length === 0 ? (
            <Text style={styles.journeyWarning}>
              Please add at least one emergency contact in Settings before using Journey Sharing
            </Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={selectAllContacts}
              >
                <Text style={styles.selectAllButtonText}>
                  {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All Emergency Contacts'}
                </Text>
              </TouchableOpacity>

              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactCheckItem}
                  onPress={() => toggleContactSelection(contact.id)}
                >
                  <View style={styles.contactCheckInfo}>
                    <Text style={styles.contactCheckName}>{contact.name}</Text>
                    <Text style={styles.contactCheckPhone}>{contact.phone}</Text>
                  </View>
                  <View style={[
                    styles.contactCheckbox,
                    selectedContacts.includes(contact.id) && styles.contactCheckboxChecked
                  ]}>
                    {selectedContacts.includes(contact.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.batteryWarning}>
          <Text style={styles.batteryWarningIcon}>⚠️</Text>
          <Text style={styles.batteryWarningTitle}>Battery Usage Notice</Text>
          <Text style={styles.batteryWarningText}>
            Journey Sharing uses GPS continuously and will drain your battery faster than normal. You'll receive notifications when it's time to send updates - make sure notifications are enabled and not silenced. Keep your phone charged or bring a battery pack for longer journeys.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.startJourneyButton,
            (contacts.length === 0 || selectedContacts.length === 0) && styles.startJourneyButtonDisabled
          ]}
          onPress={handleStartJourney}
          disabled={contacts.length === 0 || selectedContacts.length === 0}
        >
          <Text style={styles.startJourneyButtonText}>Start Journey Sharing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderActiveState = () => (
    <ScrollView style={styles.journeyContainer}>
      <View style={styles.journeyActiveHeader}>
        <Text style={styles.journeyActiveIcon}>🟢</Text>
        <Text style={styles.journeyActiveTitle}>Journey Sharing Active</Text>
      </View>

      <View style={styles.journeySection}>
        <Text style={styles.journeySectionTitle}>Journey Information</Text>

        <View style={styles.journeyInfoItem}>
          <Text style={styles.journeyInfoLabel}>Update Interval:</Text>
          <Text style={styles.journeyInfoValue}>Every {updateInterval} minute{updateInterval > 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.journeyInfoItem}>
          <Text style={styles.journeyInfoLabel}>Sharing With:</Text>
          <View>
            {getSelectedContactObjects().map((contact) => (
              <Text key={contact.id} style={styles.journeyInfoValue}>• {contact.name}</Text>
            ))}
          </View>
        </View>

        <View style={styles.journeyInfoItem}>
          <Text style={styles.journeyInfoLabel}>Auto-Stop:</Text>
          <Text style={styles.journeyInfoValue}>
            {autoStopTime ? `Will stop at ${formatTimeForDisplay(autoStopTime)}` : 'Running until manually stopped'}
          </Text>
        </View>

        {nextUpdateIn && (
          <View style={styles.nextUpdateBox}>
            <Text style={styles.nextUpdateLabel}>Next update in:</Text>
            <Text style={styles.nextUpdateTime}>{nextUpdateIn}</Text>
          </View>
        )}

        {pendingUpdate && (
          <View style={styles.pendingUpdateBox}>
            <Text style={styles.pendingUpdateIcon}>⚠️</Text>
            <Text style={styles.pendingUpdateText}>
              Location update is ready to send!{'\n'}
              Tap the button below or check your notifications.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.sendNowButton}
          onPress={handleSendPendingUpdate}
        >
          <Text style={styles.sendNowButtonText}>📍 Send Update Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.journeySection}>
        <Text style={styles.journeySectionTitle}>Update History</Text>
        {updateHistory.length === 0 ? (
          <Text style={styles.journeyInfoValue}>No updates sent yet</Text>
        ) : (
          updateHistory.slice().reverse().map((entry, index) => (
            <View key={index} style={styles.historyEntry}>
              <Text style={styles.historyCheckmark}>✓</Text>
              <Text style={styles.historyText}>
                {entry.type === 'start' ? 'Journey started' : 'Update sent'} at {entry.time}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.stopJourneyButton}
        onPress={() => handleStopJourney(false)}
      >
        <Text style={styles.stopJourneyButtonText}>Stop Journey Sharing</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Journey Sharing" onBack={onBack} />
      {isJourneyActive ? renderActiveState() : renderInitialState()}
    </View>
  );
};

// --- Sudoku Puzzles Data ---
const SUDOKU_PUZZLES = [
  // Puzzle 1 (0 = empty cell)
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
  ],
  // Puzzle 2
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 0, 0],
    [9, 0, 0, 0, 0, 0, 7, 0, 0],
  ],
  // Puzzle 3
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 8, 5],
    [0, 0, 1, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 5, 0, 7, 0, 0, 0],
    [0, 0, 4, 0, 0, 0, 1, 0, 0],
    [0, 9, 0, 0, 0, 0, 0, 0, 0],
    [5, 0, 0, 0, 0, 0, 0, 7, 3],
    [0, 0, 2, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 9],
  ],
  // Puzzle 4
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 9, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 0],
    [5, 0, 7, 0, 0, 0, 0, 6, 0],
    [0, 4, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 5, 0, 0],
  ],
  // Puzzle 5
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 4, 0, 7],
    [0, 0, 0, 3, 0, 0, 2, 8, 0],
    [0, 6, 0, 5, 0, 0, 0, 0, 8],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
];

// --- YourSudoku Logo ---
const YourSudokuLogo = () => (
  <View style={styles.logoContainer}>
    <Text style={styles.logoText}>YOURSUDOKU</Text>
  </View>
);

// --- Sudoku Screen Component ---
const SudokuScreen = ({ onBypassSuccess, isEmergencyMode = false }) => {
  const [selectedPuzzle] = React.useState(() => {
    return SUDOKU_PUZZLES[Math.floor(Math.random() * SUDOKU_PUZZLES.length)];
  });
  const [grid, setGrid] = React.useState([]);
  const [originalGrid, setOriginalGrid] = React.useState([]);
  const [selectedCell, setSelectedCell] = React.useState(null);
  const [bypassCode, setBypassCode] = React.useState('');

  React.useEffect(() => {
    loadBypassCode();
    initializeGrid();
  }, []);

  const loadBypassCode = async () => {
    try {
      const code = await AsyncStorage.getItem('@bypass_code');
      setBypassCode(code || '');
    } catch (error) {
      console.error('Error loading bypass code:', error);
    }
  };

  const isValidPlacement = (grid, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  };

  const addRandomFilledCells = (baseGrid) => {
    const newGrid = baseGrid.map(row => [...row]);
    const emptyCells = [];

    // Find all empty cells (excluding first row for bypass code)
    for (let row = 1; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (newGrid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    // Shuffle empty cells
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }

    // Add 10-15 random valid numbers
    const targetCount = 10 + Math.floor(Math.random() * 6); // 10-15
    let addedCount = 0;

    for (const cell of emptyCells) {
      if (addedCount >= targetCount) break;

      // Try random numbers 1-9
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      for (const num of numbers) {
        if (isValidPlacement(newGrid, cell.row, cell.col, num)) {
          newGrid[cell.row][cell.col] = num;
          addedCount++;
          break;
        }
      }
    }

    return newGrid;
  };

  const initializeGrid = () => {
    let newGrid = selectedPuzzle.map(row => [...row]);

    // If emergency mode, add random filled cells
    if (isEmergencyMode) {
      newGrid = addRandomFilledCells(newGrid);
    }

    setGrid(newGrid);
    setOriginalGrid(newGrid.map(row => [...row]));
  };

  const handleCellPress = (row, col) => {
    if (originalGrid[row][col] === 0) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (number) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const newGrid = grid.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? number : c)) : [...r]
      );
      setGrid(newGrid);
      setSelectedCell(null);

      // Check bypass code if we're in the first row
      if (row === 0) {
        setTimeout(() => checkBypassCode(newGrid), 150);
      }
    }
  };

  const checkBypassCode = (currentGrid) => {
    if (!bypassCode) return;

    const firstRow = currentGrid[0];
    const codeLength = bypassCode.length;

    // Check only the first N cells where N = bypass code length
    const relevantCells = firstRow.slice(0, codeLength);
    const areRelevantCellsFilled = relevantCells.every(cell => cell !== 0);

    if (areRelevantCellsFilled) {
      const enteredCode = relevantCells.join('');
      if (enteredCode === bypassCode) {
        onBypassSuccess();
      }
    }
  };

  return (
    <View style={styles.sudokuContainer}>
      <View style={styles.sudokuContent}>
        <View style={styles.sudokuGrid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.sudokuRow}>
              {row.map((cell, colIndex) => {
                const isSelected =
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isOriginal = originalGrid[rowIndex][colIndex] !== 0;
                const isFirstRow = rowIndex === 0;
                const isThickRightBorder = (colIndex + 1) % 3 === 0 && colIndex < 8;
                const isThickBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.sudokuCell,
                      isFirstRow && styles.sudokuFirstRowCell,
                      isThickRightBorder && styles.sudokuCellThickRight,
                      isThickBottomBorder && styles.sudokuCellThickBottom,
                      isSelected && styles.sudokuCellSelected,
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    disabled={isOriginal}
                  >
                    <Text
                      style={[
                        styles.sudokuCellText,
                        isOriginal && styles.sudokuCellTextOriginal,
                        isFirstRow && styles.sudokuFirstRowText,
                      ]}
                    >
                      {cell !== 0 ? cell : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <YourSudokuLogo />

        {selectedCell && (
          <View style={styles.numberPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.numberButton}
                onPress={() => handleNumberInput(number)}
              >
                <Text style={styles.numberButtonText}>{number}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.numberButtonClear}
              onPress={() => handleNumberInput(0)}
            >
              <Text style={styles.numberButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
                <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('JourneySharing')}>
                    <MapPinIcon color="#374151" />
                    <Text style={styles.sideMenuLinkText}>Journey Sharing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('LocationHistory')}>
                    <HistoryIcon color="#374151" />
                    <Text style={styles.sideMenuLinkText}>Location History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('Contacts')}>
                    <ContactIcon color="#374151" />
                    <Text style={styles.sideMenuLinkText}>Emergency Contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('DiscreetMode')}>
                    <EyeOffIcon color="#374151" />
                    <Text style={styles.sideMenuLinkText}>Discreet Mode</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Pressable>
  </Modal>
);

// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = React.useState('Home');
  const [navigationParams, setNavigationParams] = React.useState(null);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [showSudoku, setShowSudoku] = React.useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = React.useState(true);
  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = React.useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = React.useState(false);
  const twoFingerTimer = useRef(null);
  const touchCount = useRef(0);
  const initialTouchPositions = useRef([]);

  React.useEffect(() => {
    checkDiscreetModeSettings();
  }, []);

  const checkDiscreetModeSettings = async () => {
    try {
      const [discreetMode, sudokuScreen, twoFinger] = await Promise.all([
        AsyncStorage.getItem('@discreet_mode_enabled'),
        AsyncStorage.getItem('@sudoku_screen_enabled'),
        AsyncStorage.getItem('@two_finger_trigger_enabled'),
      ]);

      if (discreetMode === 'true' && sudokuScreen === 'true') {
        setShowSudoku(true);
      }

      setTwoFingerTriggerEnabled(twoFinger === 'true');
    } catch (error) {
      console.error('Error checking discreet mode settings:', error);
    } finally {
      setIsCheckingSettings(false);
    }
  };

  const handleBypassSuccess = () => {
    setShowSudoku(false);
    setIsEmergencyMode(false);
  };

  const onTouchStart = (e) => {
    if (!twoFingerTriggerEnabled || showSudoku) return;

    touchCount.current = e.nativeEvent.touches.length;

    if (touchCount.current === 2) {
      // Store initial positions
      initialTouchPositions.current = e.nativeEvent.touches.map(touch => ({
        x: touch.pageX,
        y: touch.pageY,
      }));

      // Start timer for 1 second hold
      twoFingerTimer.current = setTimeout(() => {
        triggerEmergencySudoku();
      }, 1000);
    } else {
      // Cancel if not exactly 2 fingers
      if (twoFingerTimer.current) {
        clearTimeout(twoFingerTimer.current);
        twoFingerTimer.current = null;
      }
    }
  };

  const onTouchMove = (e) => {
    if (!twoFingerTriggerEnabled || !twoFingerTimer.current) return;

    // Check if fingers moved too much (more than 30px)
    const currentTouches = e.nativeEvent.touches;
    if (currentTouches.length !== 2) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
      return;
    }

    let maxMovement = 0;
    for (let i = 0; i < 2; i++) {
      if (initialTouchPositions.current[i]) {
        const dx = currentTouches[i].pageX - initialTouchPositions.current[i].x;
        const dy = currentTouches[i].pageY - initialTouchPositions.current[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        maxMovement = Math.max(maxMovement, distance);
      }
    }

    // Cancel if moved more than 30px
    if (maxMovement > 30) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const onTouchEnd = (e) => {
    if (!twoFingerTriggerEnabled) return;

    // Cancel timer if fingers lifted too early
    if (twoFingerTimer.current) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const triggerEmergencySudoku = () => {
    setIsEmergencyMode(true);
    setShowSudoku(true);
  };

  const renderPage = () => {
    const goHome = () => setCurrentPage('Home');
    const goBack = () => setCurrentPage('JourneySharing');

    const handleNavigate = (page, params = null) => {
      setCurrentPage(page);
      setNavigationParams(params);
    };

    switch (currentPage) {
      case 'Journal': return <JournalPage onBack={goHome} />;
      case 'Panic': return <PanicPage onBack={goHome} />;
      case 'Timer': return <TimerPage onBack={goHome} />;
      case 'Settings': return <SettingsPage onBack={goHome} />;
      case 'Contacts': return <ContactsPage onBack={goHome} />;
      case 'DiscreetMode': return <DiscreetModeSettingsPage onBack={goHome} />;
      case 'JourneySharing': return <JourneySharingPageV2 onBack={goHome} onNavigate={handleNavigate} />;
      case 'TrackAFriend': return <TrackAFriendPage onBack={goBack} onNavigate={handleNavigate} />;
      case 'TrackingDetail': return <TrackingDetailPage onBack={goBack} sessionId={navigationParams} />;
      case 'LocationHistory': return <LocationHistoryPage onBack={goHome} />;
      default: return <HomePage />;
    }
  };

  const handleMenuNavigation = (page) => {
    setMenuOpen(false);
    // In React Native, navigation is usually more instant
    setCurrentPage(page);
  };

  if (isCheckingSettings) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  if (showSudoku) {
    return <SudokuScreen onBypassSuccess={handleBypassSuccess} isEmergencyMode={isEmergencyMode} />;
  }

  return (
    <SafeAreaProvider>
      <EmergencyContactsProvider>
        <View
          style={styles.container}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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
        </View>
      </EmergencyContactsProvider>
    </SafeAreaProvider>
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
  // Discreet Mode Settings
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  settingsSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#F472B6',
  },
  toggleDisabled: {
    backgroundColor: '#E5E7EB',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  bypassCodeDisplay: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  bypassCodeInfo: {
    marginBottom: 12,
  },
  bypassCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 4,
    marginTop: 8,
  },
  changeCodeButton: {
    backgroundColor: '#F472B6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  changeCodeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noBypassCodeContainer: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    alignItems: 'center',
  },
  noBypassCodeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  setCodeButton: {
    backgroundColor: '#F472B6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  setCodeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bypassCodeInstructions: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  bypassCodeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 8,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  bypassCodeLength: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  emergencyInfoBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  emergencyInfoIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  emergencyInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  emergencyInfoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'left',
  },
  // Sudoku Screen
  sudokuContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  sudokuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sudokuGrid: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'white',
  },
  sudokuRow: {
    flexDirection: 'row',
  },
  sudokuCell: {
    width: 38,
    height: 38,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sudokuFirstRowCell: {
    backgroundColor: '#FEF2F2',
  },
  sudokuCellThickRight: {
    borderRightWidth: 2,
    borderRightColor: '#000',
  },
  sudokuCellThickBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  sudokuCellSelected: {
    backgroundColor: '#FBCFE8',
  },
  sudokuCellText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F472B6',
  },
  sudokuCellTextOriginal: {
    color: '#000',
    fontWeight: 'bold',
  },
  sudokuFirstRowText: {
    fontWeight: 'bold',
  },
  logoContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F472B6',
    letterSpacing: 2,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    width: '100%',
    maxWidth: 300,
  },
  numberButton: {
    width: 60,
    height: 60,
    backgroundColor: '#F472B6',
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  numberButtonClear: {
    width: 128,
    height: 60,
    backgroundColor: '#EF4444',
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  // Journey Sharing Styles
  journeyContainer: {
    flex: 1,
    padding: 20,
  },
  journeySection: {
    marginBottom: 24,
  },
  journeyBlurb: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'left',
  },
  journeySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  journeySettingItem: {
    marginBottom: 20,
  },
  journeyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  intervalButtonActive: {
    borderColor: '#F472B6',
    backgroundColor: '#FEF2F2',
  },
  intervalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  intervalButtonTextActive: {
    color: '#F472B6',
  },
  timePickerButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  timePickerContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  clearTimeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  clearTimeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  journeyWarning: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 8,
  },
  selectAllButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  contactCheckItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactCheckInfo: {
    flex: 1,
  },
  contactCheckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactCheckPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCheckboxChecked: {
    backgroundColor: '#F472B6',
    borderColor: '#F472B6',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  batteryWarning: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 20,
  },
  batteryWarningIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  batteryWarningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  batteryWarningText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  startJourneyButton: {
    backgroundColor: '#F472B6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startJourneyButtonDisabled: {
    backgroundColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  startJourneyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  journeyActiveHeader: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  journeyActiveIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  journeyActiveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
  },
  journeyInfoItem: {
    marginBottom: 16,
  },
  journeyInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  journeyInfoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  nextUpdateBox: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FBCFE8',
  },
  nextUpdateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  nextUpdateTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F472B6',
    letterSpacing: 2,
  },
  historyEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyCheckmark: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 12,
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
  },
  stopJourneyButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stopJourneyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  pendingUpdateBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginTop: 16,
    alignItems: 'center',
  },
  pendingUpdateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pendingUpdateText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
  sendNowButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendNowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});