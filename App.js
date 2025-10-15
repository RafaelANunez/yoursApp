import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { AppHeader } from './components/AppHeader';
import { SideMenu } from './components/SideMenu';
import { HomePage } from './screens/HomePage';
import { JournalPage } from './screens/JournalPage';
import { PanicPage } from './screens/PanicPage';
import { TimerPage } from './screens/TimerPage';
import { SettingsPage } from './screens/SettingsPage';
import { ContactsPage } from './screens/ContactsPage';
import { FakeCallScreen } from './screens/FakeCallScreen';
import DiscreetModeSettingsPage from './screens/DiscreetModeSettingsPage';
import SudokuScreen from './screens/SudokuScreen';
import { JournalProvider } from './context/JournalContext';
import { EmergencyContactsProvider } from './context/EmergencyContactsContext';
import { AutofillProvider } from './context/AutofillContext';
import { JournalIcon, AlertIcon, TimerIcon, SettingsIcon } from './components/icons';
import { VolumeManager } from 'react-native-volume-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FakeCallSettingsPage from './screens/FakeCallSettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFakeCallActive, setFakeCallActive] = useState(false);
  const [showSudoku, setShowSudoku] = useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);
  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const twoFingerTimer = useRef(null);
  const touchCount = useRef(null);
  const initialTouchPositions = useRef([]);
  const volumeHoldTimeout = useRef(null);
  const lastVolume = useRef(null);

  // --- Lifted State for Fake Call Settings ---
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


  // --- Load all settings on initial mount ---
  useEffect(() => {
    const loadAllSettings = async () => {
        try {
            await checkDiscreetModeSettings();
            await loadFakeCallSettings();
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setIsCheckingSettings(false);
        }
    };
    loadAllSettings();
  }, []);

  // --- Volume listener effect ---
  useEffect(() => {
    VolumeManager.enable(true);
    const volumeListener = VolumeManager.addVolumeListener((result) => {
      const {
        isFakeCallActive: isFakeCallActiveNow,
        volumeHoldEnabled: isVolumeHoldEnabledNow,
        volumeHoldDuration: currentVolumeHoldDuration,
      } = settingsRef.current;

      if (!isVolumeHoldEnabledNow || isFakeCallActiveNow) return;

      const currentVolume = result.volume;

      // *** THIS IS THE FIX ***
      // Condition to start the timer:
      // 1. Volume is actively increasing.
      // OR
      // 2. Volume is already at max (1.0) and an event is still being fired
      //    (implying the user is still holding the up button).
      const isVolumeUpPress = (lastVolume.current !== null && currentVolume > lastVolume.current) ||
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
        // Any other event (volume down, or the initial event) clears the timer.
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


  const loadFakeCallSettings = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading fake call settings:', error);
    }
  };


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

  const onTouchMove = (e) => {
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

  const onTouchEnd = (e) => {
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

  const renderPage = () => {
    const goHome = () => setCurrentPage('Home');
    if (isFakeCallActive) {
      return <FakeCallScreen onEndCall={() => setFakeCallActive(false)} callerName={callerName} />;
    }
    if (showSudoku) {
      return <SudokuScreen onBypassSuccess={handleBypassSuccess} isEmergencyMode={isEmergencyMode} />;
    }
    switch (currentPage) {
      case 'Journal': return <JournalPage onBack={goHome} />;
      case 'Panic': return <PanicPage onBack={goHome} />;
      case 'Timer': return <TimerPage onBack={goHome} />;
      case 'Settings': return <SettingsPage onBack={goHome} setCurrentPage={setCurrentPage} />;
      case 'Contacts': return <ContactsPage onBack={goHome} />;
      case 'DiscreetMode': return <DiscreetModeSettingsPage onBack={goHome} />;
      case 'FakeCallSettings':
          return (
            <FakeCallSettingsPage
              onBack={() => setCurrentPage('Settings')}
              // Pass current settings down to the page
              settings={{
                callerName,
                screenHoldEnabled,
                volumeHoldEnabled,
                screenHoldDuration,
                volumeHoldDuration,
              }}
              // Provide a callback to update the state in App.js
              onSave={(newSettings) => {
                setCallerName(newSettings.callerName);
                setScreenHoldEnabled(newSettings.screenHoldEnabled);
                setVolumeHoldEnabled(newSettings.volumeHoldEnabled);
                setScreenHoldDuration(newSettings.screenHoldDuration);
                setVolumeHoldDuration(newSettings.volumeHoldDuration);
              }}
            />
          );
      default: return (
        <HomePage
            onFakeCall={() => setFakeCallActive(true)}
            screenHoldEnabled={screenHoldEnabled}
            screenHoldDuration={screenHoldDuration}
        />
      );
    }
  };

  const handleMenuNavigation = (page) => {
    setMenuOpen(false);
    setCurrentPage(page);
  };

  if (isCheckingSettings) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AutofillProvider>
        <EmergencyContactsProvider>
          <JournalProvider>
            <View
              style={styles.container}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                {currentPage === 'Home' && !isFakeCallActive && !showSudoku && (
                  <AppHeader onMenuPress={() => setMenuOpen(true)} title="Yours" />
                )}
                <View style={styles.contentArea}>
                  {renderPage()}
                </View>
                {currentPage === 'Home' && !isFakeCallActive && !showSudoku && (
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
          </JournalProvider>
        </EmergencyContactsProvider>
    </AutofillProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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