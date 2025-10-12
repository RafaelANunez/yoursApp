import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PageHeader } from '../components/PageHeader';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const TimerPage = ({ onBack }) => (
  <View style={styles.fullPage}>
    <PageHeader title="Safety Timer" onBack={onBack} />
    <PageContainer>
      <Text style={styles.pageText}>Set a timer for your safety. We'll check on you.</Text>
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