import React from 'react';
import { Platform } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsPage = ({ navigation, onBack, setCurrentPage }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@logged_in');
      // Optionally preserve credentials but clear logged in flag
      navigation.replace('Login');
    } catch (e) {
      console.warn('Logout failed', e);
      Alert.alert('Error', 'Could not log out');
    }
  };

  return (
    <View style={styles.fullPage}>
      {/* <PageHeader title="Settings" onBack={onBack} /> */}
      <View style={styles.pageContainer}>
        <TouchableOpacity onPress={() => setCurrentPage('FakeCallSettings')}>
          <Text style={styles.linkText}>Fake Call Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop: 20}} onPress={() => setCurrentPage('BackupAndRestore')}>
          <Text style={styles.linkText}>Backup & Restore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{marginTop: 24}} onPress={handleLogout}>
          <Text style={[styles.linkText, { color: '#EF4444' }]}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
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
    },
});


/* const handleLogout = async (navigation) => {
  await AsyncStorage.removeItem('@logged_in');
  navigation.replace('Login');
}; */
