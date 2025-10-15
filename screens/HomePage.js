import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform } from 'react-native';

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
    <ImageBackground
      source={require('../assets/logo version1.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        textAlign: 'center',
        backgroundColor: 'transparent',
      },
      homeTitle: {
        fontSize: 47,
        fontWeight: 'normal',
        color: '#CD5F66',
        marginBottom: 5,
        fontFamily: Platform.OS === 'ios' ? 'SnellRoundhand' : 'cursive',
      },
      homeSubtitle: {
        fontSize: 18,
        color: '#291314',
      },
      backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      backgroundImageStyle: {
        resizeMode: 'contain',
        opacity: 0.3,
      }
});