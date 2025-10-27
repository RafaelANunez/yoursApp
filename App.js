import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
// NavigationContainer is the root wrapper for navigation, manages nav state and linking
import { NavigationContainer } from '@react-navigation/native';
// Stack navigator provides screens that slide in from the side, with history
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VolumeManager } from 'react-native-volume-manager';

import { AppHeader } from './components/AppHeader';
import { SideMenu } from './components/SideMenu';
import { JournalProvider } from './context/JournalContext';
import { EmergencyContactsProvider } from './context/EmergencyContactsContext';
import { AutofillProvider } from './context/AutofillContext';
import { JournalIcon, AlertIcon, TimerIcon, SettingsIcon } from './components/Icons';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
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

// Create the navigator - enables stack-based navigation (screens push/pop like a stack)
const Stack = createStackNavigator();

export default function App() {
  // Track which screen to show first (Login or Home based on auth state)
  const [initialRoute, setInitialRoute] = useState(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFakeCallActive, setFakeCallActive] = useState(false);
  const [showSudoku, setShowSudoku] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Fake Call Settings
  const [callerName, setCallerName] = useState('Tech Maniac');
  const [screenHoldEnabled, setScreenHoldEnabled] = useState(true);
  const [volumeHoldEnabled, setVolumeHoldEnabled] = useState(true);
  const [screenHoldDuration, setScreenHoldDuration] = useState(10);
  const [volumeHoldDuration, setVolumeHoldDuration] = useState(5);

  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = useState(false);

  const twoFingerTimer = useRef(null);
  const initialTouchPositions = useRef([]);
  const touchCount = useRef(null);
  const volumeHoldTimeout = useRef(null);
  const lastVolume = useRef(null);
  const settingsRef = useRef({});

  // Determine initial route
  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('@logged_in');
      setInitialRoute(loggedIn ? 'Home' : 'Login');
    };
    checkLoginStatus();
  }, []);

  // Load settings
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [discreetMode, sudoku, twoFinger] = await Promise.all([
          AsyncStorage.getItem('@discreet_mode_enabled'),
          AsyncStorage.getItem('@sudoku_screen_enabled'),
          AsyncStorage.getItem('@two_finger_trigger_enabled'),
        ]);
        if (discreetMode === 'true' && sudoku === 'true') setShowSudoku(true);
        setTwoFingerTriggerEnabled(twoFinger === 'true');
        await loadFakeCallSettings();
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };

    const loadFakeCallSettings = async () => {
      const settings = await AsyncStorage.multiGet([
        '@fake_call_caller_name',
        '@fake_call_screen_hold_enabled',
        '@fake_call_volume_hold_enabled',
        '@fake_call_screen_hold_duration',
        '@fake_call_volume_hold_duration',
      ]);
      setCallerName(settings[0][1] || 'Tech Maniac');
      setScreenHoldEnabled(settings[1][1] === null ? true : settings[1][1] === 'true');
      setVolumeHoldEnabled(settings[2][1] === null ? true : settings[2][1] === 'true');
      setScreenHoldDuration(settings[3][1] ? parseInt(settings[3][1], 10) : 10);
      setVolumeHoldDuration(settings[4][1] ? parseInt(settings[4][1], 10) : 5);
    };

    loadAll();
  }, []);

  // Update volume listener ref
  useEffect(() => {
    settingsRef.current = { isFakeCallActive, volumeHoldEnabled, volumeHoldDuration };
  }, [isFakeCallActive, volumeHoldEnabled, volumeHoldDuration]);

  // Volume hold trigger
  useEffect(() => {
    VolumeManager.enable(true);
    const volumeListener = VolumeManager.addVolumeListener(result => {
      const { isFakeCallActive: active, volumeHoldEnabled: enabled, volumeHoldDuration: duration } =
        settingsRef.current;
      if (!enabled || active) return;

      const current = result.volume;
      const isVolumeUpPress =
        (lastVolume.current !== null && current > lastVolume.current) ||
        (current === 1.0 && lastVolume.current === 1.0);

      if (isVolumeUpPress) {
        if (!volumeHoldTimeout.current) {
          volumeHoldTimeout.current = setTimeout(() => {
            setFakeCallActive(true);
            clearTimeout(volumeHoldTimeout.current);
            volumeHoldTimeout.current = null;
          }, duration * 1000);
        }
      } else if (volumeHoldTimeout.current) {
        clearTimeout(volumeHoldTimeout.current);
        volumeHoldTimeout.current = null;
      }

      lastVolume.current = current;
    });

    return () => {
      volumeListener.remove();
      if (volumeHoldTimeout.current) clearTimeout(volumeHoldTimeout.current);
    };
  }, []);

  // --- Two-Finger Emergency Sudoku Trigger ---
  const onTouchStart = e => {
    if (!twoFingerTriggerEnabled || showSudoku) return;
    touchCount.current = e.nativeEvent.touches.length;
    if (touchCount.current === 2) {
      initialTouchPositions.current = e.nativeEvent.touches.map(t => ({
        x: t.pageX,
        y: t.pageY,
      }));
      twoFingerTimer.current = setTimeout(() => triggerEmergencySudoku(), 1000);
    }
  };

  const onTouchMove = e => {
    if (!twoFingerTriggerEnabled || !twoFingerTimer.current) return;
    const touches = e.nativeEvent.touches;
    if (touches.length !== 2) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
      return;
    }
    let maxMove = 0;
    for (let i = 0; i < 2; i++) {
      const dx = touches[i].pageX - initialTouchPositions.current[i].x;
      const dy = touches[i].pageY - initialTouchPositions.current[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      maxMove = Math.max(maxMove, dist);
    }
    if (maxMove > 30) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const onTouchEnd = () => {
    if (twoFingerTimer.current) {
      clearTimeout(twoFingerTimer.current);
      twoFingerTimer.current = null;
    }
  };

  const triggerEmergencySudoku = () => {
    setIsEmergencyMode(true);
    setShowSudoku(true);
  };

  if (!initialRoute) return null;

  return (
    <AutofillProvider>
      <EmergencyContactsProvider>
        <JournalProvider>
          <NavigationContainer>
            <View
              style={styles.touchContainer}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Stack.Navigator manages the navigation stack. screenOptions apply to all screens */}
              {/* NAVIGATION ISSUE: headerShown: false removes back button from all screens */}
              {/* FIX: Configure headers per-screen instead of hiding all headers */}
              <Stack.Navigator 
                initialRouteName={initialRoute} 
                screenOptions={{
                  headerShown: true,  // Show headers by default
                  headerStyle: {
                    backgroundColor: '#FEF2F2',  // Match app theme
                  },
                  headerTintColor: '#000000ff',  // Match text theme
                }}>
                {/* Auth Flow Screens - No headers needed */}
                <Stack.Screen name="Login" options={{ headerShown: false }} component={LoginScreen} />
                <Stack.Screen name="Signup" options={{ headerShown: false }} component={SignupScreen} />

                {/* Main App Screen (Home) - Uses a function to access navigation props */}
                <Stack.Screen name="Home">
                  {props => (
                    <SafeAreaView style={styles.container}>
                      <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                      {/* remove full AppHeader (visual header bar) and use a small floating menu button instead
                          This removes the top header while keeping the SideMenu reachable via the button */}
                      {!isFakeCallActive && !showSudoku && (
                        // Floating hamburger menu button — still inside SafeAreaView so it won't overlap notch
                        <TouchableOpacity
                          onPress={() => setMenuOpen(true)}       // open side menu
                          style={styles.menuButton}
                          accessibilityLabel="Open menu"
                        >
                          <View style={styles.hamburgerLine} />
                          <View style={styles.hamburgerLine} />
                          <View style={styles.hamburgerLine} />
                        </TouchableOpacity>
                      )}
                      <View style={styles.contentArea}>
                        {isFakeCallActive ? (
                          <FakeCallScreen
                            onEndCall={() => setFakeCallActive(false)}
                            callerName={callerName}
                          />
                        ) : showSudoku ? (
                          <SudokuScreen
                            onBypassSuccess={() => setShowSudoku(false)}
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
                      {/* Bottom tab navigation using Stack navigator's navigate */}
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

                      {/* Side menu navigation - close menu then navigate */}
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

                {/* Main App Screens - Each is a route in the stack */}
                <Stack.Screen name="Journal" component={JournalPage} options={{ title: 'My Journal' }} />
                <Stack.Screen name="Panic" component={PanicPage} options={{ title: 'Emergency', headerTitleStyle: { color: '#C70039'} }} />
                <Stack.Screen name="Timer" component={TimerPage} options={{ title: 'Safety Timer' }}/>
                <Stack.Screen name="Settings" component={SettingsPage}/>
                {/* Settings Sub-Screens - Each needs a header for back navigation */}
                <Stack.Screen name="Contacts" 
                  component={ContactsPage}
                  options={{ title: 'Emergency Contacts' }}
                />
                <Stack.Screen 
                  name="FakeCallSettings" 
                  component={FakeCallSettingsPage}
                  options={{ title: 'Fake Call Settings' }}
                />
                <Stack.Screen 
                  name="BackupAndRestore" 
                  component={BackupAndRestorePage}
                  options={{ title: 'Backup & Restore' }}
                />
                <Stack.Screen 
                  name="DiscreetMode" 
                  component={DiscreetModeSettingsPage}
                  options={{ title: 'Discreet Mode' }}
                />
              </Stack.Navigator>
            </View>
          </NavigationContainer>
        </JournalProvider>
      </EmergencyContactsProvider>
    </AutofillProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F8' },
  touchContainer: { flex: 1 },
  contentArea: { flex: 1 },
  bottomNav: {
    height: 80,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6',
    backgroundColor: 'white',
  },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { fontSize: 12, color: '#4B5563', marginTop: 4 },
  
  menuButton: {position: 'absolute',
    top: 12,       // small offset from top of SafeAreaView
    left: 12,
    zIndex: 50,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  hamburgerLine: {
    height: 2,
    width: 24,
    backgroundColor: '#4B5563',
    marginVertical: 2,
    borderRadius: 1,
  },
});
