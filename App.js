import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { AppHeader } from './components/AppHeader';
import { SideMenu } from './components/SideMenu';
import { HomePage } from './screens/HomePage';
import { JournalPage } from './screens/JournalPage';
import { PanicPage } from './screens/PanicPage';
import { TimerPage } from './screens/TimerPage';
import { SettingsPage } from './screens/SettingsPage';
import { ContactsPage } from './screens/ContactsPage';
import { JournalProvider } from './context/JournalContext';
import { EmergencyContactsProvider } from './context/EmergencyContactsContext';
import { AutofillProvider } from './context/AutofillContext';
import { JournalIcon, AlertIcon, TimerIcon, SettingsIcon } from './components/icons';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isMenuOpen, setMenuOpen] = useState(false);
<<<<<<< Updated upstream
=======
  const [isFakeCallActive, setFakeCallActive] = useState(false);
>>>>>>> Stashed changes

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8',
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