import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';

export const SettingsPage = ({ onBack, setCurrentPage }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Settings" onBack={onBack} />
    <View style={styles.pageContainer}>
      <TouchableOpacity onPress={() => setCurrentPage('FakeCallSettings')}>
        <Text style={styles.linkText}>Fake Call Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{marginTop: 20}} onPress={() => setCurrentPage('BackupAndRestore')}>
        <Text style={styles.linkText}>Backup & Restore</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
    helperText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'left',
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 4,
    }
});