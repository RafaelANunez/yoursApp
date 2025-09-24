import React, { useState } from 'react';
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
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

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
  let pressTimer;

  const handlePressIn = () => {
    pressTimer = setTimeout(() => {
      // This is where you would trigger the actual emergency alert
      // For now, it will just show a confirmation alert
      Alert.alert(
        "Emergency Alert",
        "Your emergency contacts have been notified and your location has been shared.",
        [{ text: "OK" }]
      );
    }, 3000); // 3 seconds
  };

  const handlePressOut = () => {
    clearTimeout(pressTimer);
  };

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Panic Mode" onBack={onBack} />
      <PageContainer>
        <Text style={styles.panicText}>In case of emergency, press and hold for 3 seconds.</Text>
        <TouchableOpacity
          style={styles.sosButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
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

const ContactsPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Emergency Contacts" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>Your trusted contacts will be listed here.</Text>
      <TouchableOpacity style={styles.floatingActionButton}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </PageContainer>
  </View>
);

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
                    <Text style={styles.sideMenuLinkText}>Contacts</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Pressable>
  </Modal>
);

// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isMenuOpen, setMenuOpen] = useState(false);

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
  },
  sideMenuLinkText: {
    textAlign: 'left',
    fontSize: 18,
    color: '#374151',
  },
});
