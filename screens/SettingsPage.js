import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext'; // IMPORTED: To get the logout function

// Takes { navigation } directly from props passed by Stack.Screen
export const SettingsPage = ({ navigation }) => {
  const { logout } = useAuth(); // ADDED: Get logout function from context

  const handleLogout = () => {
    try {
      // --- MODIFIED: Use the logout function from AuthContext ---
      logout();
      // Navigation is now handled automatically by App.js 
      // when the isLoggedIn state changes.
    } catch (e) {
      console.warn('Logout failed', e);
      Alert.alert('Error', 'Could not log out');
    }
  };

  return (
    <View style={styles.fullPage}>
      {/* Uses navigation.goBack() passed from Stack Navigator */}
      <PageHeader title="Settings" onBack={() => navigation.goBack()} />
      <View style={styles.pageContainer}>
        
        {/* --- ADDED: Link to User Profile Settings --- */}
        <TouchableOpacity 
          style={styles.buttonStyle} 
          onPress={() => navigation.navigate('UserProfileSettings')}
        >
             <Text style={styles.linkText}>User Profile</Text>
        </TouchableOpacity>
        
        {/* Uses navigation.navigate() */}
        <TouchableOpacity 
          style={styles.buttonStyle} 
          onPress={() => navigation.navigate('FakeCallSettings')}
        >
          <Text style={styles.linkText}>Fake Call Settings</Text>
        </TouchableOpacity>

        {/* --- ADDED: Link to Discreet Mode (from App.js) --- */}
        <TouchableOpacity 
          style={styles.buttonStyle} 
          onPress={() => navigation.navigate('DiscreetMode')}
        >
          <Text style={styles.linkText}>Discreet Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buttonStyle} 
          onPress={() => navigation.navigate('BackupAndRestore')}
        >
          <Text style={styles.linkText}>Backup & Restore</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.buttonStyle, { marginTop: 24 }]} // Keep top margin for last button
          onPress={handleLogout}
        >
          <Text style={[styles.linkText, { color: '#EF4444' }]}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles from the uploaded SettingsPage.js
const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
        backgroundColor: '#FFF8F8', 
    },
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    // --- ADDED: A wrapper style for the touchable ---
    buttonStyle: {
        width: '100%', // Make buttons full width
        marginBottom: 15, // Add spacing between buttons
    },
    linkText: {
        fontSize: 18,
        color: '#F87171',
        padding: 15,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 8,
        textAlign: 'center',
        // minWidth: 200, // Removed to allow full width
        backgroundColor: 'white', 
    },
});