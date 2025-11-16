import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker'; 

// Define keys for the new settings
const PANIC_DURATION_KEY = '@panic_press_duration';
const RINGTONE_URI_KEY = '@fake_call_ringtone_uri';
const DEFAULT_PANIC_DURATION = 3;
const DEFAULT_RINGTONE_URI = 'assets/sounds/ringtone.mp3';

// Helper to safely parse and default a value
const safeParseInt = (text, defaultValue) => {
    const num = parseInt(text, 10);
    // Ensure the duration is a positive number (min 1 second for practical use)
    return isNaN(num) || num < 1 ? defaultValue : num;
};

// Helper to extract a display name from a URI
const getRingtoneName = (uri) => {
    if (!uri || uri === DEFAULT_RINGTONE_URI) return 'Default (ringtone.mp3)';
    // For local assets/files, split by '/' and take the last part
    const name = uri.substring(uri.lastIndexOf('/') + 1);
    return name || 'Custom Audio File';
};

// Use { navigation, settings, onSave } from props
const FakeCallSettingsPage = ({ navigation, settings, onSave }) => {
  // Initialize local state from the props passed down from App.js or assume defaults
  const [callerName, setCallerName] = useState(settings?.callerName || 'Unknown Caller');
  const [screenHoldEnabled, setScreenHoldEnabled] = useState(settings?.screenHoldEnabled || false);
  const [volumeHoldEnabled, setVolumeHoldEnabled] = useState(settings?.volumeHoldEnabled || false);
  const [screenHoldDuration, setScreenHoldDuration] = useState(settings?.screenHoldDuration || 0);
  const [volumeHoldDuration, setVolumeHoldDuration] = useState(settings?.volumeHoldDuration || 0);
  // ADDED State for Panic Duration
  const [panicDuration, setPanicDuration] = useState(DEFAULT_PANIC_DURATION);
  // ADDED State for Ringtone URI
  const [ringtoneUri, setRingtoneUri] = useState(DEFAULT_RINGTONE_URI);

  useEffect(() => {
    // Load settings on mount
    const loadSettings = async () => {
      try {
        // Load Panic Duration
        const duration = await AsyncStorage.getItem(PANIC_DURATION_KEY);
        if (duration !== null) {
          setPanicDuration(safeParseInt(duration, DEFAULT_PANIC_DURATION));
        }
        // Load Ringtone URI
        const uri = await AsyncStorage.getItem(RINGTONE_URI_KEY);
        if (uri !== null) {
          setRingtoneUri(uri);
        }
        
        // Load other settings (optional, but ensures UI sync)
        const storedCallerName = await AsyncStorage.getItem('@fake_call_caller_name');
        if (storedCallerName !== null) setCallerName(storedCallerName);
        
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
        const newSettings = {
            callerName,
            screenHoldEnabled,
            volumeHoldEnabled,
            // Use safeParseInt on durations before saving
            screenHoldDuration: safeParseInt(screenHoldDuration, 0),
            volumeHoldDuration: safeParseInt(volumeHoldDuration, 0),
            panicDuration: safeParseInt(panicDuration, DEFAULT_PANIC_DURATION), // NEW: Panic Duration
            ringtoneUri, // NEW: Ringtone URI
        };
        
        // Update AsyncStorage with all settings
        await AsyncStorage.multiSet([
            ['@fake_call_caller_name', newSettings.callerName],
            ['@fake_call_screen_hold_enabled', String(newSettings.screenHoldEnabled)],
            ['@fake_call_volume_hold_enabled', String(newSettings.volumeHoldEnabled)],
            ['@fake_call_screen_hold_duration', String(newSettings.screenHoldDuration)],
            ['@fake_call_volume_hold_duration', String(newSettings.volumeHoldDuration)],
            [PANIC_DURATION_KEY, String(newSettings.panicDuration)], // NEW: Panic Duration
            [RINGTONE_URI_KEY, newSettings.ringtoneUri], // NEW: Ringtone URI
        ]);

        // Update the state in the parent App.js component
        if (onSave) {
          onSave(newSettings);
        }
        Alert.alert('Success', 'Settings saved successfully.');
    } catch (error) {
        console.error("Save error:", error);
        Alert.alert('Error', 'Failed to save settings.');
    }
  };

  // --- NEW: Functionality for custom ringtone selector ---
  const handleRingtonePicker = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*', // Restrict to audio files
            copyToCacheDirectory: true, // Recommended for Android/iOS to ensure accessibility
        });

        // The DocumentPicker result now contains an 'assets' array
        if (result.canceled === false) {
            const asset = result.assets ? result.assets[0] : null;

            if (asset && asset.uri) {
                setRingtoneUri(asset.uri);
                Alert.alert("Success", `Ringtone set to: ${asset.name}`);
            }
        } else if (ringtoneUri !== DEFAULT_RINGTONE_URI) {
             // User cancelled, but one was already selected. Keep current selection.
             Alert.alert("Selection Cancelled", `The ringtone remains: ${getRingtoneName(ringtoneUri)}.`);
        }
    } catch (error) {
        console.error("Ringtone picker failed:", error);
        Alert.alert("Error", "Failed to select ringtone. Check your application permissions or ensure the correct Expo module is installed.");
    }
  };


  return (
    <View style={styles.fullPage}>
      {/* Use navigation.goBack() instead of onBack */}
      <PageHeader title="Fake Call Settings" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.settingsContainer}>
        {/* Caller Information */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Caller Information</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Caller Name</Text>
            <TextInput
              style={styles.inputWide} 
              value={callerName}
              onChangeText={setCallerName}
              placeholder="Enter caller name"
            />
          </View>
          
          {/* NEW: Ringtone Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Custom Ringtone</Text>
                <Text style={styles.subText}>Current: {getRingtoneName(ringtoneUri)}</Text>
            </View>
            <TouchableOpacity style={styles.selectButton} onPress={handleRingtonePicker}>
                <Text style={styles.selectButtonText}>Select Audio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Triggers */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Triggers</Text>
          
          {/* NEW: Panic Button Hold Duration Setting */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Panic Button Hold Duration (seconds)</Text>
            <TextInput
              style={styles.input}
              value={String(panicDuration)}
              onChangeText={(text) => setPanicDuration(safeParseInt(text, DEFAULT_PANIC_DURATION))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          {/* Screen Hold */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Screen Hold Trigger</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, screenHoldEnabled && styles.toggleActive]}
              onPress={() => setScreenHoldEnabled(!screenHoldEnabled)}
            >
              <View style={[styles.toggleCircle, screenHoldEnabled && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
          {screenHoldEnabled && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Screen Hold Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                value={String(screenHoldDuration)}
                onChangeText={(text) => setScreenHoldDuration(safeParseInt(text, 0))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          )}

          {/* Volume Button Hold */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Volume Button Trigger</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, volumeHoldEnabled && styles.toggleActive]}
              onPress={() => setVolumeHoldEnabled(!volumeHoldEnabled)}
            >
              <View style={[styles.toggleCircle, volumeHoldEnabled && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
          {volumeHoldEnabled && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Volume Hold Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                value={String(volumeHoldDuration)}
                onChangeText={(text) => setVolumeHoldDuration(safeParseInt(text, 0))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullPage: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  settingsContainer: {
    flex: 1,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  settingItem: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  subText: { 
      fontSize: 14,
      color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
    width: 80,
    textAlign: 'center'
  },
  inputWide: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
    flex: 0.5,
    textAlign: 'left'
  },
  selectButton: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  selectButtonText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#F87171',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#F87171',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FakeCallSettingsPage;