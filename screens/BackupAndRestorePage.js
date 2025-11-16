import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext'; // IMPORTED: To get the current user

// Use { navigation } from props
const BackupAndRestorePage = ({ navigation }) => {
  const { user } = useAuth(); // ADDED: Get the logged-in user
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const createBackup = async () => {
    // ADDED: Check if user is logged in
    if (!user?.email) {
      return Alert.alert('Error', 'You must be logged in to create a backup.');
    }
    setIsBackingUp(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();

      // --- MODIFIED: Filter for user-specific keys ---
      const userKeyPrefix = `@${user.email}_`;
      const userCredsKey = `@user_creds_${user.email}`;
      const userKeys = allKeys.filter(key =>
        key.startsWith(userKeyPrefix) || key === userCredsKey
      );

      // ADDED: Check if there's anything to back up
      if (userKeys.length === 0) {
        setIsBackingUp(false); // Stop loading
        return Alert.alert('No Data', 'There is no data to back up.');
      }

      // MODIFIED: Only get data for the current user
      const allData = await AsyncStorage.multiGet(userKeys);
      const backupObject = allData.reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

      const backupJson = JSON.stringify(backupObject, null, 2);
      // MODIFIED: Include user email in backup name for clarity
      const fileName = `YoursApp_Backup_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, backupJson);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Share or save your backup file',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      Alert.alert('Backup Failed', 'Could not create or share the backup file.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreBackup = async () => {
    // ADDED: Check if user is logged in
    if (!user?.email) {
      return Alert.alert('Error', 'You must be logged in to restore data.');
    }
    setIsRestoring(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });


      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const backupJson = await FileSystem.readAsStringAsync(fileUri);
        const backupObject = JSON.parse(backupJson);

        // --- MODIFIED: Filter keys to restore ---
        const userKeyPrefix = `@${user.email}_`;
        const userCredsKey = `@user_creds_${user.email}`;

        const keyValuePairs = Object.entries(backupObject);
        
        // Filter the backup file to only include pairs relevant to the *current* user
        const validPairs = keyValuePairs.filter(([key, value]) =>
            key.startsWith(userKeyPrefix) || key === userCredsKey
        );
        
        // ADDED: Check if the file contained any valid data
        if (validPairs.length === 0) {
           setIsRestoring(false); // Stop loading
           return Alert.alert('Restore Failed', 'This backup file contains no data for the current user.');
        }
        
        // ADDED: Warn if the file had other data (e.g., from a different user)
        if (validPairs.length < keyValuePairs.length) {
            Alert.alert('Warning', 'This backup file may contain data for a different user. Only data for the current user will be restored.');
        }

        // MODIFIED: Restore only the valid, user-specific data
        await AsyncStorage.multiSet(validPairs); 

        Alert.alert(
          'Restore Complete',
          'Your data has been restored. Please restart the app for the changes to take full effect.'
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Restore Failed', 'Could not read or apply the backup file.');
    } finally {
      setIsRestoring(false);
    }
  };


  return (
    <View style={styles.fullPage}>
      {/* Use navigation.goBack() instead of onBack */}
      <PageHeader title="Backup & Restore" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.description}>
          Create a backup of all your app data, including journal entries, contacts, and settings. You can save this file to your device, Google Drive, or send it via email.
        </Text>
        <TouchableOpacity
          style={[styles.button, isBackingUp && styles.buttonDisabled]}
          onPress={createBackup}
          disabled={isBackingUp}
        >
          <Text style={styles.buttonText}>{isBackingUp ? 'Creating Backup...' : 'Create Backup'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.description}>
          Restore your app data from a previously created backup file. This will overwrite all current data.
        </Text>
        <TouchableOpacity
          style={[styles.button, isRestoring && styles.buttonDisabled]}
          onPress={restoreBackup}
          disabled={isRestoring}
        >
          <Text style={styles.buttonText}>{isRestoring ? 'Restoring...' : 'Restore from Backup'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullPage: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#F87171',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#FECACA',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginVertical: 30,
  },
});

export default BackupAndRestorePage;