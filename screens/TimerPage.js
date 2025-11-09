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
  Vibration,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  AppState,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PageHeader } from '../components/PageHeader';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// --- Constants ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const screenWidth = Dimensions.get('window').width;
const LAST_TIMER_KEY = '@last_timer_duration';
const TIMER_END_TIME_KEY = '@timer_end_time';
const TIMER_TOTAL_SECONDS_KEY = '@timer_total_seconds';
const NOTIFICATION_CHANNEL_ID = 'timer-channel';

// --- Light Theme Colors ---
const mainColor = '#F87171';
const backgroundColor = '#FFF8F8';
const textColor = '#1F2937';
const dimmedTextColor = '#6B7280';
const buttonBackgroundColor = '#FCE7F3';
const progressTrackColor = '#F3F4F6';
const progressPausedColor = '#D1D5DB';

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
    if (initialIndex > -1) {
      const timeoutId = setTimeout(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                y: initialIndex * ITEM_HEIGHT,
                animated: false,
            });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []); 

  const handleScrollEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const selected = data[Math.min(Math.max(index, 0), data.length - 1)];
    if (selected !== selectedValue) {
        onSelect(selected);
    }
    if (scrollViewRef.current) {
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

// --- NOTIFICATION HANDLER SETUP ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// --- Timer Page Component ---
export const TimerPage = ({ navigation }) => {
  const { contacts } = useEmergencyContacts();
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(10);
  const [selectedSecond, setSelectedSecond] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  
  const intervalRef = useRef(null);
  const timerFinishTimeRef = useRef(null);
  const startTimestampRef = useRef(0); // NEW: Guard against immediate finish
  
  const [scheduledNotificationId, setScheduledNotificationId] = useState(null);
  const appState = useRef(AppState.currentState);

  const [timerCompleteModalVisible, setTimerCompleteModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [shareLocation, setShareLocation] = useState(false);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i);

  // --- Load last timer duration ---
  useEffect(() => {
    const loadLastTimer = async () => {
      try {
        const storedDuration = await AsyncStorage.getItem(LAST_TIMER_KEY);
        if (storedDuration) {
          const { hour, minute, second } = JSON.parse(storedDuration);
          setSelectedHour(Number(hour) || 0);
          setSelectedMinute(Number(minute) || 0);
          setSelectedSecond(Number(second) || 0);
        }
      } catch (error) {
        console.error('Error loading last timer duration:', error);
      } finally {
        setIsLoadingDefaults(false);
      }
    };
    loadLastTimer();
  }, []);

  // --- NOTIFICATION & APP STATE SETUP ---
  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'Safety Timer',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: mainColor,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Action Required', 'Please enable notifications.');
      }
    };

    setupNotifications();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("[TimerPage] Notification tapped.");
      stopForegroundTimer();
      setTimerCompleteModalVisible(true);
      cleanupTimerState();
    });

    return () => {
      if (responseListener && responseListener.remove) {
          responseListener.remove();
      }
    };
  }, []);

  // --- APP STATE HANDLING ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const endTimeString = await AsyncStorage.getItem(TIMER_END_TIME_KEY);
        if (endTimeString) {
          const endTime = parseInt(endTimeString, 10);
          const now = Date.now();
          if (now >= endTime) {
            stopForegroundTimer();
            setTimerCompleteModalVisible(true);
            cleanupTimerState();
          } else {
            const totalSecsString = await AsyncStorage.getItem(TIMER_TOTAL_SECONDS_KEY);
            const total = totalSecsString ? parseInt(totalSecsString, 10) : 0;
            setTotalSeconds(total);
            timerFinishTimeRef.current = endTime;
            setSecondsLeft(Math.max(1, Math.ceil((endTime - now) / 1000)));
            setIsRunning(true);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // --- HELPER: Stop & Cleanup ---
  const stopForegroundTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
  };

  const cleanupTimerState = async () => {
    timerFinishTimeRef.current = null;
    setSecondsLeft(0);
    setTotalSeconds(0);
    await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
    await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
  };

  // --- FOREGROUND TIMER LOGIC ---
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isRunning && timerFinishTimeRef.current !== null) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();

        // START GUARD: Don't allow finishing within 1s of starting
        if (now - startTimestampRef.current < 1000) return;

        const remaining = Math.ceil((timerFinishTimeRef.current - now) / 1000);

        if (__DEV__ && secondsLeft !== remaining && remaining >= 0 && remaining <= 5) { 
             console.log(`[TimerPage] Tick: ${remaining}s`);
        }

        if (remaining <= 0) {
          console.log("[TimerPage] Timer natural finish.");
          stopForegroundTimer();
          setSecondsLeft(0); 
          onTimerComplete();
        } else {
          setSecondsLeft(prev => (prev !== remaining ? remaining : prev));
        }
      }, 250);
    }

    return () => {
       if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]); 

  // --- ACTIONS ---
  const startTimer = async () => {
    if (isStarting) return;
    setIsStarting(true);

    Vibration.cancel(); 
    setTimerCompleteModalVisible(false);
    stopForegroundTimer();

    const h = Number(selectedHour) || 0;
    const m = Number(selectedMinute) || 0;
    const s = Number(selectedSecond) || 0;
    const total = (h * 3600) + (m * 60) + s;

    if (total <= 0) {
      Alert.alert('Invalid time', 'Please set a duration greater than 0 seconds.');
      setIsStarting(false);
      return;
    }

    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Small delay to let the modal fully close and state settle
      await new Promise(resolve => setTimeout(resolve, 50));

      const now = Date.now();
      startTimestampRef.current = now; // Mark start time
      // 500ms buffer for UI smoothness, ensures first tick isn't weird
      const targetEndTime = now + (total * 1000) + 500; 
      
      console.log(`[TimerPage] START. Duration: ${total}s. Target End: ${targetEndTime}`);

      timerFinishTimeRef.current = targetEndTime;
      setTotalSeconds(total);
      setSecondsLeft(total);
      setIsRunning(true);

      AsyncStorage.setItem(LAST_TIMER_KEY, JSON.stringify({ hour: h, minute: m, second: s }));
      AsyncStorage.setItem(TIMER_END_TIME_KEY, String(targetEndTime));
      AsyncStorage.setItem(TIMER_TOTAL_SECONDS_KEY, String(total));

      // Schedule notification DELAYED, and with a FRESH trigger calculation
      setTimeout(async () => {
          try {
            // Calculate a fresh trigger time based on NOW, not the old 'total'
            // giving it a 3s buffer from THIS MOMENT to ensure it doesn't race the UI.
            // This is a fallback for backgrounding anyway.
            const freshNow = Date.now();
            const remainingWhenScheduling = Math.max(1, Math.ceil((targetEndTime - freshNow) / 1000));
            const safeTriggerSeconds = remainingWhenScheduling + 3; 

            console.log(`[TimerPage] Scheduling notification for ${safeTriggerSeconds}s from now (relative).`);
            
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "圷 Timer Finished!",
                    body: "Tap here to open the app and choose an action.",
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    seconds: safeTriggerSeconds,
                    repeats: false,
                    channelId: Platform.OS === 'android' ? NOTIFICATION_CHANNEL_ID : undefined,
                },
            });
            setScheduledNotificationId(notificationId);
          } catch (err) {
              console.error("[TimerPage] Delayed schedule failed:", err);
          }
      }, 1000); // Wait a full second before even trying to schedule to avoid UI jank

    } catch (e) {
      console.error('[TimerPage] Error during start:', e);
      setIsRunning(false);
    } finally {
        setIsStarting(false);
    }
  };

  const pauseTimer = async () => {
    console.log("[TimerPage] Pausing.");
    stopForegroundTimer();
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch(e) {}
    setScheduledNotificationId(null);
    await AsyncStorage.removeItem(TIMER_END_TIME_KEY);
    await AsyncStorage.removeItem(TIMER_TOTAL_SECONDS_KEY);
  };

  const resumeTimer = async () => {
    if (secondsLeft > 0) {
        console.log(`[TimerPage] Resuming with ${secondsLeft}s left.`);
        const now = Date.now();
        startTimestampRef.current = now;
        const targetEndTime = now + (secondsLeft * 1000) + 500;
        
        timerFinishTimeRef.current = targetEndTime;
        setIsRunning(true);

        AsyncStorage.setItem(TIMER_END_TIME_KEY, String(targetEndTime));
        
        setTimeout(async () => {
             try {
                await Notifications.cancelAllScheduledNotificationsAsync();
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "圷 Timer Finished!",
                        body: "Tap here to open the app and choose an action.",
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                        seconds: secondsLeft + 3,
                        repeats: false,
                        channelId: Platform.OS === 'android' ? NOTIFICATION_CHANNEL_ID : undefined,
                    },
                });
             } catch (e) { console.error(e); }
        }, 500);
    }
  };

  const cancelTimer = async () => {
    console.log("[TimerPage] Cancelling manually.");
    stopForegroundTimer();
    cleanupTimerState();
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch(e) {}
    setScheduledNotificationId(null);
  };

  const setPreset = (hours = 0, minutes = 0, seconds = 0) => {
    if (secondsLeft === 0 && !isRunning) {
        setSelectedHour(hours);
        setSelectedMinute(minutes);
        setSelectedSecond(seconds);
    } else {
        Alert.alert('Timer Active', 'Cannot set preset while timer is running or paused.');
    }
  };

  const onTimerComplete = async () => {
    // Double check we didn't just start (less than 1s ago)
    if (Date.now() - startTimestampRef.current < 1000) {
         console.warn("[TimerPage] Premature completion detected, ignoring.");
         return;
    }

    console.log("[TimerPage] Timer finished in foreground.");
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch(e) {}
    await cleanupTimerState();
    Vibration.vibrate(Platform.OS === 'android' ? [0, 500, 500, 500] : [500, 500, 500]);
    setTimerCompleteModalVisible(true);
  };

  const requestLocationPermissionsAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return false;
    }
    return true;
  };

  const sendMessage = async (messageType) => {
    let message = '';
    let forceLocation = false;
    switch (messageType) {
      case 'late': message = "I'm running late but I'm fine."; break;
      case 'emergency': message = "Something bad happened. Send help."; forceLocation = true; break;
      case 'custom':
        if (!customMessage.trim()) { Alert.alert('Empty message', 'Please type a custom message.'); return; }
        message = customMessage.trim(); break;
      default: return;
    }
    const shouldShareLocation = shareLocation || forceLocation;
    try {
      if (!contacts || contacts.length === 0) {
         Alert.alert('No Contacts', 'You have no emergency contacts to message.'); setTimerCompleteModalVisible(false); return;
      }
      const recipients = contacts.map(c => c.phone).filter(Boolean);
      if (recipients.length === 0) {
         Alert.alert('No Phone Numbers', 'Emergency contacts have no phone numbers.'); setTimerCompleteModalVisible(false); return;
      }
      let name = 'Someone';
      const stored = await AsyncStorage.getItem('@user_credentials');
      if (stored) {
        const creds = JSON.parse(stored);
        if (creds.name) name = creds.name; else if (creds.email) name = creds.email.split('@')[0];
      }
      let fullMessage = `${name}: ${message}`;
      if (shouldShareLocation) {
        const hasPermission = await requestLocationPermissionsAsync();
        if (hasPermission) {
          try {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;
            fullMessage += `\nMy location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          } catch (locationError) {
            console.error('Error getting location', locationError); fullMessage += '\n(Could not get current location.)';
          }
        } else { fullMessage += '\n(Location permission not granted.)'; }
      }
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(recipients, fullMessage); Alert.alert('Message Sent', 'SMS composer opened.');
      } else {
        const first = recipients[0]; const url = `sms:${first}?body=${encodeURIComponent(fullMessage)}`;
        if (await Linking.canOpenURL(url)) { await Linking.openURL(url); Alert.alert('Message Ready', 'SMS app opened.'); }
        else { Alert.alert('Error', 'Could not open SMS app.'); }
      }
    } catch (err) { console.error('Error notifying contacts', err); Alert.alert('Error', 'Could not notify contacts.'); }
    setTimerCompleteModalVisible(false); setCustomMessage(''); setShareLocation(false); cancelTimer();
  };

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress * CIRCLE_CIRCUMFERENCE;

  const renderSetup = () => {
    if (isLoadingDefaults) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={mainColor} /></View>;
    return (
      <>
        <Text style={styles.infoText}>Set a timer for your safety. If it runs out, you'll be prompted to message your emergency contacts.</Text>
        <View style={styles.wheelRow}>
          <WheelPicker data={HOURS} selectedValue={selectedHour} onSelect={setSelectedHour} label="HH" />
          <WheelPicker data={MINUTES_SECONDS} selectedValue={selectedMinute} onSelect={setSelectedMinute} label="MM" />
          <WheelPicker data={MINUTES_SECONDS} selectedValue={selectedSecond} onSelect={setSelectedSecond} label="SS" />
        </View>
        <View style={styles.presetContainer}>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(0, 10, 0)}><Text style={styles.presetButtonText}>10:00</Text></TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(0, 45, 0)}><Text style={styles.presetButtonText}>45:00</Text></TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(1, 0, 0)}><Text style={styles.presetButtonText}>1:00:00</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.controlButton, isStarting && { opacity: 0.5 }]} onPress={startTimer} disabled={isStarting}>
          {isStarting ? <ActivityIndicator color={backgroundColor} /> : <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}><Path d="M8 5v14l11-7z" /></Svg>}
        </TouchableOpacity>
      </>
    );
  };

  const renderRunning = () => {
    const targetTime = timerFinishTimeRef.current || (Date.now() + secondsLeft * 1000);
    const endTime = new Date(targetTime);
    const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (
      <>
        <View style={styles.progressContainer}>
          <Svg width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH}>
            <Circle cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} r={CIRCLE_RADIUS} stroke={progressTrackColor} strokeWidth={CIRCLE_STROKE_WIDTH} fill="none" />
            <Circle cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} r={CIRCLE_RADIUS} stroke={mainColor} strokeWidth={CIRCLE_STROKE_WIDTH} fill="none" strokeDasharray={CIRCLE_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2})`} />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerDisplayRunning}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.endTimeText}>潤 {endTimeString}</Text>
          </View>
        </View>
        <View style={styles.presetContainer}>
          <TouchableOpacity style={styles.presetButton} onPress={() => {
             const newSecondsLeft = secondsLeft + 600;
             setSecondsLeft(newSecondsLeft);
             setTotalSeconds(prev => prev + 600);
             resumeTimer(); 
          }}><Text style={styles.presetButtonText}>+10 min</Text></TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={() => {
             const newSecondsLeft = secondsLeft + 300;
             setSecondsLeft(newSecondsLeft);
             setTotalSeconds(prev => prev + 300);
             resumeTimer();
          }}><Text style={styles.presetButtonText}>+5 min</Text></TouchableOpacity>
          <TouchableOpacity style={styles.presetButton} onPress={cancelTimer}><Text style={styles.presetButtonText}>Cancel</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
          <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}><Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></Svg>
        </TouchableOpacity>
      </>
    );
  };

  const renderPaused = () => {
     const targetTime = Date.now() + secondsLeft * 1000;
     const endTime = new Date(targetTime);
     const endTimeString = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
     return (
       <>
         <View style={styles.progressContainer}>
           <Svg width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH}>
             <Circle cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} r={CIRCLE_RADIUS} stroke={progressTrackColor} strokeWidth={CIRCLE_STROKE_WIDTH} fill="none" />
             <Circle cx={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} cy={CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} r={CIRCLE_RADIUS} stroke={progressPausedColor} strokeWidth={CIRCLE_STROKE_WIDTH} fill="none" strokeDasharray={CIRCLE_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2} ${CIRCLE_RADIUS + CIRCLE_STROKE_WIDTH / 2})`} />
           </Svg>
           <View style={styles.timerTextContainer}>
             <Text style={[styles.timerDisplayRunning, { color: progressPausedColor }]}>{formatTime(secondsLeft)}</Text>
             <Text style={[styles.endTimeText, { color: progressPausedColor }]}>潤 {endTimeString} (Paused)</Text>
           </View>
         </View>
         <View style={styles.presetContainer}>
           <TouchableOpacity style={styles.presetButton} onPress={cancelTimer}><Text style={styles.presetButtonText}>Cancel</Text></TouchableOpacity>
         </View>
         <TouchableOpacity style={styles.controlButton} onPress={resumeTimer}>
           <Svg width="32" height="32" viewBox="0 0 24 24" fill={backgroundColor}><Path d="M8 5v14l11-7z" /></Svg>
         </TouchableOpacity>
       </>
     );
   };

  return (
    <View style={styles.fullPage}>
      {secondsLeft === 0 && !isRunning && <PageHeader title="Timer" onBack={() => navigation.goBack()} />}
      <View style={styles.pageContainer}>
        {secondsLeft === 0 && !isRunning ? renderSetup() : (isRunning ? renderRunning() : renderPaused())}
      </View>
      <Modal key={timerCompleteModalVisible ? "visible" : "hidden"} animationType="slide" transparent={true} visible={timerCompleteModalVisible} onRequestClose={() => { setTimerCompleteModalVisible(false); cancelTimer(); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Timer Finished!</Text>
            <Text style={styles.modalSubtitle}>Choose an action:</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => sendMessage('late')}><Text style={styles.modalButtonText}>Send: "I'm running late but I'm fine."</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => sendMessage('emergency')}><Text style={styles.modalButtonText}>Send: "Something bad happened. Send help."</Text></TouchableOpacity>
            <TextInput style={styles.modalTextInput} placeholder="Or type a custom message..." placeholderTextColor={dimmedTextColor} value={customMessage} onChangeText={setCustomMessage} />
            <TouchableOpacity style={[styles.modalButton, !customMessage.trim() && styles.modalButtonDisabled]} onPress={() => sendMessage('custom')} disabled={!customMessage.trim()}><Text style={styles.modalButtonText}>Send Custom Message</Text></TouchableOpacity>
            <View style={styles.locationToggle}>
              <Text style={styles.locationToggleText}>Share Location (Optional)</Text>
              <Switch trackColor={{ false: progressPausedColor, true: mainColor }} thumbColor={'#FFFFFF'} ios_backgroundColor={progressPausedColor} onValueChange={setShareLocation} value={shareLocation} />
            </View>
            <TouchableOpacity style={[styles.modalButton, styles.modalCloseButton]} onPress={() => { setTimerCompleteModalVisible(false); setCustomMessage(''); setShareLocation(false); cancelTimer(); }}>
              <Text style={[styles.modalButtonText, styles.modalCloseButtonText]}>Cancel & Reset Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fullPage: { flex: 1, backgroundColor: backgroundColor },
  pageContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 20, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 16, color: dimmedTextColor, textAlign: 'center', marginBottom: 15, paddingHorizontal: 10, lineHeight: 22 },
  wheelRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 25, width: '100%' },
  wheelContainer: { alignItems: 'center', marginHorizontal: 5, width: screenWidth * 0.25 },
  wheelLabel: { fontSize: 14, color: dimmedTextColor, marginBottom: 8 },
  wheel: { width: '100%', overflow: 'hidden' },
  wheelItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  wheelItemText: { fontSize: Platform.OS === 'ios' ? 38 : 34, color: dimmedTextColor, fontWeight: '300' },
  wheelItemTextSelected: { fontSize: Platform.OS === 'ios' ? 44 : 40, color: mainColor, fontWeight: '500' },
  highlightOverlay: { position: 'absolute', top: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2, left: 0, right: 0, height: ITEM_HEIGHT, borderColor: mainColor, borderTopWidth: 1, borderBottomWidth: 1, borderRadius: 5 },
  presetContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginVertical: 25 },
  presetButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: buttonBackgroundColor },
  presetButtonText: { color: mainColor, fontSize: 14, fontWeight: '500' },
  controlButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: mainColor, justifyContent: 'center', alignItems: 'center', marginTop: 15, shadowColor: mainColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  progressContainer: { width: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH, height: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH, justifyContent: 'center', alignItems: 'center', marginVertical: 30 },
  timerTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  timerDisplayRunning: { fontSize: 48, fontWeight: 'bold', color: mainColor, marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  endTimeText: { fontSize: 16, color: dimmedTextColor },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContainer: { width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 30, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: textColor, textAlign: 'center', marginBottom: 10 },
  modalSubtitle: { fontSize: 16, color: dimmedTextColor, textAlign: 'center', marginBottom: 15 },
  modalButton: { backgroundColor: buttonBackgroundColor, padding: 15, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  modalButtonText: { color: mainColor, fontSize: 16, fontWeight: '500', textAlign: 'center' },
  modalButtonDisabled: { backgroundColor: progressTrackColor },
  modalTextInput: { height: 50, borderColor: progressPausedColor, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginVertical: 8, fontSize: 16, color: textColor, backgroundColor: '#FFFFFF' },
  locationToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  locationToggleText: { fontSize: 16, color: textColor },
  modalCloseButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: dimmedTextColor, marginTop: 10 },
  modalCloseButtonText: { color: dimmedTextColor },
});