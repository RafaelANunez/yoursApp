import React, { useState } from 'react';
import { Platform } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FakeCallSettingsPage = ({ onBack, settings, onSave }) => {
  // Initialize local state from the props passed down from App.js
  const [callerName, setCallerName] = useState(settings.callerName);
  const [screenHoldEnabled, setScreenHoldEnabled] = useState(settings.screenHoldEnabled);
  const [volumeHoldEnabled, setVolumeHoldEnabled] = useState(settings.volumeHoldEnabled);
  const [screenHoldDuration, setScreenHoldDuration] = useState(settings.screenHoldDuration);
  const [volumeHoldDuration, setVolumeHoldDuration] = useState(settings.volumeHoldDuration);

  const handleSave = async () => {
    try {
        const newSettings = {
            callerName,
            screenHoldEnabled,
            volumeHoldEnabled,
            screenHoldDuration,
            volumeHoldDuration,
        };
        // Update AsyncStorage
        await AsyncStorage.multiSet([
            ['@fake_call_caller_name', newSettings.callerName],
            ['@fake_call_screen_hold_enabled', String(newSettings.screenHoldEnabled)],
            ['@fake_call_volume_hold_enabled', String(newSettings.volumeHoldEnabled)],
            ['@fake_call_screen_hold_duration', String(newSettings.screenHoldDuration)],
            ['@fake_call_volume_hold_duration', String(newSettings.volumeHoldDuration)],
        ]);
        // Update the state in the parent App.js component
        onSave(newSettings);
        Alert.alert('Success', 'Settings saved successfully.');
    } catch (error) {
        Alert.alert('Error', 'Failed to save settings.');
    }
  };


  return (
    <View style={styles.fullPage}>
      <PageHeader title="Fake Call Settings" onBack={onBack} />
      <ScrollView style={styles.settingsContainer}>
        {/* Caller Information */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Caller Information</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Caller Name</Text>
            <TextInput
              style={styles.input}
              value={callerName}
              onChangeText={setCallerName}
              placeholder="Enter caller name"
            />
          </View>
        </View>

        {/* Triggers */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Triggers</Text>
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
                onChangeText={(text) => setScreenHoldDuration(parseInt(text, 10) || 0)}
                keyboardType="number-pad"
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
                onChangeText={(text) => setVolumeHoldDuration(parseInt(text, 10) || 0)}
                keyboardType="number-pad"
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