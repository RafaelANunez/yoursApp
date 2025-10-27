import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Takes { navigation } directly from props passed by Stack.Screen
export const SettingsPage = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@logged_in');
      // Replace the current navigation stack with Login screen
      navigation.replace('Login');
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
        {/* Uses navigation.navigate() */}
        <TouchableOpacity onPress={() => navigation.navigate('FakeCallSettings')}>
          <Text style={styles.linkText}>Fake Call Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.navigate('BackupAndRestore')}>
          <Text style={styles.linkText}>Backup & Restore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{marginTop: 24}} onPress={handleLogout}>
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
        backgroundColor: '#FFF8F8', // Added background color to match others
    },
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    linkText: {
        fontSize: 18,
        color: '#F87171',
        padding: 15,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 8,
        textAlign: 'center',
        minWidth: 200,
        backgroundColor: 'white', // Added background for better visibility
    },
});