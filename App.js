import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Alert, // Added for save function
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VolumeManager } from 'react-native-volume-manager';

import { AppHeader } from './components/AppHeader';
import { SideMenu } from './components/SideMenu';

// --- CONTEXT PROVIDERS ---
// Make sure AuthProvider is at the top
import { AuthProvider, useAuth } from './context/AuthContext';
import { JournalProvider } from './context/JournalContext';
import { EmergencyContactsProvider } from './context/EmergencyContactsContext';
import { AutofillProvider } from './context/AutofillContext';

import { JournalIcon, AlertIcon, TimerIcon, SettingsIcon } from './components/Icons';

// Login/Signup Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

// Core App Screens
import { HomePage } from './screens/HomePage';
import { JournalPage } from './screens/JournalPage';
import { PanicPage } from './screens/PanicPage';
import { TimerPage } from './screens/TimerPage';
import { SettingsPage } from './screens/SettingsPage';
import { ContactsPage } from './screens/ContactsPage';
import { FakeCallScreen } from './screens/FakeCallScreen';
import DiscreetModeSettingsPage from './screens/DiscreetModeSettingsPage';
import SudokuScreen from './screens/SudokuScreen';
import FakeCallSettingsPage from './screens/FakeCallSettingsPage';
import BackupAndRestorePage from './screens/BackupAndRestorePage';
import UserProfileSettingsPage from './screens/UserProfileSettingsPage'; // IMPORTED

// Journey Sharing Screens
import JourneySharingPageV2 from './components/JourneySharing/JourneySharingPageV2';
import TrackAFriendPage from './components/JourneySharing/TrackAFriendPage';
import TrackingDetailPage from './components/JourneySharing/TrackingDetailPage';
import LocationHistoryPage from './components/LocationHistoryPage';

const Stack = createStackNavigator();

// --- Main App Entry Point ---
// This component now just sets up the providers.
// The AuthProvider wraps everything that needs to know about login state.
export default function App() {
  return (
    // --- AuthProvider MUST wrap all other providers ---
    <AuthProvider>
      <AutofillProvider>
        <EmergencyContactsProvider>
          <JournalProvider>
            <AppContent />
          </JournalProvider>
        </EmergencyContactsProvider>
      </AutofillProvider>
    </AuthProvider>
  );
}

