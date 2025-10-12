import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { PageHeader } from '../components/PageHeader';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

export const PanicPage = ({ onBack }) => {
  const { contacts } = useEmergencyContacts();
  const pressTimeout = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulseAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );
  
  const handlePressIn = () => {
    pulseAnimation.start();
    pressTimeout.current = setTimeout(() => {
      triggerPanicAlert();
    }, 3000); // 3 seconds
  };

  const handlePressOut = () => {
    pulseAnimation.stop();
    scaleAnim.setValue(1);
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

  return (
    <View style={styles.fullPage}>
      <PageHeader title="Panic Mode" onBack={onBack} />
      <PageContainer>
        <Text style={styles.panicText}>In case of emergency, press and hold for 3 seconds.</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.sosButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.panicSubtext}>This will alert your emergency contacts and share your location.</Text>
      </PageContainer>
    </View>
  );
};

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
    panicText: {
        fontSize: 18,
        color: '#1F2937',
        textAlign: 'center',
    },
    sosButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sosButtonText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    panicSubtext: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 8,
        textAlign: 'center',
    },
});