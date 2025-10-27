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
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PageHeader } from '../components/PageHeader';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Import Location

// --- Constants ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const screenWidth = Dimensions.get('window').width;

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
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(10);
  const [selectedSecond, setSelectedSecond] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // --- Modal State ---
  const [timerCompleteModalVisible, setTimerCompleteModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [shareLocation, setShareLocation] = useState(true);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i);

  // --- Timer Logic ---
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsRunning(false);
            onTimerComplete(); // Trigger vibration and modal
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
  }, [isRunning, secondsLeft]);

  // --- Timer Actions ---
  const startTimer = () => {
    const total = selectedHour * 3600 + selectedMinute * 60 + selectedSecond;
    if (total <= 0) {
      Alert.alert('Invalid time', 'Please set a duration greater than 0 seconds.');
      return;
    }
    setTotalSeconds(total);
    setSecondsLeft(total);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    if (secondsLeft > 0) {
      setIsRunning(true);
    }
  };

  const cancelTimer = () => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setSelectedHour(0);
    setSelectedMinute(10);
    setSelectedSecond(0);
  };

  const setPreset = (hours = 0, minutes = 0, seconds = 0) => {
    setSelectedHour(hours);
    setSelectedMinute(minutes);
    setSelectedSecond(seconds);
  };

  // --- Timer Completion ---
  const onTimerComplete = () => {
    // Vibrate pattern: [wait, vibrate, wait, vibrate]
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
            fullMessage += `\nMy location: https://www.google.com/maps?q=${latitude},${longitude}`;
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
  const renderSetup = () => (
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
          <TouchableOpacity style={styles.presetButton} onPress={() => setSecondsLeft(prev => prev + 600)}>
            <Text style={styles.presetButtonText}>+10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setSecondsLeft(prev => prev + 300)}>
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