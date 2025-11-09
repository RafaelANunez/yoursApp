import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform, Pressable, PanResponder } from 'react-native';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const HomePage = ({ onFakeCall, screenHoldEnabled, screenHoldDuration, onNavigateToJournal, onOpenMenu }) => {
  const pressTimeout = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      // Activate if swipe starts within 50px of the left edge and is moving right
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 50 && gestureState.dx > 10;
      },
      // If swiped more than 50px to the right, trigger menu open
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50 && onOpenMenu) {
          onOpenMenu();
        }
      },
      // Ensure standard touches pass through if not swiping
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

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
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
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
            <Pressable
              onPress={onNavigateToJournal}
              style={({ pressed }) => [
                styles.journalButton,
                pressed && styles.journalButtonPressed
              ]}
            >
              {({ pressed }) => (
                <Text style={[styles.journalButtonText, pressed && styles.journalButtonTextPressed]}>
                  Go to Journal
                </Text>
              )}
            </Pressable>
          </PageContainer>
        </TouchableOpacity>
      </ImageBackground>
    </View>
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
      },
      journalButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: '#CD5F66',
        borderRadius: 20,
        backgroundColor: 'transparent',
      },
      journalButtonPressed: {
        backgroundColor: '#CD5F66',
      },
      journalButtonText: {
        color: '#CD5F66',
        fontSize: 16,
        fontWeight: 'bold',
      },
      journalButtonTextPressed: {
        color: 'white',
      },
});