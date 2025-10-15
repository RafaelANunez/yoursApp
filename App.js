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
  main

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