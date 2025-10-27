import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  Dimensions,
  Platform,
  Vibration, // Import Vibration
  Modal, // Import Modal
  TextInput, // Import TextInput
  Switch, // Import Switch
  ActivityIndicator, // Added for loading state
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PageHeader } from '../components/PageHeader';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PageContainer = ({ children }) => (
    <View style={styles.pageContainer}>{children}</View>
);

// Constants used by both component and stylesheet
const ITEM_HEIGHT = 44;
const screenWidth = Dimensions.get('window').width;

export const TimerPage = ({ onBack }) => {
  const { contacts } = useEmergencyContacts();
  // selected values for wheels
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = Array.from({ length: 60 }, (_, i) => i);
  const wheelHeight = ITEM_HEIGHT * 5; // show 5 items

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const startTimer = () => {
    const hrs = parseInt(selectedHour, 10) || 0;
    const mins = parseInt(selectedMinute, 10) || 0;
    const total = hrs * 3600 + mins * 60;
    if (isNaN(total) || total <= 0) {
      Alert.alert('Invalid time', 'Enter a positive time (hours or minutes)');
      return;
    }
    setSecondsLeft(total);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const cancelTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(0);
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  const onTimerComplete = async () => {
    try {
      if (!contacts || contacts.length === 0) {
        Alert.alert('Timer ended', 'No emergency contacts configured.');
        return;
      }

      // Build recipients list
      const recipients = contacts.map(c => c.phone).filter(Boolean);
      if (recipients.length === 0) {
        Alert.alert('Timer ended', 'Emergency contacts have no phone numbers.');
        return;
      }

      // Get user name if available
      let name = 'Someone';
      try {
        const stored = await AsyncStorage.getItem('@user_credentials');
        if (stored) {
          const creds = JSON.parse(stored);
          if (creds.name) name = creds.name;
          else if (creds.email) name = creds.email.split('@')[0];
        }
      } catch (e) {
        // ignore
      }

      const message = `${name}'s safety timer ran out. Please check on them.`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // Send a single SMS composer to all recipients (user will need to send)
        await SMS.sendSMSAsync(recipients, message);
        Alert.alert('Notification', 'SMS composer opened to notify contacts.');
      } else {
        // Fallback: open default SMS app via Linking for the first recipient
        const first = recipients[0];
        const url = `sms:${first}?body=${encodeURIComponent(message)}`;
        const opened = await Linking.canOpenURL(url);
        if (opened) {
          await Linking.openURL(url);
          Alert.alert('Notification', 'SMS app opened to notify contacts.');
        } else {
          Alert.alert('Notification failed', 'Cannot open SMS app on this device.');
        }
      }
    } catch (err) {
      console.error('Error notifying contacts', err);
      Alert.alert('Error', 'Failed to notify emergency contacts.');
    }
  };

  return (
    <View style={styles.fullPage}>
      {/* <PageHeader title="Safety Timer" onBack={onBack} /> */}
      <PageContainer>
        <Text style={styles.pageText}>Set a timer for your safety. We'll contact your emergency contacts if needed.</Text>

        <View style={styles.wheelRow}>
          <View style={styles.wheelContainer}>
            <Text style={styles.wheelLabel}>Hours</Text>
            <View style={[styles.wheel, { height: wheelHeight }]}>
              <ScrollView
                ref={hourRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.round(y / ITEM_HEIGHT);
                  setSelectedHour(HOURS[Math.min(Math.max(idx, 0), HOURS.length - 1)]);
                }}
                contentContainerStyle={{ paddingVertical: (wheelHeight - ITEM_HEIGHT) / 2 }}
              >
                {HOURS.map(h => (
                  <View key={h} style={[styles.wheelItem, selectedHour === h && styles.wheelItemSelected]}>
                    <Text style={selectedHour === h ? styles.wheelItemTextSelected : styles.wheelItemText}>{h}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.wheelContainer}>
            <Text style={styles.wheelLabel}>Minutes</Text>
            <View style={[styles.wheel, { height: wheelHeight }]}>
              <ScrollView
                ref={minuteRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.round(y / ITEM_HEIGHT);
                  setSelectedMinute(MINUTES[Math.min(Math.max(idx, 0), MINUTES.length - 1)]);
                }}
                contentContainerStyle={{ paddingVertical: (wheelHeight - ITEM_HEIGHT) / 2 }}
              >
                {MINUTES.map(m => (
                  <View key={m} style={[styles.wheelItem, selectedMinute === m && styles.wheelItemSelected]}>
                    <Text style={selectedMinute === m ? styles.wheelItemTextSelected : styles.wheelItemText}>{m.toString().padStart(2,'0')}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <Text style={styles.timerDisplay}>{formatTime(secondsLeft)}</Text>

        <View style={styles.controlsRow}>
          {!isRunning ? (
            <TouchableOpacity style={styles.controlButton} onPress={startTimer}>
              <Text style={styles.controlText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
              <Text style={styles.controlText}>Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.controlButton, styles.cancelButton]} onPress={cancelTimer}>
            <Text style={[styles.controlText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

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
    pageText: {
        fontSize: 16,
        color: '#6B7280',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    input: {
      height: 44,
      width: 100,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      paddingHorizontal: 10,
      marginRight: 8,
      backgroundColor: 'white',
    },
    presetButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      marginLeft: 6,
    },
    timerDisplay: {
      fontSize: 42,
      marginTop: 24,
      fontWeight: '700',
      color: '#111827',
    },
    controlsRow: {
      flexDirection: 'row',
      marginTop: 20,
    },
    controlButton: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#F9A8D4',
      marginHorizontal: 8,
    },
    controlText: {
      color: 'white',
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: '#FFF5F5',
    },
    wheelRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    wheelContainer: {
      width: screenWidth * 0.35,
      alignItems: 'center',
      marginHorizontal: 6,
    },
    wheelLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
    },
    wheel: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
    },
    wheelItem: {
      height: ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wheelItemSelected: {
      // slightly larger / bold
    },
    wheelItemText: {
      color: '#374151'
    },
    wheelItemTextSelected: {
      color: '#111827',
      fontWeight: '700',
      fontSize: 18,
    },
});