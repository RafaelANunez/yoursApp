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

export default function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFakeCallActive, setFakeCallActive] = useState(false);
  const [showSudoku, setShowSudoku] = useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);
  const [twoFingerTriggerEnabled, setTwoFingerTriggerEnabled] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const twoFingerTimer = useRef(null);
  const touchCount = useRef(0);
  const initialTouchPositions = useRef([]);
  const volumeHoldTimeout = useRef(null);
  const lastVolume = useRef(null);

  useEffect(() => {
    checkDiscreetModeSettings();

    VolumeManager.enable(true);

    const volumeListener = VolumeManager.addVolumeListener((result) => {
      const currentVolume = result.volume;

      // Detect if volume went UP
      if (lastVolume.current !== null && currentVolume > lastVolume.current) {
        // This is a "press up" event. Start the timer.
        if (!volumeHoldTimeout.current) {
          volumeHoldTimeout.current = setTimeout(() => {
            if (!isFakeCallActive) {
              setFakeCallActive(true);
            }
            clearTimeout(volumeHoldTimeout.current);
            volumeHoldTimeout.current = null;
          }, 5000); // 5 seconds
        }
      } else {
        // If volume went down or stayed the same, it's a "release" event.
        if (volumeHoldTimeout.current) {
          clearTimeout(volumeHoldTimeout.current);
          volumeHoldTimeout.current = null;
        }
      }

      // Store the current volume for the next event
      lastVolume.current = currentVolume;
    });

    return () => {
      // Cleanup listener
      volumeListener.remove();
      if (volumeHoldTimeout.current) {
        clearTimeout(volumeHoldTimeout.current);
      }
    };
  }, [isFakeCallActive]);

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
      return <FakeCallScreen onEndCall={() => setFakeCallActive(false)} />;
    }

    if (showSudoku) {
      return <SudokuScreen onBypassSuccess={handleBypassSuccess} isEmergencyMode={isEmergencyMode} />;
    }

    switch (currentPage) {
      case 'Journal': return <JournalPage onBack={goHome} />;
      case 'Panic': return <PanicPage onBack={goHome} />;
      case 'Timer': return <TimerPage onBack={goHome} />;
      case 'Settings': return <SettingsPage onBack={goHome} />;
      case 'Contacts': return <ContactsPage onBack={goHome} />;
      case 'DiscreetMode': return <DiscreetModeSettingsPage onBack={goHome} />;
      default: return <HomePage onFakeCall={() => setFakeCallActive(true)} />;
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