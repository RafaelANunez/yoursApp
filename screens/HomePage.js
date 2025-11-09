import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform, Pressable, PanResponder } from 'react-native';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const HomePage = ({ 
  onFakeCall, 
  screenHoldEnabled, 
  screenHoldDuration, 
  onNavigateToJournal, 
  onOpenMenu, 
  navigation,
  route, // Ensure route is destructured here
  onTriggerSudoku 
}) => {
  const pressTimeout = useRef(null);

  // --- FIX: More reliable parameter listening ---
  useEffect(() => {
    // Add a listener that fires every time this screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
        // Check the current params on the route
        // We use 'route.params' which should be up-to-date if we used 'merge: true' in navigation
        if (route.params?.triggerFakeCall) {
            // Clear param immediately so it doesn't trigger again on next generic focus
            navigation.setParams({ triggerFakeCall: undefined });
            if (onFakeCall) onFakeCall();
        } 
        else if (route.params?.triggerSudoku) {
             navigation.setParams({ triggerSudoku: undefined });
             if (onTriggerSudoku) onTriggerSudoku();
        }
    });

    return unsubscribe;
  }, [navigation, route, onFakeCall, onTriggerSudoku]);
  // ---------------------------------------------

  const swipeUpGesture = Gesture.Fling()
    .direction(Directions.UP)
    .onEnd(() => {
      if (navigation) {
          navigation.navigate('SecondaryHome');
      }
    });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 50 && gestureState.dx > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50 && onOpenMenu) {
          onOpenMenu();
        }
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  const handlePressIn = () => {
    if (screenHoldEnabled) {
      pressTimeout.current = setTimeout(() => {
        onFakeCall();
      }, screenHoldDuration * 1000);
    }
  };

  const handlePressOut = () => {
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current);
    }
  };

  return (
    <GestureDetector gesture={swipeUpGesture}>
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
    </GestureDetector>
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