// --- New component to hold all logic that needs access to AuthContext ---
// This contains all the state, effects, and navigation logic from the original App.js
function AppContent() {
  // --- GET AUTH STATE ---
  const { user, isLoggedIn, isLoading } = useAuth();

  // --- App State ---
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFakeCallActive, setFakeCallActive] = useState(false);
  const [showSudoku, setShowSudoku] = useState(false);
  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const twoFingerTimer = useRef(null);
  const touchCount = useRef(null);
  const initialTouchPositions = useRef([]);
  const volumeHoldTimeout = useRef(null);
  const lastVolume = useRef(null);

  // --- Lifted State for Fake Call Settings (with defaults) ---
  const [callerName, setCallerName] = useState('Tech Maniac');
  const [screenHoldEnabled, setScreenHoldEnabled] = useState(true);
  const [volumeHoldEnabled, setVolumeHoldEnabled] = useState(true);
  const [screenHoldDuration, setScreenHoldDuration] = useState(10); // in seconds
  const [volumeHoldDuration, setVolumeHoldDuration] = useState(5); // in seconds

  // --- Refs to hold the latest state for the volume listener ---
  const settingsRef = useRef({
    isFakeCallActive,
    volumeHoldEnabled,
    volumeHoldDuration,
  });

  useEffect(() => {
    settingsRef.current = {
      isFakeCallActive,
      volumeHoldEnabled,
      volumeHoldDuration,
    };
  }, [isFakeCallActive, volumeHoldEnabled, volumeHoldDuration]);

  // --- MODIFIED: Load/Reset settings based on user login status ---
  useEffect(() => {
    if (user?.email) {
      // User is logged in, load their settings
      loadFakeCallSettings(user.email);
      checkDiscreetModeSettings(user.email);
    } else {
      // User is logged out, reset settings to default
      setCallerName('Tech Maniac');
      setScreenHoldEnabled(true);
      setVolumeHoldEnabled(true);
      setScreenHoldDuration(10);
      setVolumeHoldDuration(5);
      setShowSudoku(false); // Ensure Sudoku is off on logout
      setTwoFingerTriggerEnabled(false);
      setIsEmergencyMode(false);
    }
  }, [user]); // Re-run this effect when the user logs in or out

  // --- Volume listener effect (no change needed) ---
  useEffect(() => {
    VolumeManager.enable(true);
    const volumeListener = VolumeManager.addVolumeListener(result => {
      // ... (volume listener logic remains the same)
      const {
        isFakeCallActive: isFakeCallActiveNow,
        volumeHoldEnabled: isVolumeHoldEnabledNow,
        volumeHoldDuration: currentVolumeHoldDuration,
      } = settingsRef.current;

      if (!isVolumeHoldEnabledNow || isFakeCallActiveNow) return;

      const currentVolume = result.volume;

      const isVolumeUpPress =
        (lastVolume.current !== null && currentVolume > lastVolume.current) ||
        (currentVolume === 1.0 && lastVolume.current === 1.0);

      if (isVolumeUpPress) {
        if (!volumeHoldTimeout.current) {
          volumeHoldTimeout.current = setTimeout(() => {
            setFakeCallActive(() => true);
            clearTimeout(volumeHoldTimeout.current);
            volumeHoldTimeout.current = null;
          }, currentVolumeHoldDuration * 1000);
        }
      } else {
        if (volumeHoldTimeout.current) {
          clearTimeout(volumeHoldTimeout.current);
          volumeHoldTimeout.current = null;
        }
      }
      lastVolume.current = currentVolume;
    });

    return () => {
      volumeListener.remove();
      if (volumeHoldTimeout.current) {
        clearTimeout(volumeHoldTimeout.current);
      }
    };
  }, []); // Empty dependency array is correct here.

  // --- MODIFIED: Load functions now take user's email ---
  const loadFakeCallSettings = async (email) => {
    try {
      // Keys are now prefixed with the user's email
      const keys = [
        `@${email}_fake_call_caller_name`,
        `@${email}_fake_call_screen_hold_enabled`,
        `@${email}_fake_call_volume_hold_enabled`,
        `@${email}_fake_call_screen_hold_duration`,
        `@${email}_fake_call_volume_hold_duration`,
      ];
      const settings = await AsyncStorage.multiGet(keys);
      
      setCallerName(settings[0][1] || 'Tech Maniac');
      setScreenHoldEnabled(settings[1][1] === null ? true : settings[1][1] === 'true');
      setVolumeHoldEnabled(settings[2][1] === null ? true : settings[2][1] === 'true');
      setScreenHoldDuration(settings[3][1] ? parseInt(settings[3][1], 10) : 10);
      setVolumeHoldDuration(settings[4][1] ? parseInt(settings[4][1], 10) : 5);
    } catch (error) {
      console.error('Error loading fake call settings:', error);
    }
  };

  // --- MODIFIED: Load functions now take user's email ---
  // THIS FUNCTION CONTAINS THE LATEST FIX
  const checkDiscreetModeSettings = async (email) => {
    try {
      // Keys are now prefixed with the user's email
      const keys = [
        `@${email}_discreet_mode_enabled`,
        `@${email}_sudoku_screen_enabled`,
        `@${email}_two_finger_trigger_enabled`,
      ];
      const [discreetMode, sudokuScreen, twoFinger] = await Promise.all([
        AsyncStorage.getItem(keys[0]),
        AsyncStorage.getItem(keys[1]),
        AsyncStorage.getItem(keys[2]),
      ]);

      // --- START OF FIX ---
      // If both settings are enabled, show Sudoku
      if (discreetMode === 'true' && sudokuScreen === 'true') {
        setShowSudoku(true);
      } else {
        // ELSE, explicitly set it to false. This is what was missing.
        setShowSudoku(false); 
      }
      // --- END OF FIX ---

      setTwoFingerTriggerEnabled(twoFinger === 'true');
    } catch (error) {
      console.error('Error checking discreet mode settings:', error);
      // Failsafe: if settings fail to load, default to not showing Sudoku
      setShowSudoku(false);
    }
  };
  
  // --- ADDED: Save function to pass to FakeCallSettingsPage ---
  const onSaveFakeCallSettings = async (email, newSettings) => {
     try {
        // Save settings with user-specific keys
        await AsyncStorage.multiSet([
            [`@${email}_fake_call_caller_name`, newSettings.callerName],
            [`@${email}_fake_call_screen_hold_enabled`, String(newSettings.screenHoldEnabled)],
            [`@${email}_fake_call_volume_hold_enabled`, String(newSettings.volumeHoldEnabled)],
            [`@${email}_fake_call_screen_hold_duration`, String(newSettings.screenHoldDuration)],
            [`@${email}_fake_call_volume_hold_duration`, String(newSettings.volumeHoldDuration)],
        ]);
        // Update local state in App.js
        setCallerName(newSettings.callerName);
        setScreenHoldEnabled(newSettings.screenHoldEnabled);
        setVolumeHoldEnabled(newSettings.volumeHoldEnabled);
        setScreenHoldDuration(newSettings.screenHoldDuration);
        setVolumeHoldDuration(newSettings.volumeHoldDuration);
     } catch (error) {
        console.error("Failed to save fake call settings", error);
        Alert.alert('Error', 'Failed to save settings.');
     }
  };

  // --- (All other helper functions remain the same) ---
  const handleBypassSuccess = () => {
    setShowSudoku(false);
    setIsEmergencyMode(false);
  };

  const onTouchStart = e => {
    if (!twoFingerTriggerEnabled || showSudoku) return;
    touchCount.current = e.nativeEvent.touches.length;
    if (touchCount.current === 2) {
      initialTouchPositions.current = e.nativeEvent.touches.map(touch => ({
        x: touch.pageX,
        y: touch.pageY,
      }));
      twoFingerTimer.current = setTimeout(() => {
        triggerEmergencySudoku();
      }, 1000);
    } else {
      if (twoFingerTimer.current) {
        clearTimeout(twoFingerTimer.current);
        twoFingerTimer.current = null;
      }
    }
  };

  const onTouchMove = e => {
    if (!twoFingerTriggerEnabled || !twoFingerTimer.current) return;
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
    if (maxMovement > 30) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const onTouchEnd = e => {
    if (!twoFingerTriggerEnabled) return;
    if (twoFingerTimer.current) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const triggerEmergencySudoku = () => {
    setIsEmergencyMode(true);
    setShowSudoku(true);
  };

  // --- MODIFIED: Show loading screen while AuthContext is busy ---
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View
        style={styles.touchContainer}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* --- MODIFIED: Navigator logic --- */}
        <Stack.Navigator
          // Set the initial route based on login state
          initialRouteName={isLoggedIn ? 'Home' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          {isLoggedIn ? (
            // --- User is Logged IN: Show Main App Screens ---
            <>
              <Stack.Screen name="Home">
                {props => (
                  <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                    {!isFakeCallActive && !showSudoku && (
                      <AppHeader onMenuPress={() => setMenuOpen(true)} title="Yours" />
                    )}
                    <View style={styles.contentArea}>
                      {isFakeCallActive ? (
                        <FakeCallScreen
                          onEndCall={() => setFakeCallActive(false)}
                          callerName={callerName}
                        />
                      ) : showSudoku ? (
                        <SudokuScreen
                          onBypassSuccess={handleBypassSuccess}
                          isEmergencyMode={isEmergencyMode}
                        />
                      ) : (
                        <HomePage
                          {...props}
                          onFakeCall={() => setFakeCallActive(true)}
                          screenHoldEnabled={screenHoldEnabled}
                          screenHoldDuration={screenHoldDuration}
                          onNavigateToJournal={() => props.navigation.navigate('Journal')}
                        />
                      )}
                    </View>
                    
                    {/* --- THIS IS THE MENU THAT WAS HIDDEN --- */}
                    {!isFakeCallActive && !showSudoku && (
                      <View style={styles.bottomNav}>
                        <TouchableOpacity onPress={() => props.navigation.navigate('Journal')} style={styles.navButton}>
                          <JournalIcon />
                          <Text style={styles.navButtonText}>Journal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => props.navigation.navigate('Panic')} style={styles.navButton}>
                          <AlertIcon />
                          <Text style={styles.navButtonText}>Panic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => props.navigation.navigate('Timer')} style={styles.navButton}>
                          <TimerIcon />
                          <Text style={styles.navButtonText}>Timer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => props.navigation.navigate('Settings')} style={styles.navButton}>
                          <SettingsIcon />
                          <Text style={styles.navButtonText}>Settings</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <SideMenu
                      isOpen={isMenuOpen}
                      onClose={() => setMenuOpen(false)}
                      onNavigate={page => {
                        setMenuOpen(false);
                        props.navigation.navigate(page);
                      }}
                    />
                  </SafeAreaView>
                )}
              </Stack.Screen>

              {/* Core Screens */}
              <Stack.Screen name="Journal" component={JournalPage} />
              <Stack.Screen name="Panic" component={PanicPage} />
              <Stack.Screen name="Timer" component={TimerPage} />
              <Stack.Screen name="Settings" component={SettingsPage} />
              <Stack.Screen name="Contacts" component={ContactsPage} />
              
              {/* --- MODIFIED: FakeCallSettings screen --- */}
              <Stack.Screen name="FakeCallSettings">
                {props => (
                  <FakeCallSettingsPage
                    {...props} // This passes 'navigation'
                    // Pass current settings down
                    settings={{
                      callerName,
                      screenHoldEnabled,
                      volumeHoldEnabled,
                      screenHoldDuration,
                      volumeHoldDuration,
                    }}
                    // --- MODIFIED: Provide a callback to save settings ---
                    onSave={newSettings => {
                      if (user?.email) {
                        onSaveFakeCallSettings(user.email, newSettings);
                      }
                    }}
                  />
                )}
              </Stack.Screen>
              
              <Stack.Screen name="BackupAndRestore" component={BackupAndRestorePage} />
              <Stack.Screen name="DiscreetMode" component={DiscreetModeSettingsPage} />
              
              {/* --- ADDED: User Profile Screen --- */}
              <Stack.Screen name="UserProfileSettings" component={UserProfileSettingsPage} />

              {/* Journey Sharing Screens */}
              <Stack.Screen name="JourneySharing" component={JourneySharingPageV2} />
              <Stack.Screen name="TrackAFriend" component={TrackAFriendPage} />
              <Stack.Screen name="TrackingDetail" component={TrackingDetailPage} />
              <Stack.Screen name="LocationHistory" component={LocationHistoryPage} />
            </>
          ) : (
            // --- User is Logged OUT: Show Auth Screens ---
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchContainer: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    height: 80,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6',
    backgroundColor: 'white',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
});