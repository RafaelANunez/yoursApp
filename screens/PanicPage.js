import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { MenuIcon } from '../components/icons';

export const PanicPage = ({ onBack }) => {
  const { contacts } = useEmergencyContacts();
  const pressTimeout = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Animation for the button itself (slight pulse)
  const buttonPulseAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ])
  );

  // Animation for the surrounding waves
  const wavePulseAnimation = Animated.loop(
    Animated.timing(waveAnim, {
      toValue: 1,
      duration: 1500, // Duration for the wave to expand and fade
      useNativeDriver: true,
    })
  );

  const handlePressIn = () => {
    buttonPulseAnimation.start();
    wavePulseAnimation.start();
    pressTimeout.current = setTimeout(() => {
      triggerPanicAlert();
    }, 3000); // 3 seconds
  };

  const handlePressOut = () => {
    // Stop and reset all animations
    buttonPulseAnimation.stop();
    wavePulseAnimation.stop();
    scaleAnim.setValue(1);
    waveAnim.setValue(0);

    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current);
    }
  };

  const triggerPanicAlert = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add emergency contacts in the settings to use the panic button.'
      );
      return;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied.');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const message = `Emergency! I need help. My current location is: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const recipients = contacts.map(c => c.phone);

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(recipients, message);
        console.log('SMS sending result:', result);
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
      }
    } catch (error) {
      console.error("Failed to get location or send alert:", error);
      Alert.alert('Error', 'Could not get your location or send SMS. Please try again.');
    }
  };

  // Interpolate the wave animation for multiple concentric circles
  const createWaveStyle = (startScale, endScale, startOpacity) => ({
    ...styles.wave,
    transform: [
      {
        scale: waveAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [startScale, endScale],
        }),
      },
    ],
    opacity: waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [startOpacity, 0],
    }),
  });

  return (
    <View style={styles.fullPage}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
          <MenuIcon color="#C70039" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency</Text>
        <Image
          source={{ uri: 'https://placehold.co/40x40/F8C8DC/333333?text=U' }}
          style={styles.profileImage}
        />
      </View>

      <View style={styles.pageContainer}>
        {/* Placeholder for background elements from the image */}
        <View style={styles.backgroundDecor}>
            <Text style={styles.backgroundIcon}>☀️</Text>
            <Text style={styles.backgroundIcon}>☁️</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.sosButtonContainer}>
            <Animated.View style={createWaveStyle(1, 1.8, 0.3)} />
            <Animated.View style={createWaveStyle(1, 2.4, 0.2)} />
            <Animated.View style={createWaveStyle(1, 3.0, 0.1)} />
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.sosButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
              >
                <Text style={styles.sosButtonText}>SOS</Text>
                <Text style={styles.sosButtonSubtext}>Press for 3 seconds</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          <Text style={styles.calmText}>KEEP CALM!</Text>
          <Text style={styles.panicSubtext}>
            This will alert your emergency contacts and share your location.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    fullPage: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // SafeAreaView might be better
        paddingBottom: 10,
        backgroundColor: '#F8F9FA'
    },
    headerIcon: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C70039',
        letterSpacing: 1,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    backgroundDecor: {
        position: 'absolute',
        top: '10%',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        opacity: 0.2,
    },
    backgroundIcon: {
        fontSize: 60,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    sosButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 200,
        height: 200,
        marginBottom: 40,
    },
    wave: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 69, 58, 0.5)',
    },
    sosButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FF453A',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderWidth: 5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    sosButtonText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 2,
    },
    sosButtonSubtext: {
        fontSize: 14,
        color: 'white',
        marginTop: 4,
    },
    calmText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FF453A',
        textAlign: 'center',
        marginBottom: 12,
    },
    panicSubtext: {
        fontSize: 16,
        color: '#6C757D',
        textAlign: 'center',
        maxWidth: '80%',
    },
});