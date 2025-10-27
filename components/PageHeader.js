import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const PageHeader = ({ title, onBack }) => (
  <SafeAreaView edges={["top"]} style={styles.safeArea}>
    <View style={styles.appHeader}>
      <TouchableOpacity onPress={onBack} style={styles.headerButton}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FFE4E6',
        backgroundColor: '#FEF2F2',
      },
      safeArea: {
        backgroundColor: '#00ffddff'
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
      },
      headerButton: {
        padding: 8,
      },
      headerSpacer: {
        width: 40,
      },
      backButtonText: {
        fontSize: 30,
        color: '#4B5563',
        lineHeight: 32,
      },
});