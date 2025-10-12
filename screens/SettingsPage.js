import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PageHeader } from '../components/PageHeader';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const SettingsPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Settings" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>App settings and options will be here.</Text>
    </PageContainer>
  </View>
);

const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
    },
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        textAlign: 'center',
    },
    pageText: {
        fontSize: 16,
        color: '#6B7280',
    },
});