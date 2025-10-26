import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PageHeader } from '../components/PageHeader';

// Use { navigation } from props
export const SettingsPage = ({ navigation }) => (
  <View style={styles.fullPage}>
    {/* Use navigation.goBack() instead of onBack */}
    <PageHeader title="Settings" onBack={() => navigation.goBack()} />
    <View style={styles.pageContainer}>
      {/* Use navigation.navigate() instead of setCurrentPage() */}
      <TouchableOpacity onPress={() => navigation.navigate('FakeCallSettings')}>
        <Text style={styles.linkText}>Fake Call Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.navigate('BackupAndRestore')}>
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
});