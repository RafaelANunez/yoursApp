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
  AppState, // <-- Add AppState
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PageHeader } from '../components/PageHeader';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Import Location
import * as Notifications from 'expo-notifications'; // <-- Add Notifications

// --- Constants ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const screenWidth = Dimensions.get('window').width;
const LAST_TIMER_KEY = '@last_timer_duration'; // Key for AsyncStorage
// --- NEW: Keys for background state sync ---
const TIMER_END_TIME_KEY = '@timer_end_time';
const TIMER_TOTAL_SECONDS_KEY = '@timer_total_seconds';


// --- Light Theme Colors ---
const mainColor = '#F87171'; // App's main pink color
const backgroundColor = '#FFF8F8'; // New light background
const textColor = '#1F2937'; // Dark gray for text
const dimmedTextColor = '#6B7280'; // Lighter dark gray
const buttonBackgroundColor = '#FCE7F3'; // Light pink for preset/modal buttons
const progressTrackColor = '#F3F4F6'; // Light gray for progress track
const progressPausedColor = '#D1D5DB'; // Medium gray for paused

const CIRCLE_RADIUS = screenWidth * 0.3;
const CIRCLE_STROKE_WIDTH = 10;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// --- Helper: Time Formatting ---
const formatTime = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// --- Helper: Wheel Picker Component ---
const WheelPicker = ({ data, selectedValue, onSelect, label }) => {
  const scrollViewRef = useRef(null);
  const wheelHeight = ITEM_HEIGHT * VISIBLE_ITEMS;

  useEffect(() => {
    const initialIndex = data.findIndex(item => item === selectedValue);
    if (initialIndex > -1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          y: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 0);
    }
  }, [data, selectedValue]);

  const handleScrollEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selected = data[Math.min(Math.max(index, 0), data.length - 1)];
    onSelect(selected);

    if (scrollViewRef.current && Math.abs(y - index * ITEM_HEIGHT) > 1) {
      scrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  return (
    <View style={styles.wheelContainer}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={[styles.wheel, { height: wheelHeight }]}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={{ paddingVertical: (wheelHeight - ITEM_HEIGHT) / 2 }}
        >
          {data.map((item) => (
            <View key={item} style={styles.wheelItem}>
              <Text style={[
                styles.wheelItemText,
                selectedValue === item && styles.wheelItemTextSelected
              ]}>
                {String(item).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.highlightOverlay} pointerEvents="none" />
      </View>
    </View>
  );
};

// --- Timer Page Component ---
export const TimerPage = ({ navigation }) => {
  const { contacts } = useEmergencyContacts();
  // Initialize state with default values, will be updated by useEffect
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(10);
  const [selectedSecond, setSelectedSecond] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true); // Loading state
  const intervalRef = useRef(null);
  
  // --- NEW: Add state for notification and AppState ---
  const [scheduledNotificationId, setScheduledNotificationId] = useState(null);
  const appState = useRef(AppState.currentState);

  // --- Modal State ---
  const [timerCompleteModalVisible, setTimerCompleteModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [shareLocation, setShareLocation] = useState(false);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i);

  // --- Load last timer duration on mount ---
  useEffect(() => {
    const loadLastTimer = async () => {
      try {
        const storedDuration = await AsyncStorage.getItem(LAST_TIMER_KEY);
        if (storedDuration) {
          const { hour, minute, second } = JSON.parse(storedDuration);
          setSelectedHour(hour);
          setSelectedMinute(minute);
          setSelectedSecond(second);
        }
        // else keep the initial default values (0h 10m 0s)
      } catch (error) {
        console.error('Error loading last timer duration:', error);
        // Keep default values on error
      } finally {
        setIsLoadingDefaults(false); // Finish loading
      }
    };

    loadLastTimer();
  }, []); // Run only once on mount

  // --- NEW: Handle Notification Permissions & Listeners ---
  useEffect(() => {
    // 1. Request permissions on mount
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications to be alerted when the timer finishes.');
      }
    })();

    // 2. Set handler for notifications that arrive while app is foregrounded
    // We don't want to show a popup if the app is already open,
    // because the `onTimerComplete` function will handle it.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // 3. Set listener for when a user TAPS a notification
    // This is how we open the modal from a background notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Timer finished! Show the modal.
      setTimerCompleteModalVisible(true);
      // We should also clear any stray timer data
      setSecondsLeft(0);
      setIsRunning(false);
      setTotalSeconds(0);
      AsyncStorage.removeItem(TIMER_END_TIME_KEY);
      AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []); // Run only once

  // --- NEW: Handle AppState changes (coming from background) ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      // Check if app is coming from background to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground! Let's re-sync the timer.
        const endTimeString = await AsyncStorage.getItem(TIMER_END_TIME_KEY);
        
        if (endTimeString) {
          const endTime = parseInt(endTimeString, 10);
          const now = Date.now();

          if (now >= endTime) {
            // Timer should have finished while we were gone!
            setSecondsLeft(0);
            setIsRunning(false);
            setTotalSeconds(0);
            await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
            await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
            // Show the modal, just in case the notification was missed/dismissed
            setTimerCompleteModalVisible(true); 
          } else {
            // Timer is still running, sync the secondsLeft
            const totalSecsString = await AsyncStorage.getItem(TIMER_TOTAL_SECONDS_KEY);
            const total = totalSecsString ? parseInt(totalSecsString, 10) : 0;
            const newSecondsLeft = Math.round((endTime - now) / 1000);

            setTotalSeconds(total);
            setSecondsLeft(newSecondsLeft);
            setIsRunning(true); // Resume the foreground interval
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []); // Run only once

  // --- Timer Logic (Foreground) ---
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsRunning(false);
            onTimerComplete(); // Trigger vibration and modal (foreground)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft]); // Note: We keep this existing logic for the *foreground* UI countdown

  // --- UPDATED: Timer Actions ---
  const startTimer = async () => {
    const total = selectedHour * 3600 + selectedMinute * 60 + selectedSecond;
    if (total <= 0) {
      Alert.alert('Invalid time', 'Please set a duration greater than 0 seconds.');
      return;
    }

    // --- Save the current duration (existing) ---
    try {
      const durationToSave = JSON.stringify({
        hour: selectedHour,
        minute: selectedMinute,
        second: selectedSecond,
      });
      await AsyncStorage.setItem(LAST_TIMER_KEY, durationToSave);
    } catch (error) {
      console.error('Error saving last timer duration:', error);
    }
    
    // --- NEW: Store end time for AppState sync ---
    const endTime = Date.now() + total * 1000;
    await AsyncStorage.setItem(TIMER_END_TIME_KEY, String(endTime));
    await AsyncStorage.setItem(TIMER_TOTAL_SECONDS_KEY, String(total));

    // --- NEW: Schedule the background notification ---
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Timer Finished!",
          body: "Your safety timer has run out. Open the app to choose an action.",
          sound: 'default', // Plays the default notification sound
        },
        trigger: { seconds: total }, // Fire exactly when the timer ends
      });
      setScheduledNotificationId(notificationId);
    } catch (e) {
      console.error('Error scheduling notification:', e);
    }
    // --- End New ---

    setTotalSeconds(total);
    setSecondsLeft(total);
    setIsRunning(true);
  };

  // --- UPDATED: pauseTimer ---
  const pauseTimer = async () => {
    // --- NEW: Cancel the notification and clear end time ---
    if (scheduledNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
      setScheduledNotificationId(null);
    }
    await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
    await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
    // --- End New ---

    setIsRunning(false);
  };

  // --- UPDATED: resumeTimer ---
  const resumeTimer = async () => {
    if (secondsLeft > 0) {
      // --- NEW: Re-schedule notification for the remaining time ---
      const endTime = Date.now() + secondsLeft * 1000;
      await AsyncStorage.setItem(TIMER_END_TIME_KEY, String(endTime));
      // (totalSeconds should still be correct in state)
      await AsyncStorage.setItem(TIMER_TOTAL_SECONDS_KEY, String(totalSeconds));

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Timer Finished!",
            body: "Your safety timer has run out. Open the app to choose an action.",
            sound: 'default',
          },
          trigger: { seconds: secondsLeft },
        });
        setScheduledNotificationId(notificationId);
      } catch (e) {
        console.error('Error scheduling notification:', e);
      }
      // --- End New ---

      setIsRunning(true);
    }
  };

  // --- UPDATED: cancelTimer ---
  const cancelTimer = async () => {
    // --- NEW: Cancel the notification and clear end time ---
    if (scheduledNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
      setScheduledNotificationId(null);
    }
    await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
    await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
    // --- End New ---

    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    // Don't reset selected values, keep the last used/loaded ones
  };

  const setPreset = (hours = 0, minutes = 0, seconds = 0) => {
    // Check if timer is running or paused, only allow preset setting if idle
    if (secondsLeft === 0 && !isRunning) {
        setSelectedHour(hours);
        setSelectedMinute(minutes);
        setSelectedSecond(seconds);
    } else {
        Alert.alert('Timer Active', 'Cannot set preset while timer is running or paused.');
    }
  };

  // --- UPDATED: Timer Completion (for foreground) ---
  const onTimerComplete = async () => {
    // --- NEW: Clear storage ---
    await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
    await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
    if (scheduledNotificationId) {
        // Just in case, try to cancel it
        try {
          await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
        } catch (e) {
          // Ignore error (it probably already fired)
        }
        setScheduledNotificationId(null);
    }
    // --- End New ---

    // Vibrate pattern: (existing)
    Vibration.vibrate(Platform.OS === 'android' ? [0, 500, 500, 500] : [500, 500, 500]);
    setTimerCompleteModalVisible(true);
  };

  // --- Location Permission ---
  const requestLocationPermissionsAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return false;
    }
    return true;
  };

  // --- Send Message Logic (from Modal) ---
  const sendMessage = async (messageType) => {
    let message = '';
    let forceLocation = false;

    switch (messageType) {
      case 'late':
        message = "I'm running late but I'm fine.";
        break;
      case 'emergency':
        message = "Something bad happened. Send help.";
        forceLocation = true; // Emergency always sends location
        break;
      case 'custom':
        if (!customMessage.trim()) {
          Alert.alert('Empty message', 'Please type a custom message.');
          return;
        }
        message = customMessage.trim();
        break;
      default:
        return;
    }

    const shouldShareLocation = shareLocation || forceLocation;

    try {
      if (!contacts || contacts.length === 0) {
        Alert.alert('No Contacts', 'You have no emergency contacts to message.');
        setTimerCompleteModalVisible(false);
        return;
      }
      const recipients = contacts.map(c => c.phone).filter(Boolean);
      if (recipients.length === 0) {
        Alert.alert('No Phone Numbers', 'Emergency contacts have no phone numbers.');
        setTimerCompleteModalVisible(false);
        return;
      }

      let name = 'Someone';
      const stored = await AsyncStorage.getItem('@user_credentials');
      if (stored) {
        const creds = JSON.parse(stored);
        if (creds.name) name = creds.name;
        else if (creds.email) name = creds.email.split('@')[0];
      }

      let fullMessage = `${name}: ${message}`;

      // Get Location if needed
      if (shouldShareLocation) {
        const hasPermission = await requestLocationPermissionsAsync();
        if (hasPermission) {
          try {
            let location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = location.coords;
            // Updated link format for Google Maps
            fullMessage += `\nMy location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          } catch (locationError) {
            console.error('Error getting location', locationError);
            fullMessage += '\n(Could not get current location.)';
          }
        } else {
          fullMessage += '\n(Location permission not granted.)';
        }
      }

      // Send SMS
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(recipients, fullMessage);
        Alert.alert('Message Sent', 'SMS composer opened.');
      } else {
        const first = recipients[0];
        const url = `sms:${first}?body=${encodeURIComponent(fullMessage)}`;
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          Alert.alert('Message Ready', 'SMS app opened.');
        } else {
          Alert.alert('Error', 'Could not open SMS app.');
        }
      }
    } catch (err) {
      console.error('Error notifying contacts', err);
      Alert.alert('Error', 'Could not notify contacts.');
    }

    // Reset modal and close
    setTimerCompleteModalVisible(false);
    setCustomMessage('');
    setShareLocation(false);
    cancelTimer(); // Reset timer after action
  };


  // --- Circular Progress Calculation ---
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress * CIRCLE_CIRCUMFERENCE;

  // --- Render Setup View ---
  const renderSetup = () => {
    // Show loading indicator while defaults are loading
    if (isLoadingDefaults) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mainColor} />
        </View>
      );
    }

    return (
      <>
        <Text style={styles.infoText}>
          Set a timer for your safety. If it runs out, you'll be prompted to message your emergency contacts.
        </Text>

        <View style={styles.wheelRow}>
          <WheelPicker data={HOURS} selectedValue={selectedHour} onSelect={setSelectedHour} label="HH" />
          <WheelPicker data={MINUTES_SECONDS} selectedValue={selectedMinute} onSelect={setSelectedMinute} label="MM" />
          <WheelPicker data={MINUTES_SECONDS} selectedValue={selectedSecond} onSelect={setSelectedSecond} label="SS" />
        </View>

        <View style={styles.presetContainer}>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(0, 10, 0)}>
            <Text style={styles.presetButtonText}>10:00</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(0, 45, 0)}>
            <Text style={styles.presetButtonText}>45:00</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(1, 0, 0)}>
            <Text style={styles.presetButtonText}>1:00:00</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.controlButton} onPress={startTimer}>
          {/* Play Icon */}
          <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}>
            <Path d="M8 5v14l11-7z" />
          </Svg>
        </TouchableOpacity>
      </>
    );
  };

  // --- Render Running View ---
  const renderRunning = () => {
    const endTime = new Date(Date.now() + secondsLeft * 1000);
    const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return (
      <>
        <View style={styles.progressContainer}>
          <Svg width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH}>
            {/* Background Circle */}
            <Circle
              cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              r={CIRCLE_RADIUS}
              stroke={progressTrackColor} // Light gray track
              strokeWidth={CIRCLE_STROKE_WIDTH}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              r={CIRCLE_RADIUS}
              stroke={mainColor} // Pink progress
              strokeWidth={CIRCLE_STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerDisplayRunning}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.endTimeText}>🏁 {endTimeString}</Text>
          </View>
        </View>

        <View style={styles.presetContainer}>
          <TouchableOpacity style={styles.presetButton} onPress={() => setSecondsLeft(prev => Math.max(0, prev + 600))}>
            <Text style={styles.presetButtonText}>+10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setSecondsLeft(prev => Math.max(0, prev + 300))}>
            <Text style={styles.presetButtonText}>+5 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={cancelTimer}>
            <Text style={styles.presetButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
          {/* Pause Icon */}
          <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}>
            <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </Svg>
        </TouchableOpacity>
      </>
    );
  };

  // --- Render Paused View ---
  const renderPaused = () => {
    const endTime = new Date(Date.now() + secondsLeft * 1000);
    const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (
      <>
        <View style={styles.progressContainer}>
          <Svg width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH}>
            <Circle
              cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              r={CIRCLE_RADIUS}
              stroke={progressTrackColor}
              strokeWidth={CIRCLE_STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2}
              r={CIRCLE_RADIUS}
              stroke={progressPausedColor} // Dimmed color when paused
              strokeWidth={CIRCLE_STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={[styles.timerDisplayRunning, { color: progressPausedColor }]}>{formatTime(secondsLeft)}</Text>
            <Text style={[styles.endTimeText, { color: progressPausedColor }]}>🏁 {endTimeString} (Paused)</Text>
          </View>
        </View>

        <View style={styles.presetContainer}>
          <TouchableOpacity style={styles.presetButton} onPress={cancelTimer}>
            <Text style={styles.presetButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.controlButton} onPress={resumeTimer}>
          {/* Play Icon */}
          <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}>
            <Path d="M8 5v14l11-7z" />
          </Svg>
        </TouchableOpacity>
      </>
    );
  };

  // --- Main Component Render ---
  return (
    <View style={styles.fullPage}>
      {/* Conditionally hide PageHeader when timer is running/paused */}
      {secondsLeft === 0 && !isRunning && (
        <PageHeader title="Timer" onBack={() => navigation.goBack()} />
      )}
      <View style={styles.pageContainer}>
        {/* Render different content based on timer state */}
        {secondsLeft === 0 && !isRunning ? renderSetup() : (isRunning ? renderRunning() : renderPaused())}
      </View>

      {/* --- Timer Completion Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={timerCompleteModalVisible}
        onRequestClose={() => {
          setTimerCompleteModalVisible(false);
          cancelTimer(); // Reset if modal is dismissed
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Timer Finished!</Text>
            <Text style={styles.modalSubtitle}>Choose an action:</Text>

            <TouchableOpacity style={styles.modalButton} onPress={() => sendMessage('late')}>
              <Text style={styles.modalButtonText}>Send: "I'm running late but I'm fine."</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => sendMessage('emergency')}>
              <Text style={styles.modalButtonText}>Send: "Something bad happened. Send help."</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.modalTextInput}
              placeholder="Or type a custom message..."
              placeholderTextColor={dimmedTextColor}
              value={customMessage}
              onChangeText={setCustomMessage}
            />
            <TouchableOpacity
              style={[styles.modalButton, !customMessage.trim() && styles.modalButtonDisabled]}
              onPress={() => sendMessage('custom')}
              disabled={!customMessage.trim()}
            >
              <Text style={styles.modalButtonText}>Send Custom Message</Text>
            </TouchableOpacity>

            <View style={styles.locationToggle}>
              <Text style={styles.locationToggleText}>Share Location (Optional)</Text>
              <Switch
                trackColor={{ false: progressPausedColor, true: mainColor }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={progressPausedColor}
                onValueChange={setShareLocation}
                value={shareLocation}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCloseButton]}
              onPress={() => {
                setTimerCompleteModalVisible(false);
                setCustomMessage('');
                setShareLocation(false);
                cancelTimer(); // Also reset the timer
              }}
            >
              <Text style={[styles.modalButtonText, styles.modalCloseButtonText]}>Cancel & Reset Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  fullPage: {
    flex: 1,
    backgroundColor: backgroundColor, // Light background
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly', // Changed from space-around
    paddingVertical: 20, // Reduced from 30
    paddingHorizontal: 20,
  },
  loadingContainer: { // Style for loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: dimmedTextColor,
    textAlign: 'center',
    marginBottom: 15, // Reduced from 20
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  // Wheel styles
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 25, // Reduced from 30
    width: '100%',
  },
  wheelContainer: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: screenWidth * 0.25,
  },
  wheelLabel: {
    fontSize: 14,
    color: dimmedTextColor,
    marginBottom: 8,
  },
  wheel: {
    width: '100%',
    overflow: 'hidden',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: Platform.OS === 'ios' ? 38 : 34,
    color: dimmedTextColor,
    fontWeight: '300',
  },
  wheelItemTextSelected: {
    fontSize: Platform.OS === 'ios' ? 44 : 40,
    color: mainColor, // Selected text is pink
    fontWeight: '500',
  },
  highlightOverlay: {
    position: 'absolute',
    top: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderColor: mainColor,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 5,
  },
  // Preset buttons
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 25, // Reduced from 30
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: buttonBackgroundColor, // Light pink
  },
  presetButtonText: {
    color: mainColor, // Pink text
    fontSize: 14,
    fontWeight: '500',
  },
  // Control Button (Play/Pause)
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: mainColor, // Pink button
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15, // Reduced from 20
    shadowColor: mainColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  // Styles for Running/Paused View
  progressContainer: {
    width: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    height: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30, // Reduced from 40
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDisplayRunning: {
    fontSize: 48,
    fontWeight: 'bold',
    color: mainColor, // Pink timer text
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  endTimeText: {
    fontSize: 16,
    color: dimmedTextColor,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF', // White background for modal
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25, // Reduced from 30
    paddingBottom: 30, // Reduced from 40
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: textColor,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: dimmedTextColor,
    textAlign: 'center',
    marginBottom: 15, // Reduced from 20
  },
  modalButton: {
    backgroundColor: buttonBackgroundColor,
    padding: 15,
    borderRadius: 10,
    marginBottom: 8, // Reduced from 10
    alignItems: 'center',
  },
  modalButtonText: {
    color: mainColor,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: progressTrackColor, // Light gray when disabled
  },
  modalTextInput: {
    height: 50,
    borderColor: progressPausedColor,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 8, // Reduced from 10
    fontSize: 16,
    color: textColor,
    backgroundColor: '#FFFFFF'
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12, // Reduced from 15
  },
  locationToggleText: {
    fontSize: 16,
    color: textColor,
  },
  modalCloseButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: dimmedTextColor,
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: dimmedTextColor,
  },
});