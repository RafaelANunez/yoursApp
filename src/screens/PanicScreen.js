import React from "react";
import {View, Text, Button, StyleSheet} from 'react-native';

export const PanicPage = ({ onBack }) => {
    const { contacts } = useEmergencyContacts();
    const pressTimeout = React.useRef(null);
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
  
      // 1. Get Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
  
        // 2. Prepare Message
        const message = `Emergency! I need help. My current location is: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        const recipients = contacts.map(c => c.phone);
  
        // 3. Send SMS
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