import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const HomePage = ({ onFakeCall, screenHoldEnabled, screenHoldDuration }) => {
  const pressTimeout = useRef(null);

  const handlePressIn = () => {
    if (screenHoldEnabled) {
      pressTimeout.current = setTimeout(() => {
        onFakeCall();
      }, screenHoldDuration * 1000); // Convert seconds to ms
    }
  };

  const handlePressOut = () => {
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current);
    }
  };

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <PageContainer>
        <Text style={styles.homeTitle}>Welcome to Yours</Text>
        <Text style={styles.homeSubtitle}>You are in a safe space.</Text>
      </PageContainer>
    </TouchableOpacity>
  );
};

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