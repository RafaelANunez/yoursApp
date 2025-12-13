import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker'; 

// Define keys for the new settings
const PANIC_DURATION_KEY = '@panic_press_duration';
const RINGTONE_URI_KEY = '@fake_call_ringtone_uri';
const DEFAULT_PANIC_DURATION = 3;
const DEFAULT_RINGTONE_VALUE = 'DEFAULT'; // Sentinel value for the built-in ringtone

// Helper to safely parse and default a value
const safeParseInt = (text, defaultValue) => {
    const num = parseInt(text, 10);
    return isNaN(num) || num < 1 ? defaultValue : num;
};

// Helper to extract a display name from a URI
const getRingtoneName = (uri) => {
    if (!uri || uri === DEFAULT_RINGTONE_VALUE) return 'Default (ringtone.mp3)';
    const name = uri.substring(uri.lastIndexOf('/') + 1);
    return decodeURIComponent(name) || 'Custom Audio File';
};

const FakeCallSettingsPage = ({ navigation, settings, onSave }) => {
  const [callerName, setCallerName] = useState(settings?.callerName || 'Unknown Caller');
  const [screenHoldEnabled, setScreenHoldEnabled] = useState(settings?.screenHoldEnabled || false);
  const [volumeHoldEnabled, setVolumeHoldEnabled] = useState(settings?.volumeHoldEnabled || false);
  const [screenHoldDuration, setScreenHoldDuration] = useState(settings?.screenHoldDuration || 0);
  const [volumeHoldDuration, setVolumeHoldDuration] = useState(settings?.volumeHoldDuration || 0);
  
  // Persistent Settings
  const [panicDuration, setPanicDuration] = useState(DEFAULT_PANIC_DURATION);
  const [ringtoneUri, setRingtoneUri] = useState(DEFAULT_RINGTONE_VALUE);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const duration = await AsyncStorage.getItem(PANIC_DURATION_KEY);
        if (duration !== null) setPanicDuration(safeParseInt(duration, DEFAULT_PANIC_DURATION));

        const uri = await AsyncStorage.getItem(RINGTONE_URI_KEY);
        if (uri !== null) setRingtoneUri(uri);
        
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
            screenHoldDuration: safeParseInt(screenHoldDuration, 0),
            volumeHoldDuration: safeParseInt(volumeHoldDuration, 0),
            panicDuration: safeParseInt(panicDuration, DEFAULT_PANIC_DURATION),
            ringtoneUri,
        };
        
        await AsyncStorage.multiSet([
            ['@fake_call_caller_name', newSettings.callerName],
            ['@fake_call_screen_hold_enabled', String(newSettings.screenHoldEnabled)],
            ['@fake_call_volume_hold_enabled', String(newSettings.volumeHoldEnabled)],
            ['@fake_call_screen_hold_duration', String(newSettings.screenHoldDuration)],
            ['@fake_call_volume_hold_duration', String(newSettings.volumeHoldDuration)],
            [PANIC_DURATION_KEY, String(newSettings.panicDuration)],
            [RINGTONE_URI_KEY, newSettings.ringtoneUri],
        ]);

        if (onSave) onSave(newSettings);
        Alert.alert('Success', 'Settings saved successfully.');
    } catch (error) {
        console.error("Save error:", error);
        Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleRingtonePicker = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setRingtoneUri(result.assets[0].uri);
        }
    } catch (error) {
        console.error("Ringtone picker failed:", error);
        Alert.alert("Error", "Failed to select ringtone.");
    }
  };

  const resetRingtone = () => {
      setRingtoneUri(DEFAULT_RINGTONE_VALUE);
  };

  return (
    <View style={styles.fullPage}>
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
          
          {/* Ringtone Selection */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Ringtone</Text>
                <Text style={styles.subText} numberOfLines={1}>
                    {getRingtoneName(ringtoneUri)}
                </Text>
            </View>
            <View style={styles.buttonGroup}>
                {ringtoneUri !== DEFAULT_RINGTONE_VALUE && (
                    <TouchableOpacity style={[styles.miniButton, styles.resetButton]} onPress={resetRingtone}>
                        <Text style={styles.miniButtonText}>Default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.miniButton} onPress={handleRingtonePicker}>
                    <Text style={styles.miniButtonText}>Change</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Triggers */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Triggers</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Panic Button Hold (seconds)</Text>
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
              <Text style={styles.settingLabel}>Screen Hold Duration</Text>
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
              <Text style={styles.settingLabel}>Volume Hold Duration</Text>
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
  fullPage: { flex: 1, backgroundColor: '#FFF8F8' },
  settingsContainer: { flex: 1 },
  settingsSection: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 15, textTransform: 'uppercase' },
  settingItem: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flex: 1, marginRight: 10 },
  settingLabel: { fontSize: 16, fontWeight: '500', color: '#1F2937' },
  subText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 16, width: 60, textAlign: 'center', backgroundColor: '#FFF' },
  inputWide: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 16, flex: 0.6, textAlign: 'right', backgroundColor: '#FFF' },
  buttonGroup: { flexDirection: 'row', alignItems: 'center' },
  miniButton: { backgroundColor: '#FEE2E2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8, borderWidth: 1, borderColor: '#F87171' },
  resetButton: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  miniButtonText: { color: '#F87171', fontSize: 12, fontWeight: '600' },
  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: '#E5E7EB', justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: '#F87171' },
  toggleCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'white', alignSelf: 'flex-start' },
  toggleCircleActive: { alignSelf: 'flex-end' },
  saveButton: { backgroundColor: '#F87171', padding: 15, borderRadius: 8, margin: 20, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default FakeCallSettingsPage;