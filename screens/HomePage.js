import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const HomePage = () => (
  <PageContainer>
    <Text style={styles.homeTitle}>Welcome to Yours</Text>
    <Text style={styles.homeSubtitle}>You are in a safe space.</Text>
  </PageContainer>
);

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        textAlign: 'center',
      },
      homeTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
      },
      homeSubtitle: {
        fontSize: 18,
        color: '#4B5563',
      },
});